import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FeeLogType, RaiderDeductionFee } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { StandardCommissionRateService } from './commision_rate.services';
import { UpdateRaiderDeductionFeeDto } from './dto/update-platform_fee.dto';
import { CreateRaiderDeductionFeeDto } from './dto/create_deduction_fee.dto';

@Injectable()
export class RaiderDeductionFeeService {
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
    data: CreateRaiderDeductionFeeDto,
    changedByRole: string,
    changedById: number,
  ): Promise<RaiderDeductionFee> {
    const zoneIds = data.service_area_ids ?? [];
    await this.validateZones(zoneIds);

    const record = await this.prisma.raiderDeductionFee.findFirst({
      where: { deduction_name: data.deduction_name },
    });
    if (record) throw new ConflictException('Record already exists');

    const r = await this.prisma.raiderDeductionFee.create({
      data: {
        applicable_user: data.applicable_user,
        deduction_name: data.deduction_name,
        amount: data.amount ?? 0,
        type: data.type,
        serviceAreas: {
          create: zoneIds.map(id => ({ service_area_id: id })),
        },
      },
      include: {
        serviceAreas: { include: { serviceArea: true } },
      },
    });

    await this.logServices.createFeeLog({
      logType: FeeLogType.RAIDER_DEDUCTION_FEE,
      referenceId: r.id,
      applicableUser: r.applicable_user,
      serviceArea: await this.resolveZoneLabel(zoneIds),
      snapshot: r,
      changedByRole,
      changedById,
    });

    return r;
  }

  async findAll(): Promise<RaiderDeductionFee[]> {
    return this.prisma.raiderDeductionFee.findMany({
      include: {
        serviceAreas: { include: { serviceArea: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number): Promise<RaiderDeductionFee> {
    const record = await this.prisma.raiderDeductionFee.findUnique({
      where: { id },
      include: {
        serviceAreas: { include: { serviceArea: true } },
      },
    });
    if (!record) throw new NotFoundException('Raider Deduction Fee not found');
    return record;
  }

  async update(
    id: number,
    data: UpdateRaiderDeductionFeeDto,
    changedByRole: string,
    changedById: number,
  ): Promise<RaiderDeductionFee> {
    await this.findOne(id);

    const zoneIds = data.service_area_ids ?? [];
    await this.validateZones(zoneIds);

    const updated = await this.prisma.raiderDeductionFee.update({
      where: { id },
      data: {
        applicable_user: data.applicable_user,
        deduction_name: data.deduction_name,
        amount: data.amount,
        type: data.type,
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
      logType: FeeLogType.RAIDER_DEDUCTION_FEE,
      referenceId: updated.id,
      applicableUser: updated.applicable_user,
      serviceArea: await this.resolveZoneLabel(zoneIds),
      snapshot: updated,
      changedByRole,
      changedById,
    });

    return updated;
  }

  async remove(id: number): Promise<RaiderDeductionFee> {
    await this.findOne(id);
    return this.prisma.raiderDeductionFee.delete({ where: { id } });
  }
}