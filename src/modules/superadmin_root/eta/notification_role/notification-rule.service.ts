import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateNotificationRuleDto } from './dto/create-notification-rule.dto';
import { UpdateNotificationRuleDto } from './dto/update-notification-rule.dto';

@Injectable()
export class NotificationRuleService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateNotificationRuleDto, adminUserId: number) {
        this.validateChannelLogic(dto);

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
}