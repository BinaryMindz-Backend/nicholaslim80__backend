import { Injectable, Logger } from '@nestjs/common';
import { NotificationType, StopStatus } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { EmailQueueService } from 'src/modules/queue/services/email-queue.service';




@Injectable()
export class NotificationRuleEngineService {
    private readonly logger = new Logger(NotificationRuleEngineService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly emailQueueService: EmailQueueService,
    ) { }

    // evaluate eta with eta minutes and eta km
    async evaluateEta(orderId: number, etaMinutes: number, etaKm: number) {
        const rules = await this.prisma.notificationRule.findMany({
            where: { isActive: true, triggerTag: { in: ['ETA_MINUTES', 'ETA_KM'] } },
        });

        if (rules.length === 0) return;

        for (const rule of rules) {
            const actual = rule.triggerTag === 'ETA_MINUTES' ? etaMinutes : etaKm;
            if (!this.matches(actual, rule.operator, Number(rule.targetValue))) continue;

            await this.fire(rule, orderId).catch((err) =>
                this.logger.error(`Failed firing rule "${rule.name}" for order ${orderId}: ${err.message}`),
            );
        }
    }

    // evaluate order status
    async evaluateStatus(orderId: number, statusTag: string) {
        const rules = await this.prisma.notificationRule.findMany({
            where: { isActive: true, triggerTag: 'ORDER_STATUS' },
        });

        if (rules.length === 0) return;

        for (const rule of rules) {
            if (!this.matches(statusTag, rule.operator, rule.targetValue)) continue;

            await this.fire(rule, orderId).catch((err) =>
                this.logger.error(`Failed firing rule "${rule.name}" for order ${orderId}: ${err.message}`),
            );
        }
    }

    // 
    async getMaxEtaGateRadiusKm(assumedAvgSpeedKmh = 20): Promise<number> {
        const DEFAULT_GATE_RADIUS_KM = 5;

        const rules = await this.prisma.notificationRule.findMany({
            where: { isActive: true, triggerTag: { in: ['ETA_KM', 'ETA_MINUTES'] } },
            select: { triggerTag: true, targetValue: true },
        });

        if (rules.length === 0) return DEFAULT_GATE_RADIUS_KM;

        const candidateRadiiKm = rules
            .map((rule) => {
                const value = Number(rule.targetValue);
                if (isNaN(value)) return null;

                if (rule.triggerTag === 'ETA_KM') {
                    return value; // already a km threshold
                }

                // ETA_MINUTES → worst-case km a driver could be at this many minutes,
                // assuming slow city traffic (assumedAvgSpeedKmh, default 20 km/h)
                return (value / 60) * assumedAvgSpeedKmh;
            })
            .filter((v): v is number => v !== null);

        if (candidateRadiiKm.length === 0) return DEFAULT_GATE_RADIUS_KM;

        return Math.max(...candidateRadiiKm, DEFAULT_GATE_RADIUS_KM);
    }




    private matches(
        actual: number | string,
        operator: string,
        target: number | string,
    ): boolean {
        switch (operator) {
            case 'LTE':
                return Number(actual) <= Number(target);
            case 'GTE':
                return Number(actual) >= Number(target);
            case 'EQ':
                return String(actual) === String(target);
            default:
                return false;
        }
    }

    private async fire(rule: any, orderId: number) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: {
                    select: {
                        id: true,
                        fcmToken: true,
                        phone: true,
                        profile: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                },
                assign_rider: {
                    include: { registrations: { select: { raider_name: true, } } },
                },
                orderStops: {
                    orderBy: { sequence: 'asc' },
                    include: { destination: true, payment: true },
                },
            },
        });
        if (!order) {
            this.logger.warn(`fire(): order ${orderId} not found, skipping rule "${rule.name}"`);
            return;
        }

        const activeStopIndex = this.getActiveStopIndex(order);
        const activeStop = order.orderStops[activeStopIndex];
        if (!activeStop) {
            this.logger.warn(`fire(): no active stop for order ${orderId}, skipping rule "${rule.name}"`);
            return;
        }

        // De-dupe: don't fire the same rule twice for the same order + active stop
        const alreadyFired = await this.prisma.firedNotification.findUnique({
            where: {
                ruleId_orderId_stopIndex: {
                    ruleId: rule.id,
                    orderId,
                    stopIndex: activeStopIndex,
                },
            },
        });
        if (alreadyFired) return;

        const driverName = order.assign_rider?.registrations?.[0]?.raider_name ?? 'Your driver';
        const title = this.resolveTags(rule.notifTitle, order, activeStop, rule, driverName);
        const message = this.resolveTags(rule.notifMessage, order, activeStop, rule, driverName);
        const orderNumber = `ORD-${String(order.id).padStart(6, '0')}`;

        // ── Sender (booking User) — has a real fcmToken, push works ──
        if (rule.sendToSender && order.user) {
            if (rule.viaPush) {
                await this.emailQueueService.queueOrderStatusNotification({
                    userId: order.user.id,
                    fcmToken: order.user.fcmToken ?? '',
                    orderId: order.id,
                    orderNumber,
                    status: NotificationType.ORDER_UPDATE,
                    title,
                    message,
                });
            }

            if (rule.viaWhatsApp) {
                await this.sendWhatsApp(order.user.phone.toString(), message);
            }

            if (rule.viaSMS) {
                await this.sendSms(order.user.phone.toString(), message);
            }
        }

        // ── Recipient (Destination.contact_number) — no User record, no push possible ──
        if (rule.sendToRecipient && activeStop.destination?.contact_number) {
            if (rule.viaWhatsApp) {
                await this.sendWhatsApp(activeStop.destination.contact_number.toString(), message);
            }

            if (rule.viaSMS) {
                await this.sendSms(activeStop.destination.contact_number.toString(), message);
            }

        }

        await this.prisma.firedNotification.create({
            data: { ruleId: rule.id, orderId, stopIndex: activeStopIndex },
        });

        this.logger.log(
            `Rule "${rule.name}" fired for order ${orderId}, stop index ${activeStopIndex} (seq ${activeStop.sequence})`,
        );
    }

    // resolve tags for notification message
    private resolveTags(
        template: string,
        order: any,
        stop: any,
        rule: any,
        driverName: string,
    ): string {
        const tagMap: Record<string, string> = {
            driver_name: driverName,
            sme_client_name: order.user?.name ?? '',
            sme_name: order.user?.name ?? '',
            recipient_name: stop.destination?.contact_name ?? '',
            delivery_address: stop.address ?? '',
            stop_sequence: String(stop.sequence),
            threshold: rule.targetValue,
        };

        return template.replace(/\{(\w+)\}/g, (match, key) =>
            key in tagMap ? tagMap[key] : match,
        );
    }

    // get active stop index
    private getActiveStopIndex(order: { orderStops: any[] }): number {
        return order.orderStops.findIndex(
            (s) => s.status !== StopStatus.COMPLETED && !s.is_skiped,
        );
    }

    // ── Stubs — replace once real services are wired in ──

    private async sendWhatsApp(phone: string | null | undefined, message: string) {
        if (!phone) return;
        // TODO: replace with real WhatsApp Business API call once built
        this.logger.warn(`[STUB] WhatsApp not yet integrated. Would send to ${phone}: "${message}"`);
    }

    private async sendSms(phone: string | null | undefined, message: string) {
        if (!phone) return;
        // TODO: wire to your existing Twilio SMS service, e.g.:
        // await this.smsService.send(phone, message);
        this.logger.warn(`[STUB] SMS service not yet wired here. Would send to ${phone}: "${message}"`);
    }
}