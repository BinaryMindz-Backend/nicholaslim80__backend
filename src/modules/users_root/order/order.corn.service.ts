import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { RaiderGateway } from 'src/modules/raider_root/raider gateways/raider.gateway';

@Injectable()
export class OrderCronService {
  private readonly logger = new Logger(OrderCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => RaiderGateway))
    private readonly raiderGateway: RaiderGateway

  ) { }

  //  run cron every hour 
  // @Cron(CronExpression.EVERY_HOUR)
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
            OrderStatus.PROGRESS
          ],
        },
      },
      select: {
        id: true,
        assign_rider_id: true,
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
        order_status: OrderStatus.CANCELLED
      },
    });

    // Optional: lightweight broadcast to affected riders
    // Only if you want real-time removal from open screens
    for (const order of expiredOrders) {
      // If order was assigned to a rider, notify that rider
      if (order.assign_rider_id) {
        this.raiderGateway.broadcastFeedUpdate(order.assign_rider_id, {
          type: 'ORDER_CANCELLED',
          orderId: order.id,
          message: 'Order expired and was cancelled',
        });
      }
    }


    this.logger.log(
      `✅ ${result.count} expired orders cancelled`,
    );
  }
}