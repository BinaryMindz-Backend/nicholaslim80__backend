import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from 'src/core/database/prisma.service';
import { DriverTierCode } from './dto/driver_tier.roles.dto';
import { DriverTier, Raider } from '@prisma/client';

@Injectable()
export class DriverTierService {
  constructor(private readonly prisma: PrismaService) {}

  // ================= CREATE =================
  async createTier(dto: any): Promise<DriverTier> {
    const exists = await this.prisma.driverTier.findUnique({
      where: { code: dto.code },
    });

    if (exists) throw new ConflictException('Tier already exists');

    switch (dto.code) {
      case DriverTierCode.BRONZE:
        dto.priorityScore = 1.0;
        break;

      case DriverTierCode.SILVER:
        if (!dto.minOrders || dto.minOrders < 100) {
          throw new BadRequestException('Silver requires ≥100 orders');
        }
        if (!dto.minRating || dto.minRating < 4.5) {
          throw new BadRequestException('Silver requires rating ≥4.5');
        }
        dto.minCompletionRate = dto.minCompletionRate ?? 95;
        dto.maxCancellationRate = dto.maxCancellationRate ?? 5;
        dto.priorityScore = 1.2;
        break;

      case DriverTierCode.GOLD:
        dto.requiresBranding = true;
        dto.priorityScore = 1.5;
        break;

      case DriverTierCode.PLATINUM:
        dto.isInvitationOnly = true;
        dto.priorityScore = 2.0;
        break;
    }

    return this.prisma.driverTier.create({ data: dto });
  }

  // ================= GET =================
  async getAllTiers(): Promise<any> {
    return await this.prisma.driverTier.findMany({
      where: { isActive: true },
      orderBy: { priorityScore: 'desc' },
    });
  }

  async getTierById(id: number): Promise<DriverTier> {
    const tier = await this.prisma.driverTier.findUnique({ where: { id } });

    if (!tier) throw new NotFoundException('Tier not found');
    return tier;
  }

  // ================= UPDATE =================
  async updateTier(id: number, dto: any): Promise<DriverTier> {
    const tier = await this.prisma.driverTier.findUnique({ where: { id } });

    if (!tier) throw new NotFoundException('Tier not found');

    if (dto.code || dto.priorityScore) {
      throw new BadRequestException('System-controlled fields');
    }

    return this.prisma.driverTier.update({
      where: { id },
      data: dto,
    });
  }

  // ================= PROMOTE =================
  async promoteRaider(
    raiderId: number,
    dto: { tierId: number; reason: string },
  ) {
    const raider = await this.prisma.raider.findUnique({
      where: { id: raiderId },
    });

    if (!raider) throw new NotFoundException('Raider not found');

    const tier = await this.prisma.driverTier.findUnique({
      where: { id: dto.tierId },
    });

    if (!tier) throw new NotFoundException('Tier not found');

    await this.prisma.$transaction([
      this.prisma.raider.update({
        where: { id: raiderId },
        data: { tierId: tier.id },
      }),

      this.prisma.raiderTierHistory.create({
        data: {
          raiderId,
          driverTierId: tier.id,
          reason: dto.reason,
        },
      }),
    ]);

    return {
      message: 'Raider promoted successfully',
      newTier: tier.name,
    };
  }

  // ================= AUTO EVALUATION =================
  async autoEvaluateTier(raiderId: number): Promise<void> {
    const raider = await this.prisma.raider.findUnique({
      where: { id: raiderId },
      include: { tier: true },
    });

    if (!raider || raider.isSuspended) return;

    const tiers = await this.prisma.driverTier.findMany({
      where: { isActive: true },
      orderBy: { priorityScore: 'desc' },
    });

    let target = tiers.find((t) =>
      this.meetsCriteria(raider, t),
    );

    if (!target) target = tiers[tiers.length - 1];

    if (!target || target.id === raider.tierId) return;

    await this.prisma.raider.update({
      where: { id: raiderId },
      data: { tierId: target.id },
    });
  }

  // ================= CRITERIA =================
  private meetsCriteria(raider: Raider, tier: DriverTier): boolean {
    if (tier.isInvitationOnly) return false;

    if (
      tier.minOrders &&
      (raider.completed_orders ?? 0) < tier.minOrders
    )
      return false;

    if (
      tier.minRating &&
      Number(raider.avg_rating ?? 0) < Number(tier.minRating)
    )
      return false;

    if (
      tier.minCompletionRate &&
      (raider.completion_rate ?? 0) < tier.minCompletionRate
    )
      return false;

    if (
      tier.maxCancellationRate &&
      (raider.cancellation_rate ?? 0) > tier.maxCancellationRate
    )
      return false;

    if (tier.requiresBranding) {
      if (!(raider.hasBranding || raider.hasAdDecal)) return false;
    }

    if (tier.code === DriverTierCode.GOLD) {
      if (!raider.isGoldOptedIn) return false;
      if ((raider.weeklyActiveHours ?? 0) < 40) return false;
    }

    return true;
  }
}