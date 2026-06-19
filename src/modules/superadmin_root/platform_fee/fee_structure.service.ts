import {
  ConflictException, Injectable, NotFoundException, BadRequestException
} from '@nestjs/common';
import { UserFeeStructure } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { StandardCommissionRateService } from './commision_rate.services';
import { UpdateUserFeeStructureDto } from './dto/update-platform_fee.dto';
import { CreateUserFeeStructureDto } from './dto/create_ user_fee_structure.dto';

@Injectable()
export class UserFeeStructureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logServices: StandardCommissionRateService,
  ) { }

  //  helpers 

  /** Validates that every supplied zone id actually exists. */
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

  /** Builds a human-readable zone label for logs. */
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
    data: CreateUserFeeStructureDto,
    changedByRole: string,
    changedById: number,
  ): Promise<UserFeeStructure> {
    // Duplicate name check
    const existing = await this.prisma.userFeeStructure.findFirst({
      where: { fee_name: data.fee_name },
    });
    if (existing) throw new ConflictException('Record already exists');

    const zoneIds = data.service_area_ids ?? [];
    await this.validateZones(zoneIds);

    const record = await this.prisma.userFeeStructure.create({
      data: {
        applicable_user: data.applicable_user,
        fee_name: data.fee_name,
        amount: data.amount,
        applies_to: data.applies_to,
        rule_key: data.rule_key,
        rule_operator: data.rule_operator,
        rule_value: data.rule_value,
        condition_value: data.condition_value,
        condition_unit: data.condition_unit,
        is_active: data.is_active,
        // Create join rows for every selected zone
        serviceAreas: {
          create: zoneIds.map(id => ({ service_area_id: id })),
        },
      },
      include: { serviceAreas: { include: { serviceArea: true } } },
    });

    await this.logServices.createFeeLog({
      logType: record.applies_to,
      referenceId: record.id,
      applicableUser: record.applicable_user,
      serviceArea: await this.resolveZoneLabel(zoneIds),
      snapshot: record,
      changedByRole,
      changedById,
    });

    return record;
  }

  async findAll(): Promise<UserFeeStructure[]> {
    return this.prisma.userFeeStructure.findMany({
      include: {
        serviceAreas: { include: { serviceArea: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number): Promise<UserFeeStructure> {
    const record = await this.prisma.userFeeStructure.findUnique({
      where: { id },
      include: {
        serviceAreas: { include: { serviceArea: true } },
      },
    });
    if (!record) throw new NotFoundException('User fee structure not found');
    return record;
  }

  async update(
    id: number,
    data: UpdateUserFeeStructureDto,
    changedByRole: string,
    changedById: number,
  ): Promise<UserFeeStructure> {
    await this.findOne(id); // existence check

    const zoneIds = data.service_area_ids ?? [];
    await this.validateZones(zoneIds);

    const updated = await this.prisma.userFeeStructure.update({
      where: { id },
      data: {
        applicable_user: data.applicable_user,
        fee_name: data.fee_name,
        amount: data.amount,
        applies_to: data.applies_to,
        rule_key: data.rule_key,
        rule_operator: data.rule_operator,
        rule_value: data.rule_value,
        condition_value: data.condition_value,
        condition_unit: data.condition_unit,
        is_active: data.is_active,
        //  Full replace: wipe old zones, insert new ones
        serviceAreas: {
          deleteMany: {},
          create: zoneIds.map(id => ({ service_area_id: id })),
        },
      },
      include: { serviceAreas: { include: { serviceArea: true } } },
    });

    await this.logServices.createFeeLog({
      logType: updated.applies_to,
      referenceId: updated.id,
      applicableUser: updated.applicable_user,
      serviceArea: await this.resolveZoneLabel(zoneIds),
      snapshot: updated,
      changedByRole,
      changedById,
    });

    return updated;
  }

  async remove(id: number): Promise<UserFeeStructure> {
    await this.findOne(id);
    // Cascade on the join table handles zone rows automatically
    return this.prisma.userFeeStructure.delete({ where: { id } });
  }
}