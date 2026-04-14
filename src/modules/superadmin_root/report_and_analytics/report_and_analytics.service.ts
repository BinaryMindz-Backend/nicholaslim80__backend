import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CoinHistoryType, OrderStatus, Prisma } from '@prisma/client';
import {  endOfWeek, isWithinInterval,  startOfWeek,  subWeeks } from 'date-fns';
import { WeeklyStat } from 'src/types';

@Injectable()
export class ReportAndAnalyticsService {
       constructor(  private prisma: PrismaService){
       }
      
      //  order stats
    async getOrderAllStats() {
      const [
        totalOrder,
        completedOrder,
        cancelledOrder,
        disputedOrder,
        activeOrder,
        ordersWithRatings,
      ] = await Promise.all([
        this.prisma.order.count({
            where:{
                NOT:{
                   order_status:OrderStatus.PROGRESS
                }
            }
        }),

        this.prisma.order.count({
          where: { order_status: OrderStatus.COMPLETED },
        }),

        this.prisma.order.count({
          where: { order_status: OrderStatus.CANCELLED },
        }),

        this.prisma.order.count({
          where: { isDispute: true },
        }),
        // 
        this.prisma.order.count({
          where: { order_status: OrderStatus.ONGOING },
        }),
        this.prisma.order.findMany({
          where: {
            order_status: OrderStatus.COMPLETED,
            rate_raiders: { isNot: null },
            rate_customers: { isNot: null },
          },
          select: {
            rate_raiders: { select: {rating_star:true} },
            rate_customers: { select: { rating_star: true } },
          },
        }),
      ]);

      // ---- Order Rating Calculation ----

      const validOrders = ordersWithRatings.filter(
        (o) => o.rate_raiders && o.rate_customers,
      );

      const totalRating = validOrders.reduce((sum, order) => {
        return (
          sum +
          (order.rate_raiders!.rating_star + order.rate_customers!.rating_star) / 2
        );
      }, 0);

      const averageOrderRating = validOrders.length
        ? Number((totalRating / validOrders.length).toFixed(2))
        : 0;
      const totalRevenueRaw = await this.prisma.order.aggregate({
      _sum: { total_cost: true },
      where: { order_status: 'COMPLETED' },
    });
    //  
      return {
        totalOrder,
        completedOrder,
        cancelledOrder,
        disputedOrder,
        averageOrderRating,
        activeOrder,
        totalRevenue:Number(totalRevenueRaw._sum.total_cost ?? 0)
      };
    }
       
