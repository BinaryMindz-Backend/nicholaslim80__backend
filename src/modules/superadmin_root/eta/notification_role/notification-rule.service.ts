import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateNotificationRuleDto } from './dto/create-notification-rule.dto';
import { UpdateNotificationRuleDto } from './dto/update-notification-rule.dto';

@Injectable()
export class NotificationRuleService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateNotificationRuleDto, adminUserId: number) {
        this.validateChannelLogic(dto);
        this.validateMergeTags(dto.notifTitle);
        this.validateMergeTags(dto.notifMessage);

        const triggerExists = await this.prisma.triggerEvent.findUnique({
            where: { backendTag: dto.triggerTag },
        });

        if (!triggerExists) {
            throw new BadRequestException(
                `No TriggerEvent found with backendTag "${dto.triggerTag}"`,
            );
        }

        return this.prisma.$transaction(async (tx) => {
            const rule = await tx.notificationRule.create({
                data: dto,
            });

            await tx.activityLog.create({
                data: {
                    action: 'CREATE',
                    entity_type: 'NotificationRule',
                    user_id: adminUserId,
                    meta: {
                        type: 'CREATE_NOTIFICATION_RULE',
                        data: rule,
                    },
                },
            });

            return rule;
        });
    }

    async findAll() {
        return this.prisma.notificationRule.findMany({ orderBy: { createdAt: 'desc' } });
    }

    async findOne(id: string) {
        const rule = await this.prisma.notificationRule.findUnique({ where: { id } });
        if (!rule) throw new NotFoundException('Notification rule not found');
        return rule;
    }

    async update(
        id: string,
        dto: UpdateNotificationRuleDto,
        adminUserId: number,
    ) {
        const oldRule = await this.findOne(id);

        this.validateChannelLogic(dto);
        this.validateMergeTags(dto.notifTitle || '');
        this.validateMergeTags(dto.notifMessage || '');

        return this.prisma.$transaction(async (tx) => {
            const updatedRule = await tx.notificationRule.update({
                where: { id },
                data: dto,
            });

            await tx.activityLog.create({
                data: {
                    action: 'UPDATE',
                    entity_type: 'NotificationRule',
                    user_id: adminUserId,
                    meta: {
                        type: 'UPDATE_NOTIFICATION_RULE',
                        before: oldRule,
                        after: updatedRule,
                    },
                },
            });

            return updatedRule;
        });
    }

    async toggleActive(id: string, adminUserId: number) {
        const oldRule = await this.findOne(id);

        return this.prisma.$transaction(async (tx) => {
            const updatedRule = await tx.notificationRule.update({
                where: { id },
                data: {
                    isActive: !oldRule.isActive,
                },
            });

            await tx.activityLog.create({
                data: {
                    action: 'UPDATE',
                    entity_type: 'NotificationRule',
                    user_id: adminUserId,
                    meta: {
                        type: 'TOGGLE_NOTIFICATION_RULE',
                        before: {
                            isActive: oldRule.isActive,
                        },
                        after: {
                            isActive: updatedRule.isActive,
                        },
                    },
                },
            });

            return updatedRule;
        });
    }

    async remove(id: string, adminUserId: number) {
        const rule = await this.findOne(id);

        return this.prisma.$transaction(async (tx) => {
            await tx.notificationRule.delete({
                where: { id },
            });

            await tx.activityLog.create({
                data: {
                    action: 'DELETE',
                    entity_type: 'NotificationRule',
                    user_id: adminUserId,
                    meta: {
                        type: 'DELETE_NOTIFICATION_RULE',
                        deletedData: rule,
                    },
                },
            });

            return {
                success: true,
            };
        });
    }

    // Recipients (Destination.contact_number) have no fcmToken — push is impossible for them
    private validateChannelLogic(dto: Partial<CreateNotificationRuleDto>) {
        if (dto.sendToRecipient && dto.viaPush) {
            throw new BadRequestException(
                'Recipients have no registered account — push is not supported for them. Use WhatsApp or SMS.',
            );
        }
    }


    private readonly VALID_TAGS = new Set(
        AVAILABLE_MERGE_TAGS.map((t) => t.tag.replace(/[{}]/g, '')),
    );

    private validateMergeTags(template: string) {
        const found = template.match(/\{(\w+)\}/g) ?? [];
        const invalid = found.filter((t) => !this.VALID_TAGS.has(t.replace(/[{}]/g, '')));

        if (invalid.length > 0) {
            throw new BadRequestException(
                `Unknown merge tag(s): ${invalid.join(', ')}. Valid tags: ${[...this.VALID_TAGS].map(t => `{${t}}`).join(', ')}`,
            );
        }
    }

}

export const AVAILABLE_MERGE_TAGS = [
    { tag: '{driver_name}', label: 'Driver Name', example: 'John Tan' },
    { tag: '{sme_client_name}', label: 'Sender / SME Client Name', example: 'Acme Pte Ltd' },
    { tag: '{recipient_name}', label: 'Recipient Name', example: 'Sarah Lim' },
    { tag: '{delivery_address}', label: 'Delivery Address', example: '123 Orchard Rd' },
    { tag: '{stop_sequence}', label: 'Stop Number', example: '2' },
    { tag: '{threshold}', label: 'Rule Threshold Value', example: '10' },
] as const;
