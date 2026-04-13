import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { ActivityLogQueryDto } from './dto/activity_logs.dto';


@Injectable()
export class ActivityLogService {
    constructor(private readonly prisma: PrismaService) { }

    async log(data: {
        action: 'CREATE' | 'UPDATE' | 'DELETE';
        entityType: string;
        entityId: number;
        userId: number;
        meta?: any;
    }) {
        return this.prisma.activityLog.create({
            data: {
                action: data.action,
                entity_type: data.entityType,
                entity_id: data.entityId,
                user_id: data.userId,
                meta: data.meta ?? null,
            },
        });
    }

async findAllLogs(query: ActivityLogQueryDto) {
    const {
        page = 1,
        limit = 10,
        entity_type,
        action,
        user_id,
        search,
        fromDate,
        toDate,
    } = query;

    const where: any = {};

    // Date range filter
    if (fromDate || toDate) {
        where.created_at = {};

        if (fromDate) {
            where.created_at.gte = new Date(fromDate);
        }

        if (toDate) {
            // include full day (important)
            const endDate = new Date(toDate);
            endDate.setHours(23, 59, 59, 999);
            where.created_at.lte = endDate;
        }
    }

    // Filter by entity type
    if (entity_type) {
        where.entity_type = entity_type;
    }

    // Filter by action
    if (action) {
        where.action = action;
    }

    // Filter by user
    if (user_id) {
        where.user_id = user_id;
    }

    // Search scoped to entity
    if (search && entity_type) {
        switch (entity_type) {
            case 'DeliveryType':
                where.OR = [
                    { action: { contains: search, mode: 'insensitive' } },
                    { meta: { path: ['name'], string_contains: search } },
                ];
                break;

            case 'VehicleType':
                where.OR = [
                    { action: { contains: search, mode: 'insensitive' } },
                    { meta: { path: ['vehicle_name'], string_contains: search } },
                ];
                break;

            default:
                where.OR = [
                    { action: { contains: search, mode: 'insensitive' } },
                    { meta: { string_contains: search } },
                ];
        }
    }

    const [data, total] = await Promise.all([
        this.prisma.activityLog.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { created_at: 'desc' },
        }),
        this.prisma.activityLog.count({ where }),
    ]);

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

}