    // analytics stats
    async getOrderAnalyticsStats(from?: Date, to?: Date) {
      /* ---------------- Date Filter ---------------- */
      const dateCondition =
        from && to
          ? Prisma.sql`WHERE o.created_at BETWEEN ${from} AND ${to}`
          : Prisma.sql``;

      /* ---------------- Orders by Time of Day ---------------- */
          const timeOfDayStats = (await this.prisma.$queryRaw<any[]>`
            SELECT
              CASE
                WHEN EXTRACT(HOUR FROM o.created_at) BETWEEN 6 AND 11 THEN 'Morning'
                WHEN EXTRACT(HOUR FROM o.created_at) BETWEEN 12 AND 16 THEN 'Afternoon'
                WHEN EXTRACT(HOUR FROM o.created_at) BETWEEN 17 AND 21 THEN 'Evening'
                ELSE 'Night'
              END AS timeSlot,
              COUNT(*) AS total
            FROM orders o
            ${dateCondition}
            GROUP BY timeSlot
            ORDER BY total DESC
          `).map((row) => ({
            timeSlot: row.timeslot,
            total: Number(row.total), // convert bigint -> number
          }));


      /* ---------------- Orders by Service Zone ---------------- */
      // Only use include for _count; select fields separately is not allowed
      const zoneStats = await this.prisma.serviceZone.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { destinations: true }, // count of related destinations/orders
          },
        },
      });
      // console.log(zoneStats);
      /* ---------------- Zone Heatmap ---------------- */
      const heatmap = zoneStats.map((zone) => ({
        zoneId: zone.id,
        zoneName: zone.zoneName,
        polygon: zone.coordinates,
        orderCount: zone._count.destinations,
        intensity: zone._count.destinations, // frontend can normalize
      }));

      /* ---------------- Final Response ---------------- */
      return {
        timeOfDayStats,
        zoneStats: zoneStats.map((z) => ({
          zoneId: z.id,
          zoneName: z.zoneName,
          totalOrder: z._count.destinations,
        })),
        heatmap,
      };
    }


    // kpi stats
    async getAdminKpiStats(from?: Date, to?: Date) {
      // ---------------- Date Filter ----------------
      const dateFilter = from && to ? { created_at: { gte: from, lte: to } } : {};

      // ---------------- Revenue by Day ----------------
      const revenueByDayRaw = await this.prisma.$queryRaw<any[]>`
        SELECT
          DATE(o.created_at) AS day,
          SUM(o.total_cost) AS revenue
        FROM orders o
        WHERE o.order_status = 'COMPLETED'
          ${from && to ? Prisma.sql`AND o.created_at BETWEEN ${from} AND ${to}` : Prisma.sql``}
        GROUP BY day
        ORDER BY day ASC
      `;
      const revenueByDay = revenueByDayRaw.map(r => ({
        day: r.day,
        revenue: Number(r.revenue),
      }));

      // ---------------- Top Performers by Revenue ----------------
      const topDrivers = await this.prisma.raider.findMany({
        where: { isSuspended: false },
        select: {
          id: true,
          registrations: { select: { raider_name: true } },
          assignedOrders: {
            where: {
              order_status: 'COMPLETED',
              ...(from && to ? { created_at: { gte: from, lte: to } } : {}),
            },
            select: { total_cost: true },
          },
        },
      });

      const topDriversByRevenue = topDrivers
        .map(driver => {
          const revenue = driver.assignedOrders.reduce(
            (sum, o) => sum + Number(o.total_cost),
            0,
          );
          return {
            driverId: driver.id,
            driverName: driver.registrations?.[0]?.raider_name ?? 'Unknown',
            revenue,
          };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // ---------------- Average Order Value ----------------
      const avgOrderValueRaw = await this.prisma.order.aggregate({
        _avg: { total_cost: true },
        where: { ...dateFilter, order_status: 'COMPLETED' },
      });
      const avgOrderValue = Number(avgOrderValueRaw._avg.total_cost ?? 0);

      // ---------------- Order Completion & Cancellation Rate ----------------
      const totalOrders = await this.prisma.order.count({ where: dateFilter });
      const completedOrders = await this.prisma.order.count({
        where: { ...dateFilter, order_status: 'COMPLETED' },
      });
      const cancelledOrders = await this.prisma.order.count({
        where: { ...dateFilter, order_status: 'CANCELLED' },
      });

      const completionRate = totalOrders ? (completedOrders / totalOrders) * 100 : 0;
      const cancellationRate = totalOrders ? (cancelledOrders / totalOrders) * 100 : 0;

      // ---------------- Average Delivery Time (in minutes) ----------------
      const deliveryTimesRaw = await this.prisma.order.findMany({
        where: { ...dateFilter, order_status: 'COMPLETED' },
        select: { created_at: true, updated_at: true },
      });

      const avgDeliveryTime = deliveryTimesRaw.length
        ? deliveryTimesRaw.reduce(
            (sum, o) => sum + (o.updated_at.getTime() - o.created_at.getTime()) / 60000,
            0,
          ) / deliveryTimesRaw.length
        : 0;

      // ---------------- Final KPI Response ----------------
      return {
        revenueByDay,
        topDrivers: topDriversByRevenue,
        avgOrderValue: Number(avgOrderValue.toFixed(2)),
        completionRate: Number(completionRate.toFixed(2)),
        cancellationRate: Number(cancellationRate.toFixed(2)),
        avgDeliveryTime: Number(avgDeliveryTime.toFixed(2)), // in minutes
      };
    }

    // coin stats
    async getAdminCoinStats(from?: Date, to?: Date) {
      // ---------------- Date Filter ----------------
      const dateFilter: any = {};
      if (from && to) {
        dateFilter.created_at = { gte: from, lte: to };
      }

      // ---------------- Total Coins Given ----------------
      const totalCoinGivenRaw = await this.prisma.coinHistory.aggregate({
        _sum: { coin_acc_amount: true },
        where: { ...dateFilter, type: CoinHistoryType.ACCUMULATION },
      });
      const totalCoinGiven = Number(totalCoinGivenRaw._sum.coin_acc_amount ?? 0);

      // ---------------- Total Coins Redeemed ----------------
      const totalCoinRedeemRaw = await this.prisma.coinHistory.aggregate({
        _sum: { coin_acc_amount: true },
        where: { ...dateFilter, type: CoinHistoryType.APPLICATION },
      });
      const totalCoinRedeem = Number(totalCoinRedeemRaw._sum.coin_acc_amount ?? 0);

      // ---------------- Total Coins Expired ----------------
          const now = new Date();

          // Get all active coins
          const coins = await this.prisma.coin.findMany({
            where: { is_active: true, expire_days: { not: null } },
            select: { key: true, expire_days: true },
          });

          // Get all accumulated coin histories in date range
          const coinHistories = await this.prisma.coinHistory.findMany({
            where: { type: CoinHistoryType.ACCUMULATION },
            select: { userId: true, role_triggered: true, coin_acc_amount: true, created_at: true },
          });

          // Calculate expired coins
          let totalCoinExpired = 0;
          coinHistories.forEach(history => {
            const matchingCoin = coins.find(c => c.key === history.role_triggered);
            if (!matchingCoin || !matchingCoin.expire_days) return;

            const expireDate = new Date(history.created_at);
            expireDate.setDate(expireDate.getDate() + matchingCoin.expire_days);

            if (expireDate < now) {
              totalCoinExpired += history.coin_acc_amount;
            }
          });

      // ---------------- Total Active Users with Coins ----------------
      const activeUsersRaw = await this.prisma.coinHistory.groupBy({
        by: ['userId'],
        where: { ...dateFilter },
      });
      const totalActiveUsersWithCoin = activeUsersRaw.length;

      // ---------------- Coin Summary Chart ----------------
      const coinSummaryChart = [
        { label: 'Gave', value: totalCoinGiven },
        { label: 'Redeemed', value: totalCoinRedeem },
        { label: 'Expired', value: totalCoinExpired },
      ];

      // ---------------- Coin Earned by Activity Type ----------------
      const coinByActivityRaw = await this.prisma.coinHistory.groupBy({
        by: ['role_triggered'],
        _sum: { coin_acc_amount: true },
        where: { ...dateFilter, type: CoinHistoryType.ACCUMULATION },
      });

      const coinByActivityChart = coinByActivityRaw.map(r => ({
        event: r.role_triggered,
        coins: Number(r._sum.coin_acc_amount ?? 0),
      }));

      // ---------------- Final Response ----------------
      return {
        totalCoinGiven,
        totalCoinRedeem,
        totalCoinExpired,
        totalActiveUsersWithCoin,
        coinSummaryChart,
        coinByActivityChart,
      };
    }

    // incentive analytics
    async getIncentiveAnalytics(from?: Date, to?: Date) {
      // ---------------- Date Filter ----------------
      const dateFilter: any = {};
      if (from && to) {
        dateFilter.created_at = { gte: from, lte: to };
      }
      // ---------------- Total Incentives Given ----------------
      const totalGivenRaw = await this.prisma.incentive.aggregate({
        _sum: { reward_value: true },
        where: { ...dateFilter },
      });
      const totalGiven = Number(totalGivenRaw._sum.reward_value ?? 0);

      // ---------------- Total Incentives Collected ----------------
      const totalCollectedRaw = await this.prisma.collectedIncentive.aggregate({
        _sum: { amount: true },
        where: { ...dateFilter },
      });
      const totalCollected = Number(totalCollectedRaw._sum.amount ?? 0);

      // ---------------- Weekly Graph ----------------
         const weeklyData = await this.prisma.incentive.findMany({
              where: from && to ? { created_at: { gte: from, lte: to } } : {},
              select: {
                created_at: true,
                reward_value: true,
                collected_incentives: {
                  select: { amount: true, created_at: true },
                },
              },
            });
            // 
            const weeklyGraph: { week: string; given: number; collected: number }[] = [];

            weeklyData.forEach(i => {
              const weekNumber = Math.ceil(i.created_at.getDate() / 7); // Week 1-4
              const given = i.reward_value ?? 0;
              const collected = i.collected_incentives.reduce((sum, c) => sum + (c.amount ?? 0), 0);

              let weekEntry = weeklyGraph.find(w => w.week === `Week ${weekNumber}`);
              if (!weekEntry) {
                weekEntry = { week: `Week ${weekNumber}`, given: 0, collected: 0 };
                weeklyGraph.push(weekEntry);
              }
              weekEntry.given += given;
              weekEntry.collected += collected;
            });
            
      // ---------------- Final Response ----------------
      return {
        totalGiven,
        totalCollected,
        weeklyGraph,
      };
            }
    // 
       /** Service 1: Top Drivers */
  async getTopDrivers(limit = 10) {
    const drivers = await this.prisma.raider.findMany({
      take: limit,
      select: {
        id: true,
        user: { select: { username: true } },
        assignedOrders: {
          select: {
            id: true,
            total_cost: true,
            order_status: true,
            dispute: { select: { id: true } },
            rate_raiders: { select: { rating_star: true } }, // single object
          },
        },
      },
    });

    const topDrivers = drivers.map(driver => {
      const orders = driver.assignedOrders;
      const totalOrders = orders.length;
      const completedOrders = orders.filter(o => o.order_status === OrderStatus.COMPLETED).length;
      const cancelledOrders = orders.filter(o => o.order_status === OrderStatus.CANCELLED).length;
      const revenue = orders.reduce((sum, o) => sum + Number(o.total_cost), 0);
      const disputes = orders.filter(o => o.dispute !== null).length;

      const ratings = orders
        .map(o => o.rate_raiders)
        .filter(r => r !== null && r !== undefined)
        .map(r => r.rating_star);

      const avgRating =
        ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      return {
        driverId: driver.id,
        driverName: driver.user.username,
        totalOrders,
        completedOrders,
        cancelledOrders,
        revenue,
        disputes,
        avgRating: Number(avgRating.toFixed(1)),
      };
    });

    // Sort by completed orders descending
    return topDrivers.sort((a, b) => b.completedOrders - a.completedOrders);
  }

  /** Service 2: Weekly Driver Performance */
  async getDriverWeeklyPerformance( monthFilter: 'THIS_MONTH' | 'LAST_MONTH' = 'THIS_MONTH') {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    if (monthFilter === 'THIS_MONTH') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
    }

    const orders = await this.prisma.order.findMany({
      where: {
        // assign_rider_id: driverId,
        created_at: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        order_status: true,
        created_at: true,
      },
    });

    // Group orders by week
    const weeklyStats :WeeklyStat [] = [];
    for (let week = 0; week < 4; week++) {
      const weekStart = startOfWeek(subWeeks(startDate, -week));
      const weekEnd = endOfWeek(subWeeks(startDate, -week));

      const weekOrders = orders.filter(o =>
        isWithinInterval(o.created_at, { start: weekStart, end: weekEnd }),
      );

      weeklyStats.push({
        week: `Week ${week + 1}`,
        totalOrders: weekOrders.length,
        completedOrders: weekOrders.filter(o => o.order_status === OrderStatus.COMPLETED).length,
        cancelledOrders: weekOrders.filter(o => o.order_status === OrderStatus.CANCELLED).length,
      });
    }

    return weeklyStats;
  }


   

}
