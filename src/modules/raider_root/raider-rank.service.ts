import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/core/database/prisma.service';
import { DriverTierCode } from '../superadmin_root/driver_tier_roles/dto/driver_tier.roles.dto';


const SCORE_WEIGHTS = {
  rating: 40,
  completionRate: 25,
  acceptanceRate: 15,
  ordersCompleted: 10,
  complaintPenalty: 10,
} as const;

// Cap for orders-completed normalisation (tune as needed)
const MAX_ORDERS_CAP = 500;

const SCORE_BANDS: { min: number; code: DriverTierCode }[] = [
  { min: 90, code: DriverTierCode.PLATINUM },
  { min: 70, code: DriverTierCode.GOLD },
  { min: 50, code: DriverTierCode.SILVER },
  { min: 0, code: DriverTierCode.BRONZE },
];


export interface DriverScoreBreakdown {
  total: number;          // 0–100 (clamped)
  ratingScore: number;
  completionScore: number;
  acceptanceScore: number;
  ordersScore: number;
  complaintDeduction: number;
  complaintCount: number;
  suggestedTierCode: DriverTierCode;
}

@Injectable()
export class RaiderTierService {
  private readonly logger = new Logger(RaiderTierService.name);

  constructor(private readonly prisma: PrismaService) { }

  // CRON — Every Monday at 03:00 AM
  @Cron('0 3 * * 1')
  async recalculateAllRaiders(): Promise<void> {
    this.logger.log('🚀 Starting weekly driver score recalculation...');

    const [raiders, tiers] = await Promise.all([
      this.prisma.raider.findMany({
        where: { isSuspended: false },
        include: {
          raider_ratings: true,
          user: {
            select: {
              id: true,
              riderDisputes: {
                where: {
                  status: 'RESOLVED',
                  riderPercent: { gt: 0 },
                  is_closed: true,
                },
                select: { id: true },
              },
            },
          },
        },
      }),
      this.prisma.driverTier.findMany({
        where: { isActive: true },
        orderBy: { priorityScore: 'desc' },
      }),
    ]);

    if (!tiers.length) {
      this.logger.warn('⚠️ No active tiers found. Skipping.');
      return;
    }

    // Build a lookup map: tierCode → tier row
    const tierByCode = new Map<string, any>(
      tiers.map((t) => [t.code, t]),
    );

    await Promise.all(
      raiders.map((raider) =>
        this.processRaider(raider, tiers, tierByCode),
      ),
    );

    this.logger.log('✅ Weekly driver score recalculation completed.');
  }

  // PROCESS SINGLE RAIDER 
  private async processRaider(
    raider: any,
    tiers: any[],
    tierByCode: Map<string, any>,
  ): Promise<void> {
    try {
      // Manual override handling
      if (raider.manualTierOverride) {
        if (!raider.manualTierUntil) return;

        if (new Date() < new Date(raider.manualTierUntil)) return;

        await this.prisma.raider.update({
          where: { id: raider.id },
          data: { manualTierOverride: false, manualTierUntil: null },
        });
      }

      // Calculate driver score
      const complaintCount: number =
        raider.user?.riderDisputes?.length ?? 0;

      const breakdown = this.calculateDriverScore(raider, complaintCount);

      // Resolve target tier from score
      const targetTier = this.resolveTierFromScore(
        breakdown,
        raider,
        tierByCode,
        tiers,
      );

      // No change — skip DB write
      if (raider.tierId === (targetTier?.id ?? null)) return;

      // Persist inside a transaction
      await this.prisma.$transaction(async (tx) => {
        await tx.raider.update({
          where: { id: raider.id },
          data: {
            tierId: targetTier?.id ?? null,
            avg_rating: breakdown.ratingScore
              ? parseFloat(
                ((breakdown.ratingScore / SCORE_WEIGHTS.rating) * 5).toFixed(2),
              )
              : 0,
            driverScore: breakdown.total,   // persist score for dashboards
            updated_at: new Date(),
          },
        });

        if (targetTier) {
          await tx.raiderTierHistory.create({
            data: {
              raiderId: raider.id,
              driverTierId: targetTier.id,
              reason: 'AUTO_WEEKLY_EVALUATION',
            },
          });
        }
      });

      this.logger.debug(
        `Raider #${raider.id} → score ${breakdown.total} → ${targetTier?.code ?? 'NONE'} ` +
        `(rating:${breakdown.ratingScore} completion:${breakdown.completionScore} ` +
        `acceptance:${breakdown.acceptanceScore} orders:${breakdown.ordersScore} ` +
        `penalty:-${breakdown.complaintDeduction} complaints:${breakdown.complaintCount})`,
      );
    } catch (err) {
      this.logger.error(
        `❌ Failed raider #${raider.id}: ${err.message}`,
        err.stack,
      );
    }
  }

