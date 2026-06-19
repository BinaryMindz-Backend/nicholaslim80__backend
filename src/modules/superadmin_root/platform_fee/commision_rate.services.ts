import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateStandardCommissionRateDto } from './dto/create-commission_rate.dto';
import { UpdateStandardCommissionRateDto } from './dto/update-platform_fee.dto';
import { ApplicableTyp, FeeLogType } from '@prisma/client';
import { FeeLogFilterDto } from './dto/fee-logs-filter.dto';

@Injectable()
export class StandardCommissionRateService {
  constructor(private readonly prisma: PrismaService) { }

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
    data: CreateStandardCommissionRateDto,
    changedByRole: string,
    changedById: number,
  ) {
    const zoneIds = data.service_area_ids ?? [];
    await this.validateZones(zoneIds);

    const record = await this.prisma.standardCommissionRate.findFirst({
      where: { role_name: data.role_name },
    });
    if (record) throw new ConflictException('Record already exists');

    const res = await this.prisma.standardCommissionRate.create({
      data: {
        applicable_user: data.applicable_user,
        role_name: data.role_name,
        commission_rate_delivery_fee: data.commission_rate_delivery_fee ?? 0,
        serviceAreas: {
          create: zoneIds.map(id => ({ service_area_id: id })),
        },
      },
      include: {
        serviceAreas: { include: { serviceArea: true } },
      },
    });

    await this.createFeeLog({
      logType: FeeLogType.STANDARD_COMMISSION_RATE,
      referenceId: res.id,
      applicableUser: res.applicable_user,
      serviceArea: await this.resolveZoneLabel(zoneIds),
      snapshot: res,
      changedByRole,
      changedById,
    });

    return res;
  }

  async findAll() {
    return this.prisma.standardCommissionRate.findMany({
      include: {
        serviceAreas: { include: { serviceArea: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.standardCommissionRate.findUnique({
      where: { id },
      include: {
        serviceAreas: { include: { serviceArea: true } },
      },
    });
    if (!record) throw new NotFoundException('Standard Commission Rate not found');
    return record;
  }

  async update(
    id: number,
    data: UpdateStandardCommissionRateDto,
    changedByRole: string,
    changedById: number,
  ) {
    await this.findOne(id);

    const zoneIds = data.service_area_ids ?? [];
    await this.validateZones(zoneIds);

    const updated = await this.prisma.standardCommissionRate.update({
      where: { id },
      data: {
        applicable_user: data.applicable_user,
        role_name: data.role_name,
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

    await this.createFeeLog({
      logType: FeeLogType.STANDARD_COMMISSION_RATE,
      referenceId: updated.id,
      applicableUser: updated.applicable_user,
      serviceArea: await this.resolveZoneLabel(zoneIds),
      snapshot: updated,
      changedByRole,
      changedById,
    });

    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.standardCommissionRate.delete({ where: { id } });
  }

  async createFeeLog(params: {
    logType: string;
    referenceId: number;
    applicableUser: ApplicableTyp;
    serviceArea?: string;
    snapshot: any;
    changedByRole: string;
    changedById?: number;
  }) {
    return this.prisma.feeConfigurationLog.create({
      data: {
        log_type: params.logType,
        reference_id: params.referenceId,
        applicable_user: params.applicableUser,
        service_area: params.serviceArea,
        snapshot: params.snapshot,
        changed_by_role: params.changedByRole,
        changed_by_id: params.changedById,
      },
    });
  }

  async getLogs(filterDto: FeeLogFilterDto) {
    const { logType, fromDate, toDate, page, limit } = filterDto;
    const skip = (page - 1) * limit;

    const where = {
      log_type: logType,
      created_at: {
        gte: fromDate ? new Date(fromDate) : undefined,
        lte: toDate ? new Date(toDate) : undefined,
      },
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.feeConfigurationLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.feeConfigurationLog.count({ where }),
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

  async getLogsByReference(logType: string, referenceId: number) {
    return this.prisma.feeConfigurationLog.findMany({
      where: {
        log_type: logType,
        reference_id: referenceId,
      },
      orderBy: { created_at: 'desc' },
    });
  }
}