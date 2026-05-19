import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class OrderCronService {
  private readonly logger = new Logger(OrderCronService.name);

  constructor(private readonly prisma: PrismaService) {}
   
  //  run cron every hour 
  @Cron(CronExpression.EVERY_HOUR)
  async cancelExpiredOrders() {
    this.logger.log('⏳ Checking expired orders...');

    const before24Hours = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    );

    // Find expired active orders
    const expiredOrders = await this.prisma.order.findMany({
      where: {
         created_at: {
          lte: before24Hours,
        },
        order_status: {
          in: [
            OrderStatus.PENDING,
            OrderStatus.ONGOING,
          ],
        },
      },
      select: {
        id: true,
      },
    });

    if (!expiredOrders.length) {
      this.logger.log('✅ No expired orders found');
      return;
    }

    // Cancel all expired orders
    const result = await this.prisma.order.updateMany({
      where: {
        id: {
          in: expiredOrders.map((o) => o.id),
        },
      },
      data: {
        order_status:OrderStatus.CANCELLED
      },
    });

    this.logger.log(
      `✅ ${result.count} expired orders cancelled`,
    );
  }
}