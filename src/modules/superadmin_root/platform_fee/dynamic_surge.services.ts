import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FeeLogType, UserDynamicSurge } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { StandardCommissionRateService } from './commision_rate.services';
import { UpdateUserDynamicSurgeDto } from './dto/update-platform_fee.dto';
import { CreateUserDynamicSurgeDto } from './dto/create_dynamic_surge.dto';

@Injectable()
export class UserDynamicSurgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logServices: StandardCommissionRateService,
  ) { }

  private async validateZones(ids: number[]): Promise<void> {
    if (!ids.length) return;
    const found = await this.prisma.serviceZone.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    if (found.length !== ids.length) {
      const missing = ids.filter(id => !found.some(z => z.id === id));
      throw new NotFoundException(`Service area(s) not found: ${missing.join(', ')}`);
    }
  }

  private async resolveZoneLabel(ids: number[]): Promise<string> {
    if (!ids.length) return 'ALL ZONES';
    const zones = await this.prisma.serviceZone.findMany({
      where: { id: { in: ids } },
      select: { name: true },
    });
    return zones.map(z => z.name).join(', ');
  }

  async create(
    data: CreateUserDynamicSurgeDto,
    changedByRole: string,
    changedById: number,
  ): Promise<UserDynamicSurge> {
    const zoneIds = data.service_area_ids ?? [];
    await this.validateZones(zoneIds);

    const record = await this.prisma.userDynamicSurge.findFirst({
      where: { role_name: data.role_name },
    });
    if (record) throw new ConflictException('Record already exists');

    const r = await this.prisma.userDynamicSurge.create({
      data: {
        applicable_user: data.applicable_user,
        role_name: data.role_name,
        price_multiplier: data.price_multiplier,
        condition: data.condition,
        time_range: data.time_range,
        is_active: data.is_active ?? true,
        serviceAreas: {
          create: zoneIds.map(id => ({ service_area_id: id })),
        },
      },
      include: {
        serviceAreas: { include: { serviceArea: true } },
      },
    });

    await this.logServices.createFeeLog({
      logType: FeeLogType.USER_DYNAMIC_SURGE,
      referenceId: r.id,
      applicableUser: r.applicable_user,
      serviceArea: await this.resolveZoneLabel(zoneIds),
      snapshot: r,
      changedByRole,
      changedById,
    });

    return r;
  }

  async findAll(): Promise<UserDynamicSurge[]> {
    return this.prisma.userDynamicSurge.findMany({
      include: {
        serviceAreas: { include: { serviceArea: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number): Promise<UserDynamicSurge> {
    const record = await this.prisma.userDynamicSurge.findUnique({
      where: { id },
      include: {
        serviceAreas: { include: { serviceArea: true } },
      },
    });
    if (!record) throw new NotFoundException('Dynamic surge record not found');
    return record;
  }

  async update(
    id: number,
    data: UpdateUserDynamicSurgeDto,
    changedByRole: string,
    changedById: number,
  ): Promise<UserDynamicSurge> {
    await this.findOne(id);

    const zoneIds = data.service_area_ids ?? [];
    await this.validateZones(zoneIds);

    const updated = await this.prisma.userDynamicSurge.update({
      where: { id },
      data: {
        applicable_user: data.applicable_user,
        role_name: data.role_name,
        price_multiplier: data.price_multiplier,
        condition: data.condition,
        time_range: data.time_range,
        is_active: data.is_active,
        serviceAreas: {
          deleteMany: {},
          create: zoneIds.map(id => ({ service_area_id: id })),
        },
      },
      include: {
        serviceAreas: { include: { serviceArea: true } },
      },
    });

    await this.logServices.createFeeLog({
      logType: FeeLogType.USER_DYNAMIC_SURGE,
      referenceId: updated.id,
      applicableUser: updated.applicable_user,
      serviceArea: await this.resolveZoneLabel(zoneIds),
      snapshot: updated,
      changedByRole,
      changedById,
    });

    return updated;
  }

  async updateStatus(id: number): Promise<UserDynamicSurge> {
    const r = await this.findOne(id);
    return this.prisma.userDynamicSurge.update({
      where: { id },
      data: { is_active: !r.is_active },
    });
  }

  async remove(id: number): Promise<UserDynamicSurge> {
    await this.findOne(id);
    return this.prisma.userDynamicSurge.delete({ where: { id } });
  }
}