import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateTriggerEventDto } from './dto/create-trigger-event.dto';
import { UpdateTriggerEventDto } from './dto/ update-trigger-event.dto';


@Injectable()
export class TriggerEventService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateTriggerEventDto, adminUserId: number) {
        const existing = await this.prisma.triggerEvent.findUnique({
            where: { backendTag: dto.backendTag },
        });

        if (existing) {
            throw new ConflictException(
                `backendTag "${dto.backendTag}" already exists`,
            );
        }

        return this.prisma.$transaction(async (tx) => {
            const event = await tx.triggerEvent.create({
                data: dto,
            });

            await tx.activityLog.create({
                data: {
                    action: 'CREATE',
                    entity_type: 'TriggerEvent',
                    user_id: adminUserId,
                    meta: {
                        type: 'CREATE_TRIGGER_EVENT',
                        data: event,
                    },
                },
            });

            return event;
        });
    }

    async findAll() {
        return this.prisma.triggerEvent.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const event = await this.prisma.triggerEvent.findUnique({
            where: { id },
        });

        if (!event) {
            throw new NotFoundException('Trigger event not found');
        }

        return event;
    }

    async update(
        id: string,
        dto: UpdateTriggerEventDto,
        adminUserId: number,
    ) {
        const oldEvent = await this.findOne(id);

        return this.prisma.$transaction(async (tx) => {
            const updatedEvent = await tx.triggerEvent.update({
                where: { id },
                data: dto,
            });

            await tx.activityLog.create({
                data: {
                    action: 'UPDATE',
                    entity_type: 'TriggerEvent',
                    user_id: adminUserId,
                    meta: {
                        type: 'UPDATE_TRIGGER_EVENT',
                        before: oldEvent,
                        after: updatedEvent,
                    },
                },
            });

            return updatedEvent;
        });
    }

    async toggleActive(id: string, adminUserId: number) {
        const oldEvent = await this.findOne(id);

        return this.prisma.$transaction(async (tx) => {
            const updatedEvent = await tx.triggerEvent.update({
                where: { id },
                data: {
                    isActive: !oldEvent.isActive,
                },
            });

            await tx.activityLog.create({
                data: {
                    action: 'UPDATE',
                    entity_type: 'TriggerEvent',
                    user_id: adminUserId,
                    meta: {
                        type: 'TOGGLE_TRIGGER_EVENT',
                        before: {
                            isActive: oldEvent.isActive,
                        },
                        after: {
                            isActive: updatedEvent.isActive,
                        },
                    },
                },
            });

            return updatedEvent;
        });
    }

    async remove(id: string, adminUserId: number) {
        const event = await this.findOne(id);

        return this.prisma.$transaction(async (tx) => {
            await tx.triggerEvent.delete({
                where: { id },
            });

            await tx.activityLog.create({
                data: {
                    action: 'DELETE',
                    entity_type: 'TriggerEvent',
                    user_id: adminUserId,
                    meta: {
                        type: 'DELETE_TRIGGER_EVENT',
                        deletedData: event,
                    },
                },
            });

            return {
                success: true,
            };
        });
    }
}