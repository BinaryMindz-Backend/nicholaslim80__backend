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

    async create(dto: CreateSurgePricingRuleDto, userId: number) {
      await this.validateRatioOverlap(dto.ratioFrom, dto.ratioTo);

      if (dto.serviceZoneIds?.length) {
        await this.validateServiceZoneIds(dto.serviceZoneIds);
      }

      if (dto.deliveryTypeIds?.length) {
        await this.validateDeliveryTypeIds(dto.deliveryTypeIds);
      }

      return this.prisma.$transaction(async (tx) => {
        const rule = await tx.surgePricingRule.create({
          data: {
            ruleName: dto.ruleName,
            ratioFrom: dto.ratioFrom,
            ratioTo: dto.ratioTo,
            priceMultiplier: dto.priceMultiplier,
            maxCap: dto.maxCap ?? null,
            status: dto.status ?? SurgePricingStatus.ACTIVE,

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
        });

        await this.logActivity(tx, {
          action: 'CREATE',
          entityType: 'SurgePricingRule',
          entityId: rule.id,
          userId,
          meta: dto, // store input payload
        });

        return rule;
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

   async update(id: number, dto: UpdateSurgePricingRuleDto, userId: number) {
      const existing = await this.findOne(id);

      if (dto.ratioFrom !== undefined || dto.ratioTo !== undefined) {
        const from = dto.ratioFrom ?? Number(existing.ratioFrom);
        const to   = dto.ratioTo   ?? Number(existing.ratioTo);
        await this.validateRatioOverlap(from, to, id);
      }

      if (dto.serviceZoneIds?.length) {
        await this.validateServiceZoneIds(dto.serviceZoneIds);
      }

      if (dto.deliveryTypeIds?.length) {
        await this.validateDeliveryTypeIds(dto.deliveryTypeIds);
      }

      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.surgePricingRule.update({
          where: { id },
          data: {
            ...(dto.ruleName && { ruleName: dto.ruleName }),
            ...(dto.ratioFrom && { ratioFrom: dto.ratioFrom }),
            ...(dto.ratioTo && { ratioTo: dto.ratioTo }),
            ...(dto.priceMultiplier && { priceMultiplier: dto.priceMultiplier }),
            ...(dto.maxCap !== undefined && { maxCap: dto.maxCap }),
            ...(dto.status && { status: dto.status }),

            ...(dto.serviceZoneIds !== undefined && {
              serviceZones: {
                deleteMany: {},
                create: dto.serviceZoneIds.map((id) => ({
                  serviceZone: { connect: { id } },
                })),
              },
            }),

            ...(dto.deliveryTypeIds !== undefined && {
              deliveryTypes: {
                deleteMany: {},
                create: dto.deliveryTypeIds.map((id) => ({
                  deliveryType: { connect: { id } },
                })),
              },
            }),
          },
        });

        await this.logActivity(tx, {
          action: 'UPDATE',
          entityType: 'SurgePricingRule',
          entityId: id,
          userId,
          meta: {
            before: existing,
            after: updated,
          },
        });

        return updated;
      });
    }

  // ─── Delete ────────────────────────────────────────────────────────────────

  async remove(id: number, userId: number) {
    const existing = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.surgePricingRule.delete({
        where: { id },
      });

      await this.logActivity(tx, {
        action: 'DELETE',
        entityType: 'SurgePricingRule',
        entityId: id,
        userId,
        meta: existing, // store deleted data snapshot
      });

      return { message: 'Deleted successfully' };
    });
  }

  // ─── Toggle Status ─────────────────────────────────────────────────────────

  async toggleStatus(id: number, userId: number) {
    const existing = await this.findOne(id);

    const newStatus =
      existing.status === SurgePricingStatus.ACTIVE
        ? SurgePricingStatus.INACTIVE
        : SurgePricingStatus.ACTIVE;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.surgePricingRule.update({
        where: { id },
        data: { status: newStatus },
      });

      await this.logActivity(tx, {
        action: 'UPDATE',
        entityType: 'SurgePricingRule',
        entityId: id,
        userId,
        meta: {
          field: 'status',
          before: existing.status,
          after: newStatus,
        },
      });

      return updated;
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
          status: SurgePricingStatus.ACTIVE,
          ratioFrom: { lte: ratio },
          ratioTo: { gte: ratio },
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
          serviceZones: true,
          deliveryTypes: true,
        },
      });

      if (!candidates.length) {
        return { matched: false, multiplier: 1.0, rule: null };
      }

      const getScore = (rule: any) => {
        let score = 0;

        const hasZoneMatch = serviceZoneId
          ? rule.serviceZones.some(z => z.serviceZoneId === serviceZoneId)
          : false;

        const hasTypeMatch = deliveryTypeId
          ? rule.deliveryTypes.some(t => t.deliveryTypeId === deliveryTypeId)
          : false;

        // Priority scoring
        if (hasZoneMatch && hasTypeMatch) score = 3;
        else if (hasZoneMatch) score = 2;
        else if (hasTypeMatch) score = 1;
        else score = 0;

        return score;
      };

      const rule = candidates
        .map(r => ({ ...r, score: getScore(r) }))
        .sort((a, b) => b.score - a.score)[0];

      let multiplier = Number(rule.priceMultiplier);

      if (rule.maxCap && multiplier > Number(rule.maxCap)) {
        multiplier = Number(rule.maxCap);
      }

      return {
        matched: true,
        multiplier,
        rule,
      };
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

// 
  private async logActivity(tx: any, data: {
    action: string;
    entityType: string;
    entityId: number;
    userId: number;
    meta?: any;
  }) {
    await tx.activityLog.create({
      data: {
        action: data.action,
        entity_type: data.entityType,
        entity_id: data.entityId,
        user_id: data.userId,
        meta: data.meta ?? null,
      },
    });
  }

}