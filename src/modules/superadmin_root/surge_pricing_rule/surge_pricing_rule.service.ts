import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateSurgePricingRuleDto,
  ResolveSurgeDto,
  SurgePricingRuleQueryDto,
  UpdateSurgePricingRuleDto,
} from './dto/index';
import { SurgePricingStatus } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class SurgePricingRuleService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Create ────────────────────────────────────────────────────────────────

   async create(dto: CreateSurgePricingRuleDto) {
      await this.validateRatioOverlap(dto.ratioFrom, dto.ratioTo);

      if (dto.serviceZoneIds?.length) {
        await this.validateServiceZoneIds(dto.serviceZoneIds);
      }

      if (dto.deliveryTypeIds?.length) {
        await this.validateDeliveryTypeIds(dto.deliveryTypeIds);
      }

      return await this.prisma.surgePricingRule.create({
        data: {
          ruleName:        dto.ruleName,
          ratioFrom:       dto.ratioFrom,
          ratioTo:         dto.ratioTo,
          priceMultiplier: dto.priceMultiplier,
          maxCap:          dto.maxCap ?? null,
          status:          dto.status ?? SurgePricingStatus.ACTIVE,

          serviceZones: dto.serviceZoneIds?.length
            ? {
                create: dto.serviceZoneIds.map((id) => ({
                  serviceZone: { connect: { id } },
                })),
              }
            : undefined,

          deliveryTypes: dto.deliveryTypeIds?.length
            ? {
                create: dto.deliveryTypeIds.map((id) => ({
                  deliveryType: { connect: { id } },
                })),
              }
            : undefined,
        },
        include: {
          serviceZones:  { include: { serviceZone: true } },
          deliveryTypes: { include: { deliveryType: true } },
        },
      });
    }

  // ─── List ──────────────────────────────────────────────────────────────────

  async findAll(query: SurgePricingRuleQueryDto) {
    const { status, serviceZoneId, deliveryTypeId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(serviceZoneId && {
        serviceZones: { some: { serviceZoneId } },
      }),
      ...(deliveryTypeId && {
        deliveryTypes: { some: { deliveryTypeId } },
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.surgePricingRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          serviceZones:  { include: { serviceZone: true } },
          deliveryTypes: { include: { deliveryType: true } },
        },
      }),
      this.prisma.surgePricingRule.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Find One ──────────────────────────────────────────────────────────────

  async findOne(id: number) {
    const rule = await this.prisma.surgePricingRule.findUnique({
      where: { id },
      include: {
        serviceZones:  { include: { serviceZone: true } },
        deliveryTypes: { include: { deliveryType: true } },
      },
    });
    if (!rule) throw new NotFoundException(`Surge pricing rule #${id} not found`);
    return rule;
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateSurgePricingRuleDto) {
    const existing = await this.findOne(id);

    // Ratio validation
    if (dto.ratioFrom !== undefined || dto.ratioTo !== undefined) {
      const from = dto.ratioFrom ?? Number(existing.ratioFrom);
      const to   = dto.ratioTo   ?? Number(existing.ratioTo);

      await this.validateRatioOverlap(from, to, id);
    }

    // FK validations BEFORE mutation
    if (dto.serviceZoneIds !== undefined && dto.serviceZoneIds.length) {
      await this.validateServiceZoneIds(dto.serviceZoneIds);
    }

    if (dto.deliveryTypeIds !== undefined && dto.deliveryTypeIds.length) {
      await this.validateDeliveryTypeIds(dto.deliveryTypeIds);
    }

    return this.prisma.$transaction(async (tx) => {
      return tx.surgePricingRule.update({
        where: { id },
        data: {
          ...(dto.ruleName        !== undefined && { ruleName: dto.ruleName }),
          ...(dto.ratioFrom       !== undefined && { ratioFrom: dto.ratioFrom }),
          ...(dto.ratioTo         !== undefined && { ratioTo: dto.ratioTo }),
          ...(dto.priceMultiplier !== undefined && { priceMultiplier: dto.priceMultiplier }),
          ...(dto.maxCap          !== undefined && { maxCap: dto.maxCap }),
          ...(dto.status          !== undefined && { status: dto.status }),

          // Replace service zones safely
          ...(dto.serviceZoneIds !== undefined && {
            serviceZones: {
              deleteMany: {},
              create: dto.serviceZoneIds.map((id) => ({
                serviceZone: { connect: { id } },
              })),
            },
          }),

          // Replace delivery types safely
          ...(dto.deliveryTypeIds !== undefined && {
            deliveryTypes: {
              deleteMany: {},
              create: dto.deliveryTypeIds.map((id) => ({
                deliveryType: { connect: { id } },
              })),
            },
          }),
        },
        include: {
          serviceZones:  { include: { serviceZone: true } },
          deliveryTypes: { include: { deliveryType: true } },
        },
      });
    });
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.surgePricingRule.delete({ where: { id } });
    return { message: `Surge pricing rule #${id} deleted successfully` };
  }

  // ─── Toggle Status ─────────────────────────────────────────────────────────

  async toggleStatus(id: number) {
    const rule = await this.findOne(id);
    const newStatus =
      rule.status === SurgePricingStatus.ACTIVE
        ? SurgePricingStatus.INACTIVE
        : SurgePricingStatus.ACTIVE;

    return this.prisma.surgePricingRule.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  // ─── Resolve Surge (Engine) ────────────────────────────────────────────────
  /**
   * Finds the best matching ACTIVE rule for a live demand/driver ratio.
   * Priority: rules scoped to both zone+type > zone only > type only > global (no scope).
   * Returns multiplier = 1.0 (no surge) when no rule matches.
   */
  async resolveSurge(dto: ResolveSurgeDto) {
    const { ratio, serviceZoneId, deliveryTypeId } = dto;

    const candidates = await this.prisma.surgePricingRule.findMany({
      where: {
        status:    SurgePricingStatus.ACTIVE,
        ratioFrom: { lte: ratio },
        ratioTo:   { gte: ratio },
        AND: [
          serviceZoneId
            ? { serviceZones: { some: { serviceZoneId } } }
            : {},
          deliveryTypeId
            ? { deliveryTypes: { some: { deliveryTypeId } } }
            : {},
        ],
      },
      include: {
        serviceZones:  true,
        deliveryTypes: true,
      },
    });

    if (!candidates.length) {
      return { matched: false, multiplier: 1.0, rule: null };
    }

    // Pick the most specific rule: most zone+type associations wins
    const rule = candidates.sort((a, b) => {
      const scoreA = a.serviceZones.length + a.deliveryTypes.length;
      const scoreB = b.serviceZones.length + b.deliveryTypes.length;
      return scoreB - scoreA;
    })[0];

    let multiplier = Number(rule.priceMultiplier);
    if (rule.maxCap && multiplier > Number(rule.maxCap)) {
      multiplier = Number(rule.maxCap);
    }

    return { matched: true, multiplier, rule };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async validateRatioOverlap(
    ratioFrom: number,
    ratioTo: number,
    excludeId?: number,
  ) {
    const overlap = await this.prisma.surgePricingRule.findFirst({
      where: {
        ...(excludeId && { id: { not: excludeId } }),
        status:    SurgePricingStatus.ACTIVE,
        ratioFrom: { lt: ratioTo },
        ratioTo:   { gt: ratioFrom },
      },
    });

    if (overlap) {
      throw new BadRequestException(
        `Ratio range [${ratioFrom}–${ratioTo}] overlaps with existing rule "${overlap.ruleName}" [${Number(overlap.ratioFrom)}–${Number(overlap.ratioTo)}]`,
      );
    }
  }


private async validateServiceZoneIds(ids: number[]) {
  const zones = await this.prisma.serviceZone.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });

  const existingIds = zones.map(z => z.id);

  const invalidIds = ids.filter(id => !existingIds.includes(id));

  if (invalidIds.length) {
    throw new BadRequestException(
      `Invalid serviceZoneIds: ${invalidIds.join(', ')}`
    );
  }
}

private async validateDeliveryTypeIds(ids: number[]) {
  const types = await this.prisma.deliveryType.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });

  const existingIds = types.map(t => t.id);

  const invalidIds = ids.filter(id => !existingIds.includes(id));

  if (invalidIds.length) {
    throw new BadRequestException(
      `Invalid deliveryTypeIds: ${invalidIds.join(', ')}`
    );
  }
}

}