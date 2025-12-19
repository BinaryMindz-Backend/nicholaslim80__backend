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
    })
    return res
  }

}
