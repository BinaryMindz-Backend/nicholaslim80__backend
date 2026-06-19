import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderStatus, RaiderStatus } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import pLimit from 'p-limit';

const BATCH_SIZE = 100;
const CONCURRENCY = 10;
const RATE_LIMIT_MS = 100;


export interface RaiderStatsSnapshot {
    reviews_count: number;
    completed_orders: number;
    avg_rating: number;
    completion_rate: number;
    cancellation_rate: number;
    acceptance_rate: number;
}


@Injectable()
export class RaiderStatsCronService {
    private readonly logger = new Logger(RaiderStatsCronService.name);
    private readonly limit = pLimit(CONCURRENCY);

    constructor(private readonly prisma: PrismaService) { }


    // Cron: Batch sync with cursor pagination 
    @Cron(CronExpression.EVERY_HOUR)
    async syncAllRaiderStats() {
        this.logger.log('⏳ Starting hourly raider stats sync...');
        const startTime = Date.now();

        let cursor: number | undefined;
        let totalSynced = 0;
        let totalFailed = 0;

        while (true) {
            // Fetch batch with cursor (no offset, efficient for large tables)
            const batch = await this.prisma.raider.findMany({
                where: {
                    raider_status: RaiderStatus.ACTIVE,
                    isSuspended: false,
                },
                take: BATCH_SIZE,
                skip: cursor ? 1 : 0,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { id: 'asc' },
                select: { id: true },
            });

            if (batch.length === 0) break;

            const results = await Promise.allSettled(
                batch.map((raider) =>
                    this.limit(() => this.syncStatsWithRetry(raider.id)),
                ),
            );

            // Count results
            results.forEach((r) => {
                if (r.status === 'fulfilled') totalSynced++;
                else totalFailed++;
            });

            // Move cursor to last item
            cursor = batch[batch.length - 1].id;

            // Rate limit between batches
            if (batch.length === BATCH_SIZE) {
                await this.sleep(RATE_LIMIT_MS);
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        this.logger.log(
            `✅ Hourly sync complete in ${duration}s: ` +
            `${totalSynced} synced, ${totalFailed} failed`,
        );
    }

    // Sync with retry logic 
    private async syncStatsWithRetry(raiderId: number, retries = 2): Promise<void> {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                await this.syncStatsOnLogin(raiderId);
                return;
            } catch (err: any) {
                if (attempt === retries) throw err;
                await this.sleep(500 * (attempt + 1)); // Exponential backoff
            }
        }
    }

    // Single raider sync 
    async syncStatsOnLogin(raiderId: number): Promise<RaiderStatsSnapshot> {
        const snapshot = await this.computeStats(raiderId);

        await this.prisma.raider.update({
            where: { id: raiderId },
            data: {
                reviews_count: snapshot.reviews_count,
                completed_orders: snapshot.completed_orders,
                avg_rating: snapshot.avg_rating,
                completion_rate: snapshot.completion_rate,
                cancellation_rate: snapshot.cancellation_rate,
                acceptance_rate: snapshot.acceptance_rate,
                updated_at: new Date(),
            },
        });

        return snapshot;
    }


    // Compute stats
    private async computeStats(raiderId: number): Promise<RaiderStatsSnapshot> {
        const [
            reviewsAgg,
            orderCounts,
            acceptedCount,
            declinedCount,
        ] = await Promise.all([
            this.prisma.rateRaider.aggregate({
                where: { raiderId },
                _avg: { rating_star: true },
                _count: { rating_star: true },
            }),
            this.prisma.order.groupBy({
                by: ['order_status'],
                where: { assign_rider_id: raiderId },
                _count: { id: true },
            }),
            // Accepted orders
            this.prisma.order.count({
                where: {
                    assign_rider_id: raiderId,
                    order_status: { in: [OrderStatus.ONGOING, OrderStatus.COMPLETED] },
                },
            }),
            // Declined orders
            this.prisma.orderDecline.count({
                where: { raiderId },
            }),
        ]);

        const countByStatus = new Map(
            orderCounts.map((row) => [row.order_status, row._count.id]),
        );

        const deliveredCount = countByStatus.get(OrderStatus.COMPLETED) ?? 0;
        const cancelledCount = countByStatus.get(OrderStatus.CANCELLED) ?? 0;
        const totalOrders = [...countByStatus.values()].reduce((a, b) => a + b, 0);

        const completion_rate = totalOrders > 0
            ? parseFloat(((deliveredCount / totalOrders) * 100).toFixed(2))
            : 100;

        const cancellation_rate = totalOrders > 0
            ? parseFloat(((cancelledCount / totalOrders) * 100).toFixed(2))
            : 0;

        const avg_rating = parseFloat(
            (Number(reviewsAgg._avg.rating_star ?? 0)).toFixed(2),
        );
        const reviews_count = reviewsAgg._count.rating_star ?? 0;

        // Calculate acceptance rate
        const totalResponded = acceptedCount + declinedCount;
        const acceptance_rate = totalResponded > 0
            ? parseFloat(((acceptedCount / totalResponded) * 100).toFixed(2))
            : 100;

        return {
            reviews_count,
            completed_orders: deliveredCount,
            avg_rating,
            completion_rate,
            cancellation_rate,
            acceptance_rate,
        };
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}