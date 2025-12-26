/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Rank } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';


@Injectable()
export class RaiderRankService {
  private readonly logger = new Logger(RaiderRankService.name);
  constructor(
       private readonly prisma:PrismaService
  ){}

  @Cron(CronExpression.EVERY_3_HOURS)
  async recalculateAllRiders() {
    this.logger.log('Starting raider rank recalculation...');

    const raiders = await this.prisma.raider.findMany({
      include: {
        followers: { where: { is_fav: true } }, // only favorites
        raider_ratings: true,
      },
    });

    for (const raider of raiders) {
      const followersCount = raider.followers.length;
      const rank = this.determineRank(raider);
      const rankScore = this.calculateRankScore(raider, followersCount);
      //   
      await this.prisma.raider.update({
        where: { id: raider.id },
        data: {
          rank,
          rankScore,
          updated_at: new Date(),
        },
      });
    }

    this.logger.log('Raider rank recalculation completed.');
  }

  private determineRank(raider: any): Rank {
    if (raider.isPremium) return Rank.PREMIUM;
    if (raider.hasAdDecal) return Rank.PLATINUM;
    if (raider.hasBranding && raider.raider_verificationFromAdmin === 'APPROVED') return Rank.GOLD;
    if (raider.completed_orders >= 100 && this.getAverageRating(raider) >= 4.2) return Rank.SILVER;
    return Rank.BRONZE;
  }

    private calculateRankScore(raider: any, followersCount: number): number {
    const avgRating = this.getAverageRating(raider); // 0-5
    const ratingScore = (avgRating / 5) * 400;       // max 400 points

    const orderScore = Math.min(raider.completed_orders || 0, 1000) / 1000 * 300;
    const followerScore = Math.min(followersCount, 500) / 500 * 150;
    const activityScore = raider.is_available ? 50 : 0;
    const reliabilityScore = raider.isSuspended ? 0 : 100;

    return Math.round(ratingScore + orderScore + followerScore + activityScore + reliabilityScore);
    }
   //   
  private getAverageRating(raider: any): number {
    if (!raider.raider_ratings || raider.raider_ratings.length === 0) return 0;
    const total = raider.raider_ratings.reduce((acc, r) => acc + r.rating_star, 0);
    return total / raider.raider_ratings.length;
  }
}