  //  WEIGHTED SCORE CALCULATION
  calculateDriverScore(raider: any, complaintCount: number): DriverScoreBreakdown {
    const avgRating = this.getAverageRating(raider);
    const completionRate = Math.min(raider.completion_rate ?? 0, 100);
    const acceptanceRate = Math.min(raider.acceptance_rate ?? 0, 100);
    const ordersCompleted = Math.min(raider.completed_orders ?? 0, MAX_ORDERS_CAP);

    const ratingScore = parseFloat(((avgRating / 5) * SCORE_WEIGHTS.rating).toFixed(2));
    const completionScore = parseFloat(((completionRate / 100) * SCORE_WEIGHTS.completionRate).toFixed(2));
    const acceptanceScore = parseFloat(((acceptanceRate / 100) * SCORE_WEIGHTS.acceptanceRate).toFixed(2));
    const ordersScore = parseFloat(((ordersCompleted / MAX_ORDERS_CAP) * SCORE_WEIGHTS.ordersCompleted).toFixed(2));

    const complaintDeduction = Math.min(complaintCount * 2, SCORE_WEIGHTS.complaintPenalty);

    const raw = ratingScore + completionScore + acceptanceScore + ordersScore - complaintDeduction;
    const total = parseFloat(Math.max(0, Math.min(100, raw)).toFixed(2));

    return {
      total,
      ratingScore,
      completionScore,
      acceptanceScore,
      ordersScore,
      complaintDeduction,
      complaintCount,
      suggestedTierCode: this.scoreToTierCode(total),
    };
  }

  //  SCORE → TIER CODE
  private scoreToTierCode(score: number): DriverTierCode {
    for (const band of SCORE_BANDS) {
      if (score >= band.min) return band.code;
    }
    return DriverTierCode.BRONZE;
  }

  //RESOLVE FINAL TIER (with eligibility guards) 
  private resolveTierFromScore(
    breakdown: DriverScoreBreakdown,
    raider: any,
    tierByCode: Map<string, any>,
    tiers: any[],
  ): any | null {
    const orderedCodes = SCORE_BANDS.map((b) => b.code);
    const startIndex = orderedCodes.indexOf(breakdown.suggestedTierCode);

    for (let i = startIndex; i < orderedCodes.length; i++) {
      const code = orderedCodes[i];
      const tier = tierByCode.get(code);

      if (!tier || !tier.isActive) continue;

      if (code === DriverTierCode.PLATINUM) {
        if (tier.isInvitationOnly && breakdown.suggestedTierCode !== DriverTierCode.PLATINUM) {
          continue;
        }
      }

      if (code === DriverTierCode.GOLD) {
        if (!raider.isGoldOptedIn) continue;
        if ((raider.weeklyActiveHours ?? 0) < 40) continue;
      }

      return tier;
    }

    // Final fallback — lowest active tier (Bronze)
    return tiers[tiers.length - 1] ?? null;
  }

  // AVERAGE RATING
  private getAverageRating(raider: any): number {
    const ratings: any[] = raider.raider_ratings ?? [];
    if (!ratings.length) return 0;

    const total = ratings.reduce(
      (sum: number, r: any) => sum + parseFloat(r.rating_star ?? 0),
      0,
    );

    return parseFloat((total / ratings.length).toFixed(2));
  }
}