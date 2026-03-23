import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateVehicleTypeDto } from './dto/create-vehicle-type.dto';
import { UpdateVehicleTypeDto } from './dto/update-vehicle-type.dto';
import type { IUser } from 'src/types';
import { VehicleTypeQueryDto } from './dto/vechecle_type.query.dto';

@Injectable()
export class VehicleTypeService {
  constructor(private readonly prisma: PrismaService) { }

  // CREATE
  async create(dto: CreateVehicleTypeDto, user: IUser) {
    const exists = await this.prisma.vehicleType.findFirst({
      where: {
        vehicle_type: dto.vehicle_type,
        vehicle_name: dto.vehicle_name,
      },
    });

    if (exists) {
      throw new ConflictException('Vehicle type already exists');
    }

    const admin = await this.prisma.admin.findFirst({
      where: { userId: user.id },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const vehicle = await this.prisma.vehicleType.create({
      data: {
        ...dto,
        admin: {
          connect: { id: admin.id },
        },
      },
    });

    // logs
    await this.prisma.activityLog.create({
      data: {
        action: 'CREATE',
        entity_type: 'VehicleType',
        entity_id: vehicle.id,
        user_id: user.id,
        meta: vehicle,
      },
    });

    return vehicle;
  }

  // FIND ALL ACTIVE
  async findAll(query: VehicleTypeQueryDto) {
    const { page = 1, limit = 10, isActive, vehicle_type } = query;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (vehicle_type) {
      where.vehicle_type = vehicle_type;
    }

    const [data, total] = await Promise.all([
      this.prisma.vehicleType.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'desc' },
      }),
      this.prisma.vehicleType.count({ where }),
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
  // FIND ONE ACTIVE
  async findOne(id: number) {
    const vehicle = await this.prisma.vehicleType.findUnique({ where: { id } });
    if (!vehicle || vehicle.isActive === false) {
      throw new NotFoundException('Vehicle type not found');
    }
    return vehicle;
  }

  // UPDATE
  async update(id: number, dto: UpdateVehicleTypeDto, user: IUser) {
    const existing = await this.prisma.vehicleType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Vehicle type not found');
    }

    const updated = await this.prisma.vehicleType.update({
      where: { id },
      data: dto,
    });

    // logs
    await this.prisma.activityLog.create({
      data: {
        action: 'UPDATE',
        entity_type: 'VehicleType',
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

  // DELETE
  async delete(id: number, user: IUser) {
    const existing = await this.prisma.vehicleType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Vehicle type not found');
    }

    const deleted = await this.prisma.vehicleType.delete({
      where: { id },
    });

    // logs
    await this.prisma.activityLog.create({
      data: {
        action: 'DELETE',
        entity_type: 'VehicleType',
        entity_id: id,
        user_id: user.id,
        meta: existing,
      },
    });

    return deleted;
  }

}
