/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { transactionFilterDto, TransactionStatusFilter } from './dto/filter-pagination.dto';
import { endOfDay, endOfMonth, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns';
import { TransactionStatus } from '@prisma/client';



@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(filterDto: transactionFilterDto) {
    const {
      page = 1,
      limit = 10,
      status,
      dateFilter
    } = filterDto;
    // 
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    // 
    const where: any = {};

    // ==========================
    if (status) {
      switch (status) {
        case TransactionStatusFilter.PENDING:
          where.tx_status = TransactionStatus.PENDING;
          break;
        case TransactionStatusFilter.COMPLETED:
          where.tx_status = TransactionStatus.COMPLETED;
          break;
        case TransactionStatusFilter.FAILED:
          where.tx_status = TransactionStatus.FAILED;
          break;
        case TransactionStatusFilter.ALL:
          break;
      }
    }

    // DATE FILTER

    if (dateFilter) {
      const now = new Date();

      switch (dateFilter) {
        case 'today':
          where.created_at = {
            gte: startOfDay(now),
            lte: endOfDay(now),
          };
          break;

        case 'yesterday': {
          const yStart = startOfDay(subDays(now, 1));
          const yEnd = endOfDay(subDays(now, 1));
          where.created_at = {
            gte: yStart,
            lte: yEnd,
          };
          break;
        }

        case 'last_7_days':
          where.created_at = {
            gte: subDays(now, 7),
          };
          break;

        case 'last_30_days':
          where.created_at = {
            gte: subDays(now, 30),
          };
          break;

        case 'last_month': {
          const firstDayPrevMonth = startOfMonth(subMonths(now, 1));
          const lastDayPrevMonth = endOfMonth(subMonths(now, 1));
          where.created_at = {
            gte: firstDayPrevMonth,
            lte: lastDayPrevMonth,
          };
          break;
        }
      }
    }

    const res = await this.prisma.transaction.findMany({
      where,
      skip,
      take,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        user: true,
      },
    })
    return res
  }


  // findOne  
  async findOne(id: number) {

    if (!id) {
      throw new Error('Invalid ID');
    }
    // 


    // 
    const res = await this.prisma.transaction.findUnique({
      where: {
        id,
      },
      include: {
        order: true,
        user: true,
      },
    })
    return res
  }

  // 
  // ---------------- All-time stats ----------------
  async getRevenueStats() {
    // 
    const totalRevenueRaw = await this.prisma.order.aggregate({
      _sum: { total_cost: true },
      where: { order_status: 'COMPLETED' },
    });
    const totalCommissionRaw = await this.prisma.order.aggregate({
      _sum: { commission: true },
      where: { order_status: 'COMPLETED' },
    });
    const totalRefundsRaw = await this.prisma.order.aggregate({
      _sum: { refund_amount: true },
    });
    //  
    return {
      totalRevenue: Number(totalRevenueRaw._sum.total_cost ?? 0),
      totalCommission: Number(totalCommissionRaw._sum.commission ?? 0),
      totalRefunds: Number(totalRefundsRaw._sum.refund_amount ?? 0),
    };
  }

  // ---------------- Revenue graph by month ----------------
  async getRevenueGraph(year?: number) {
    const now = new Date();
    const filterYear = year || now.getFullYear();

    const monthlyOrders = await this.prisma.order.findMany({
      where: {
        order_status: 'COMPLETED',
        created_at: {
          gte: new Date(`${filterYear}-01-01T00:00:00.000Z`),
          lte: new Date(`${filterYear}-12-31T23:59:59.999Z`),
        },
      },
      select: {
        total_cost: true,
        created_at: true,
      },
    });

    const monthlyGraph = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: 0,
    }));

    monthlyOrders.forEach(order => {
      const month = order.created_at.getMonth(); // 0-11
      monthlyGraph[month].revenue += Number(order.total_cost);
    })

    return {
      year: filterYear,
      monthlyGraph,
    };
  }


}
