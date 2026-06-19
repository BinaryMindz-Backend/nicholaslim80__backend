import { CreateRaiderCompensationRoleDto } from './dto/create_compensation_role.dto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FeeLogType, RaiderCompensationRole } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { UpdateRaiderCompensationRoleDto } from './dto/update-platform_fee.dto';
import { StandardCommissionRateService } from './commision_rate.services';

@Injectable()
export class RaiderCompensationRoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logServices: StandardCommissionRateService,
  ) { }

  //  helpers 
  private async validateZones(ids: number[]): Promise<void> {
    if (!ids.length) return;

    const found = await this.prisma.serviceZone.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    if (found.length !== ids.length) {
      const missing = ids.filter(id => !found.some(z => z.id === id));
      throw new NotFoundException(
        `Service area(s) not found: ${missing.join(', ')}`,
      );
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

  //  CRUD 
  async create(
    data: CreateRaiderCompensationRoleDto,
    changedByRole: string,
    changedById: number,
  ) {
    const zoneIds = data.service_area_ids ?? [];
    await this.validateZones(zoneIds);

    // Duplicate check: same scenario across any of the selected zones
    const conflict = await this.prisma.raiderCompensationRole.findFirst({
      where: {
        scenario: data.scenario,
        // If zones supplied — conflict only when sharing at least one zone
        ...(zoneIds.length && {
          serviceAreas: {
            some: { service_area_id: { in: zoneIds } },
          },
        }),
      },
    });
    if (conflict) throw new ConflictException('Record already exists');

    const record = await this.prisma.raiderCompensationRole.create({
      data: {
        applicable_user: data.applicable_user,
        scenario: data.scenario,
        commission_rate_delivery_fee: data.commission_rate_delivery_fee ?? 0,
        serviceAreas: {
          create: zoneIds.map(id => ({ service_area_id: id })),
        },
      },
      include: {
        serviceAreas: { include: { serviceArea: true } },
      },
    });

    await this.logServices.createFeeLog({
      logType: FeeLogType.RAIDER_COMPENSATION_ROLE,
      referenceId: record.id,
      applicableUser: record.applicable_user,
      serviceArea: await this.resolveZoneLabel(zoneIds),
      snapshot: record,
      changedByRole,
      changedById,
    });

    return record;
  }

  async findAll() {
    return this.prisma.raiderCompensationRole.findMany({
      include: {
        serviceAreas: { include: { serviceArea: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.raiderCompensationRole.findUnique({
      where: { id },
      include: {
        serviceAreas: { include: { serviceArea: true } },
      },
    });
    if (!record) throw new NotFoundException('Raider Compensation Role not found');
    return record;
  }

  async update(
    id: number,
    data: UpdateRaiderCompensationRoleDto,
    changedByRole: string,
    changedById: number,
  ) {
    await this.findOne(id); // existence check

    const zoneIds = data.service_area_ids ?? [];
    await this.validateZones(zoneIds);

    const updated = await this.prisma.raiderCompensationRole.update({
      where: { id },
      data: {
        applicable_user: data.applicable_user,
        scenario: data.scenario,
        commission_rate_delivery_fee: data.commission_rate_delivery_fee,
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
      logType: FeeLogType.RAIDER_COMPENSATION_ROLE,
      referenceId: updated.id,
      applicableUser: updated.applicable_user,
      serviceArea: await this.resolveZoneLabel(zoneIds),
      snapshot: updated,
      changedByRole,
      changedById,
    });

    return updated;
  }

  async remove(id: number): Promise<RaiderCompensationRole> {
    await this.findOne(id);
    // Cascade on join table handles zone rows automatically
    return this.prisma.raiderCompensationRole.delete({ where: { id } });
  }
}