import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

import { CreateDeliveryTypeDto } from './dto/create-delivery-type.dto';
import { UpdateDeliveryTypeDto } from './dto/update-delivery-type.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { TimeUnit, UserRole } from '@prisma/client';
import type { IUser } from 'src/types';
import { DeliveryTypeQueryDto } from './dto/delivery_query.dto';



@Injectable()
export class DeliveryTypeService {
  constructor(private prisma: PrismaService) { }

  // ** check role
  private verifyAdmin(user: IUser) {
    if (user.roles[0].name !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access only');
    }
  }


  // create an delivery type
  async create(dto: CreateDeliveryTypeDto, user: IUser) {
    const isExist = await this.prisma.deliveryType.findFirst({
      where: { name: dto.name },
    });

    if (isExist) {
      throw new ConflictException('Delivery type already exists');
    }

    // convert to minutes
    const collectionMinutes =
      dto.collection_unit === TimeUnit.HOURS
        ? dto.collection_time * 60
        : dto.collection_time;

    const deliveryMinutes =
      dto.delivery_unit === TimeUnit.HOURS
        ? dto.delivery_time * 60
        : dto.delivery_time;

    const deliveryType = await this.prisma.deliveryType.create({
      data: {
        name: dto.name,
        description: dto.description,
        price_multiplier: dto.price_multiplier,

        collection_time: collectionMinutes,
        collection_unit: dto.collection_unit,

        delivery_time: deliveryMinutes,
        delivery_unit: dto.delivery_unit,

        allow_stack: dto.allow_stack ?? false,
        priority: dto.priority,
        is_active: dto.is_active ?? true,

        admin: {
          connect: { id: user.id },
        },

        vehicle_types: {
          create: dto.vehicle_type_ids.map((id) => ({
            vehicle_type: { connect: { id } },
          })),
        },
      },
      include: {
        vehicle_types: true,
      },
    });

    // লগ (basic log)
    await this.prisma.activityLog.create({
      data: {
        action: 'CREATE_DELIVERY_TYPE',
        entity_id: deliveryType.id,
        entity_type: 'DeliveryType',
        user_id: user.id,
        meta: deliveryType,
      },
    });

    return deliveryType;
  }

  // find all delivery type
  async findAll(query: DeliveryTypeQueryDto) {
    const { page = 1, limit = 10, is_active, priority } = query;

    const where: any = {};

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    if (priority) {
      where.priority = priority;
    }

    const [data, total] = await Promise.all([
      this.prisma.deliveryType.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { priority: 'desc' },
        include: {
          vehicle_types: {
            include: {
              vehicle_type: true,
            },
          },
        },
      }),
      this.prisma.deliveryType.count({ where }),
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


  // find one delivery type
  async findOne(id: number) {
    const item = await this.prisma.deliveryType.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Delivery type not found');
    return item;
  }

  // update one delivery type
  async update(id: number, data: UpdateDeliveryTypeDto, user: any) {
    this.verifyAdmin(user);

    const existing = await this.prisma.deliveryType.findUnique({
      where: { id },
      include: {
        vehicle_types: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Delivery type not found');
    }

    // Update
    const updated = await this.prisma.deliveryType.update({
      where: { id },
      data: {
        ...data,
        ...(data.vehicle_type_ids && {
          vehicle_types: {
            deleteMany: {},
            create: data.vehicle_type_ids.map((vId) => ({
              vehicle_type: { connect: { id: vId } },
            })),
          },
        }),
      },
      include: {
        vehicle_types: true,
      },
    });

    // Log (before vs after)
    await this.prisma.activityLog.create({
      data: {
        action: 'UPDATE',
        entity_type: 'DeliveryType',
        entity_id: id,
        user_id: user.id,
        meta: {
          before: existing,
          after: updated,
        },
      },
    });

    return updated;
  }

  async remove(id: number, user: any) {
    this.verifyAdmin(user);

    const existing = await this.prisma.deliveryType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Delivery type not found');
    }

    // Log BEFORE delete
    await this.prisma.activityLog.create({
      data: {
        action: 'DELETE',
        entity_type: 'DeliveryType',
        entity_id: id,
        user_id: user.id,
        meta: existing,
      },
    });

    return await this.prisma.deliveryType.delete({
      where: { id },
    });
  }
}
