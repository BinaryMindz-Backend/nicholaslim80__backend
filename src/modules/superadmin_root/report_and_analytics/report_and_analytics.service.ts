import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { OrderStatus, Prisma } from '@prisma/client';

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
        ordersWithRatings,
      ] = await Promise.all([
        this.prisma.order.count(),

        this.prisma.order.count({
          where: { order_status: OrderStatus.COMPLETED },
        }),

        this.prisma.order.count({
          where: { order_status: OrderStatus.CANCELLED },
        }),

        this.prisma.order.count({
          where: { isDispute: true },
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
      //TODo: need to implementation  total revenoe
      const totalRevenue = 0
      return {
        totalOrder,
        completedOrder,
        cancelledOrder,
        disputedOrder,
        averageOrderRating,
        totalRevenue
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
    // 

}
