import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class RaiderTierService {
  private readonly logger = new Logger(RaiderTierService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ================= CRON =================
  @Cron(CronExpression.EVERY_3_HOURS)
  async recalculateAllRaiders() {
    this.logger.log('🚀 Starting driver tier recalculation...');

    const [raiders, tiers] = await Promise.all([
      this.prisma.raider.findMany({
        include: {
          followers: { where: { is_fav: true } },
          raider_ratings: true,
        },
      }),
      this.prisma.driverTier.findMany({
        where: { isActive: true },
        orderBy: { priorityScore: 'desc' },
      }),
    ]);

    if (!tiers.length) return;

    for (const raider of raiders) {
      const avgRating = this.getAverageRating(raider);
      const followersCount = raider.followers?.length ?? 0;

      const bestTier = this.findBestTier(raider, tiers, avgRating);

      await this.prisma.raider.update({
        where: { id: raider.id },
        data: {
          tierId: bestTier?.id ?? null,
          updated_at: new Date(),
        },
      });
    }

    this.logger.log('✅ Driver tier recalculation completed');
  }

  // ================= FIND BEST TIER =================
  private findBestTier(raider: any, tiers: any[], avgRating: number) {
    const completed = raider.completed_orders ?? 0;
    const cancelRate = raider.cancellation_rate ?? 0;
    const hasBranding = raider.hasBranding ?? false;
    const hasAd = raider.hasAdDecal ?? false;

    for (const tier of tiers) {
      if (this.meetsCriteria(tier, completed, avgRating, cancelRate, hasBranding, hasAd)) {
        return tier;
      }
    }

    return tiers[tiers.length - 1]; 
  }

  // ================= RULE CHECK =================
  private meetsCriteria(
    tier: any,
    completed: number,
    avgRating: number,
    cancelRate: number,
    hasBranding: boolean,
    hasAd: boolean,
  ): boolean {
    if (tier.minOrders && completed < tier.minOrders) return false;

    if (tier.minRating && avgRating < Number(tier.minRating)) return false;

    if (tier.maxCancellationRate && cancelRate > Number(tier.maxCancellationRate)) return false;

    if (tier.requiresBranding && !hasBranding) return false;

    if (tier.code === 'PLATINUM' && !hasAd) return false;

    return true;
  }

  // ================= RATING =================
  private getAverageRating(raider: any): number {
    if (!raider.raider_ratings?.length) return 0;

    const total = raider.raider_ratings.reduce(
      (sum, r) => sum + (r.rating_star ?? 0),
      0,
    );

    return total / raider.raider_ratings.length;
  }
}