import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { ActivityLogQueryDto } from './dto/activity_logs.dto';


@Injectable()
export class ActivityLogService {
    constructor(private readonly prisma: PrismaService) { }

    async findAllLogs(query: ActivityLogQueryDto) {
        const { page = 1, limit = 10, entity_type, action, user_id, search } = query;

        const where: any = {};

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


                // TODO: Add more entity types

                default:
                    where.OR = [
                        { action: { contains: search, mode: 'insensitive' } },
                        { meta: { string_contains: search } }, // fallback
                    ];
            }
        }

        // Fetch paginated results
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