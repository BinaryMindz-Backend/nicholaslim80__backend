/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { NotifyRaider, PriorityOrder, UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { DeliveryZone, DestinationInput, IUser, Receiver, UserRaiderMapping } from 'src/types';
import { CollectTime, DeliveryTypeName, DestinationType, NotificationType, OrderConfirmationRatioType, OrderStatus, PaymentStatus, PaymentType, PayType, Raider, RaiderStatus, RaiderVerification, RouteType, StopStatus, StopType, TransactionStatus, TransactionType, VehicleTypeEnum, WalletTransactionStatus, WalletTransactionType } from '@prisma/client';
import { OrderFilterDto } from './dto/order-filter.dto';
import { UpdateOrderStatusDto, UpdatePendingOrdersDto } from './dto/updateOrderStatusDto';
import { TransactionIdService } from 'src/common/services/transaction-id.service';
import { RedisService } from 'src/modules/auth/redis/redis.service';
import { competitionQueue } from 'src/core/queues/competition.queue';
import axios from 'axios';
import { BulkOrderWithDestinationsDto } from './dto/bulk-order-dto';
import { ServiceZoneService } from 'src/modules/superadmin_root/service-zone/service-zone.service';
import { GeoService } from 'src/utils/geo-location.utils';
import { PaginationDto } from 'src/utils/dto/pagination.dto';
import { EmailQueueService } from 'src/modules/queue/services/email-queue.service';
import { WalletService } from 'src/common/wallet/wallet.service';
import csvParser from 'csv-parser';
import { getReceiversWithIndividualPrice } from 'src/modules/dynamic_pricing/getReceiversWithPrice';
import { CreateIndiOrderDto } from './dto/create_indivitual_order_dto';
import { CreateDestinationDto } from '../destination/dto/create-destination.dto';
import { Parser } from 'json2csv';
import { UpdateOrderDetailsDto } from './dto/update-order-details.dto';
import { ApplyDiscountDto } from './dto/apply-discount.dto';
import { RaiderGateway } from 'src/modules/raider_root/raider gateways/raider.gateway';


@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private txIdService: TransactionIdService,
    private redisService: RedisService,
    private readonly serviceZone: ServiceZoneService,
    private readonly geoServices: GeoService,
    private readonly emailQueueService: EmailQueueService,
    private readonly walletService: WalletService,
    private raiderGateway: RaiderGateway,


  ) { }

  // create 
  async create(dto: CreateOrderDto, user: IUser) {
    if (!user) throw new NotFoundException('Authenticated user not found');

    const isUserExist = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!isUserExist) throw new UnauthorizedException('Unauthorized');

    const res = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: user.id,
          total_cost: 0,
          pay_type: undefined,
          delivery_type: dto.delivery_type,
          vehicle_type_id: dto.vehicle_type_id,
          route_type: dto.route_type ?? RouteType.ONE_WAY,
          order_status: OrderStatus.PROGRESS,
        },
      });

      const txId = this.txIdService.generate();
      await tx.transaction.create({
        data: {
          transaction_code: txId,
          payment_status: PaymentStatus.UNPAID,
          payment_method_id: order.payment_method_id,
          type: TransactionType.BOOK_ORDER,
          delivery_fee: order.total_cost,
          total_fee: order.total_cost,
          userId: order.userId,
          pay_type: order.pay_type,
          orderId: order.id,
        },
        include: {
          user: { select: { username: true } },
          order: { select: { id: true, order_status: true } },
        },
      });

      return order;
    });
    // await this.emailQueueService.queueOrderStatusNotification({
    //   userId: user.id,
    //   fcmToken: isUserExist?.fcmToken ?? '',
    //   orderId: res.id,
    //   orderNumber: `ORD-${String(res.id).padStart(6, '0')}`,
    //   status: NotificationType.ORDER_UPDATE,
    //   title: 'Order Created Successfully',
    //   message: `Your order ORD-${String(res.id).padStart(6, '0')} has been created with total cost $${res.total_cost.toFixed(2)}.`,
    // });
    return res;
  }

  /**
 * ADD DESTINATION TO ORDER (Creates OrderStop snapshot)
 */
  async addDestinationToOrder(
    orderId: number,
    destinationId: number,
    userId: number,
    stopType: StopType,
  ) {
    // Verify order ownership
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { orderStops: true },
    });

    if (!order || order.userId !== userId) {
      throw new BadRequestException('Order not found or unauthorized');
    }

    if (order.order_status !== OrderStatus.PROGRESS) {
      throw new BadRequestException('Cannot modify placed order');
    }

    // Get destination
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination || destination.userId !== userId) {
      throw new BadRequestException('Destination not found or unauthorized');
    }

    // Validate destination type
    if (stopType === StopType.PICKUP && destination.type === DestinationType.RECEIVER) {
      throw new BadRequestException('Cannot use RECEIVER-only destination as pickup');
    }
    if (stopType === StopType.DROP && destination.type === DestinationType.SENDER) {
      throw new BadRequestException('Cannot use SENDER-only destination as drop');
    }

    // Check if already added
    const existing = await this.prisma.orderStop.findFirst({
      where: { orderId, destinationId, type: stopType },
    });

    if (existing) {
      throw new BadRequestException('Destination already added to order');
    }

    // Determine sequence
    let sequence: number;

    if (stopType === StopType.PICKUP) {
      // Pickup is always sequence 1 (index 0)
      sequence = 1;

      // If pickup already exists, update it instead
      const existingPickup = await this.prisma.orderStop.findFirst({
        where: { orderId, type: StopType.PICKUP },
      });

      if (existingPickup) {
        // Update existing pickup
        return this.prisma.orderStop.update({
          where: { id: existingPickup.id },
          data: {
            destinationId,
            address: destination.address!,
            latitude: destination.latitude!,
            longitude: destination.longitude!,
          },
        });
      }
    } else {
      // Drops start from sequence 2, 3, 4...
      const maxSequence = await this.prisma.orderStop.findFirst({
        where: { orderId },
        orderBy: { sequence: 'desc' },
        select: { sequence: true },
      });

      sequence = (maxSequence?.sequence || 1) + 1;
    }

    // Create stop
    const orderStop = await this.prisma.orderStop.create({
      data: {
        orderId,
        destinationId,
        type: stopType,
        sequence,
        address: destination.address!,
        latitude: destination.latitude!,
        longitude: destination.longitude!,
        payment: {
          create: {
            payType: order.pay_type ?? PayType.COD,
            amount: 0,
            status: PaymentStatus.UNPAID,
          },
        },
      },
    });

    // Update destination usage stats
    await this.prisma.destination.update({
      where: { id: destinationId },
      data: {
        lastUsedAt: new Date(),
        useCount: { increment: 1 },
      },
    });

    // Recalculate price with individual pricing
    const pricingResult = await this.recalculateOrderPrice(orderId);

    return {
      orderStop,
      pricing: pricingResult,
    };
  }

  /**
  * REMOVE DESTINATION FROM ORDER
  */
  async removeDestinationFromOrder(orderId: number, orderStopId: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== userId) {
      throw new BadRequestException('Order not found or unauthorized');
    }

    if (order.order_status !== OrderStatus.PROGRESS) {
      throw new BadRequestException('Cannot modify placed order');
    }

    const orderStop = await this.prisma.orderStop.findUnique({
      where: { id: orderStopId },
    });

    if (!orderStop || orderStop.orderId !== orderId) {
      throw new BadRequestException('Order stop not found');
    }

    // Delete stop (cascades to payment)
    await this.prisma.orderStop.delete({ where: { id: orderStopId } });

    // Resequence remaining stops
    const remainingStops = await this.prisma.orderStop.findMany({
      where: { orderId },
      orderBy: { sequence: 'asc' },
    });

    for (let i = 0; i < remainingStops.length; i++) {
      await this.prisma.orderStop.update({
        where: { id: remainingStops[i].id },
        data: { sequence: i + 1 },
      });
    }

    // Recalculate price
    await this.recalculateOrderPrice(orderId);

    return { message: 'Destination removed from order' };
  }

  // Update order and recalculate price
  async updateOrderDetails(
    orderId: number,
    userId: number,
    dto: UpdateOrderDetailsDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, userId },
    });

    if (!order) throw new NotFoundException('Order not found');

    if (order.order_status !== OrderStatus.PROGRESS) {
      throw new BadRequestException('Cannot update placed order');
    }

    // Track if price needs recalculation
    const needsRecalculation =
      dto.delivery_type !== undefined ||
      dto.isFixed !== undefined ||
      dto.vehicle_type_id !== undefined ||
      dto.route_type !== undefined ||
      dto.scheduled_time !== undefined;

    // Update order
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        ...(dto.delivery_type && { delivery_type: dto.delivery_type }),
        ...(dto.isFixed && { isFixed: dto.isFixed }),
        ...(dto.route_type && { route_type: dto.route_type }),
        ...(dto.collect_time && { collect_time: dto.collect_time }),
        ...(dto.scheduled_time && { scheduled_time: dto.scheduled_time }),
        ...(dto.vehicle_type_id && {
          vehicle: {
            connect: { id: dto.vehicle_type_id },
          },
        }),
      },
    });

    // Recalculate price if relevant fields changed
    if (needsRecalculation) {
      await this.recalculateOrderPrice(orderId);
    }

    return this.getOrderDetails(orderId);
  }

  /**
 * PLACE ORDER (Lock and configure payments)
 */
  async placeOrder(
    orderId: number,
    userId: number,
    dto: {
      paymentMethod?: PayType;
      paymentMethodId?: string;
      codCollectFrom?: 'SENDER' | 'RECEIVER'
    },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        vehicle: {
          select: {
            vehicle_type: true,
            id: true,
          }
        },
        orderStops: {
          include: { payment: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!order || order.userId !== userId) {
      throw new BadRequestException('Order not found or unauthorized');
    }

    // 
    if (order.order_status !== OrderStatus.PROGRESS) {
      throw new BadRequestException('Order already placed');
    }
    // 
    // Validate order has stops
    const pickupStop = order.orderStops.find(s => s.type === StopType.PICKUP);
    const dropStops = order.orderStops.filter(s => s.type === StopType.DROP);

    if (!pickupStop || dropStops.length === 0) {
      throw new BadRequestException('Order must have at least 1 pickup and 1 drop location');
    }

    const payType = dto.paymentMethod ?? order.pay_type ?? PayType.COD;
    const codCollectFrom = dto.codCollectFrom ?? 'RECEIVER';
    // 
    const placeRes = await this.prisma.$transaction(async (tx) => {
      /** ----------------------- UPFRONT PAYMENT ----------------------- */
      if (payType === PayType.WALLET) {
        const user = await tx.user.findUnique({ where: { id: userId } });

        if (!user || Number(user.currentWalletBalance) < Number(order.total_cost)) {
          throw new BadRequestException('Insufficient wallet balance');
        }

        await tx.user.update({
          where: { id: userId },
          data: { currentWalletBalance: { decrement: Number(order.total_cost) } },
        });

        // Mark all stops as PAID
        await tx.stopPayment.updateMany({
          where: { orderStopId: { in: order.orderStops.map(s => s.id) } },
          data: {
            payType: PayType.WALLET,
            status: PaymentStatus.PAID,
            amount: 0,
          },
        });
      }

      if (payType === PayType.ONLINE_PAY) {
        if (!dto.paymentMethodId) {
          throw new BadRequestException('Payment method ID required');
        }

        const paid = await this.walletService.addMoney(
          userId,
          Number(order.total_cost),
          dto.paymentMethodId
        );

        if (!paid) throw new BadRequestException('Online payment failed');

        await tx.stopPayment.updateMany({
          where: { orderStopId: { in: order.orderStops.map(s => s.id) } },
          data: {
            payType: PayType.ONLINE_PAY,
            status: PaymentStatus.PAID,
            amount: 0,
          },
        });
      }

      /** ----------------------- COD PAYMENT SETUP ----------------------- */
      if (payType === PayType.COD) {
        if (codCollectFrom === 'SENDER') {
          // Sender pays at pickup
          await tx.stopPayment.update({
            where: { orderStopId: pickupStop.id },
            data: {
              amount: Number(order.total_cost),
              payType: PayType.COD,
              status: PaymentStatus.UNPAID,
            },
          });

          // Receivers pay nothing
          for (const drop of dropStops) {
            await tx.stopPayment.update({
              where: { orderStopId: drop.id },
              data: { amount: 0, status: PaymentStatus.PAID },
            });
          }
        } else {
          // Each receiver pays
          const perDropAmount = Number(order.total_cost) / dropStops.length;

          // Sender pays nothing
          await tx.stopPayment.update({
            where: { orderStopId: pickupStop.id },
            data: { amount: 0, status: PaymentStatus.PAID },
          });

          // Each receiver pays their share
          for (const drop of dropStops) {
            await tx.stopPayment.update({
              where: { orderStopId: drop.id },
              data: {
                amount: perDropAmount,
                payType: PayType.COD,
                status: PaymentStatus.UNPAID,
              },
            });
          }
        }
      }

      /** ----------------------- UPDATE ORDER ----------------------- */
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          order_status: OrderStatus.PENDING,
          is_placed: true,
          pay_type: payType,
        },
        include: {
          orderStops: {
            include: {
              destination: true,
              payment: true,
            },
            orderBy: { sequence: 'asc' },
          },
        },
      });
      // 
      if (order.notify_favorite_raider === true) {
        //  
        const favRaiders = await tx.myRaider.findMany({
          where: {
            user_id: userId,
            is_fav: true,
          },
          select: {
            raiderId: true,
            user_id: true,
            is_fav: true,
            user: {
              select: {
                username: true,
                id: true,
                email: true
              }
            }
          }
        })
        // console.log("fav raider -->", favRaiders);
        // Send notification to rider
        if (favRaiders.length > 0) {
          // 
          for (const rider of favRaiders) {
            // console.log("rraider -->", rider);
            await this.raiderGateway.notifyUserFavRaider(
              rider.raiderId,
              orderId,
              rider.user.username,
              {
                orderId: order.id,
                totalOrderCost: String(order.total_cost),
                totalFee: String(order.total_fee),
                vehicleType: order.vehicle!,
                deliveryType: order.delivery_type,
                orderStop: order.orderStops
              },
            )
          }
        }

      }
      // 
      return updatedOrder;

    });
    const isUserExist = await this.prisma.user.findUnique({ where: { id: userId } });
    if (isUserExist) {
      // Send notification to user
      await this.emailQueueService.queueOrderStatusNotification({
        userId: isUserExist.id,
        fcmToken: isUserExist?.fcmToken ?? '',
        orderId: placeRes.id,
        orderNumber: `ORD-${String(placeRes.id).padStart(6, '0')}`,
        status: NotificationType.ORDER_UPDATE,
        title: 'Order Placed Successfully',
        message: `Your order ORD-${String(placeRes.id).padStart(6, '0')} has been placed with total cost $${placeRes.total_cost.toFixed(2)}.`,
      });
    }
    // 
    return placeRes;

  }

  // notify rider
  async notifyRider(orderId: number, userId: number) {
    // 
    const isOrderExist = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId
      }
    })
    //  
    if (!isOrderExist || (isOrderExist && isOrderExist?.collect_time !== CollectTime.SCHEDULED)) {
      throw new NotFoundException(`${isOrderExist?.collect_time !== CollectTime.SCHEDULED && "Scheduled"} Order Not found`)
    }
    //  
    const r = await this.prisma.order.update({
      where: {
        id: orderId
      },
      data: {
        is_auto_confirmation: false,
      }
    })

    // 
    return r;


  }

  // notify rider
  async notifyFavRider(orderId: number, userId: number, dto: NotifyRaider) {
    // 
    const isOrderExist = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId
      }
    })
    //  
    if (!isOrderExist) {
      throw new NotFoundException(`Order Not found`)
    }
    //  
    const r = await this.prisma.order.update({
      where: {
        id: orderId
      },
      data: {
        notify_favorite_raider: dto.notify_rider
      }
    })
    // 
    return r;
  }



  // 
  async priorityOrder(
    orderId: number,
    userId: number,
    dto: PriorityOrder,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id: orderId,
          userId,
        },
      });

      if (!order) {
        throw new NotFoundException(`ORD-${orderId} not found`);
      }

      if (order.isPriorited === true) {
        throw new BadRequestException(`ORD-${orderId} is already on priority`);
      }

      // ───────────────── WALLET PAYMENT ─────────────────
      if (dto.payType === PayType.WALLET) {
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (
          !user ||
          Number(user.currentWalletBalance) < Number(5)
        ) {
          throw new BadRequestException('Insufficient wallet balance minimum priory amount 5');
        }
        // 
        await tx.user.update({
          where: { id: userId },
          data: {
            currentWalletBalance: {
              decrement: Number(order.total_cost),
            },
          },
        });
      }

      // ───────────────── ONLINE PAYMENT ─────────────────
      if (dto.payType === PayType.ONLINE_PAY) {
        if (!dto.paymentMethodId) {
          throw new BadRequestException('Payment method ID required');
        }

        const paid = await this.walletService.addMoney(
          userId,
          Number(order.total_cost),
          dto.paymentMethodId,
        );

        if (!paid) {
          throw new BadRequestException('Online payment failed');
        }
      }

      const isUserExist = await this.prisma.user.findUnique({ where: { id: userId } });
      // Send notification to user
      await this.emailQueueService.queueOrderStatusNotification({
        userId: userId,
        fcmToken: isUserExist?.fcmToken ?? '',
        orderId: order.id,
        orderNumber: `ORD-${String(order.id).padStart(6, '0')}`,
        status: NotificationType.ORDER_UPDATE,
        title: 'Order Prioritized Successfully',
        message: `Your order ORD-${String(order.id).padStart(6, '0')} has been prioritized with total cost $${order.total_cost.toFixed(2)}.`,
      });

      // ───────────────── UPDATE ORDER PRIORITY ─────────────────
      return tx.order.update({
        where: { id: orderId },
        data: {
          isPriorited: true,
          priorityAt: new Date(),
        },
      });
    });
  }

  /**
  * COMPLETE STOP (Raider)
  */
  async completeStop(
    orderStopId: number,
    raiderId: number,
    dto: {
      proofFiles: string[];
      codCollected?: number;
      notes?: string;
    },
  ) {
    //  check if raider exist
    const raider = await this.prisma.raider.findUnique({
      where: {
        userId: raiderId
      },
      include: {
        user: true,
      }
    })
    // 
    if (!raider) {
      throw new NotFoundException('Aunauthprized raider');
    }

    // 
    const stop = await this.prisma.orderStop.findUnique({
      where: { id: orderStopId },
      include: {
        payment: true,
        order: true,
      },
    });

    if (!stop) throw new NotFoundException('Stop not found');
    if (stop.status === StopStatus.COMPLETED) {
      throw new BadRequestException('Stop already completed');
    }

    return await this.prisma.$transaction(async (tx) => {
      const requiresPayment = stop.payment && Number(stop.payment.amount) > 0;

      // Validate COD collection
      if (requiresPayment) {
        if (!dto.codCollected) {
          throw new BadRequestException('COD collection required');
        }

        const expected = Number(stop.payment!.amount);
        if (dto.codCollected < expected) {
          throw new BadRequestException(
            `Insufficient payment. Expected: ${expected}, Received: ${dto.codCollected}`,
          );
        }

        // Mark payment as PAID
        await tx.stopPayment.update({
          where: { id: stop.payment!.id },
          data: {
            amount: dto.codCollected,
            status: PaymentStatus.PAID,
            collectedAt: new Date(),
            collectedBy: raiderId,
          },
        });
      }

      // Mark stop as COMPLETED
      await tx.orderStop.update({
        where: { id: orderStopId },
        data: {
          proofs: dto.proofFiles,
          notes: dto.notes,
          status: StopStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Check if all stops completed
      const incompleteStops = await tx.orderStop.findMany({
        where: {
          orderId: stop.orderId,
          OR: [
            { status: { in: [StopStatus.PENDING, StopStatus.FAILED] } },
            {
              payment: {
                status: PaymentStatus.UNPAID,
                amount: { gt: 0 },
              },
            },
          ],
        },
      });

      // Auto-complete order if everything done
      if (incompleteStops.length === 0) {
        await tx.order.update({
          where: { id: stop.orderId },
          data: { order_status: OrderStatus.COMPLETED },
        });

        await tx.raider.update({
          where: { userId: raiderId },
          data: { completed_orders: { increment: 1 } },
        });
        // need to calculate driver fees
        const driverFee = await this.calculateDriverFee(stop.orderId);
        const orderTotal = Number(stop.order.total_cost);

        let driverCredit: number;
        let platformLoss: number;

        if (orderTotal >= driverFee) {
          driverCredit = orderTotal - driverFee;
          platformLoss = 0;
        } else {
          driverCredit = 0;               // driver gets nothing
          platformLoss = driverFee - orderTotal; // platform absorbs remaining fee
        }

        // Update driver wallet
        await tx.user.update({
          where: { id: raiderId },
          data: {
            totalWalletBalance: { increment: driverCredit },
            currentWalletBalance: { increment: driverCredit }
          },
        });
        // 
        await tx.walletHistory.create({
          data: {
            userId: raiderId,
            amount: driverCredit,
            type: 'credit',
            transactionId: `TRX-earning-${stop.orderId}`,
            transactionType: WalletTransactionType.EARNING,
            status: WalletTransactionStatus.SUCCESS,
            currency: 'SGD',
          },
        });

        // 
        await tx.transaction.update({
          where: { id: stop.orderId },
          data: {
            payment_status: PaymentStatus.PAID,
            tx_status: TransactionStatus.COMPLETED,
            pay_type: stop.order.pay_type,
            total_fee: stop.order.total_cost,
            delivery_fee: stop.order.total_cost,

          }
        })

        return {
          message: 'Stop completed. Order fully completed!',
          orderCompleted: true,
        };
      }
      const isUserExist = await this.prisma.user.findUnique({ where: { id: stop.order.userId! } });
      // Send notification to user
      await this.emailQueueService.queueOrderStatusNotification({
        userId: stop.order.userId!,
        fcmToken: isUserExist?.fcmToken ?? '',
        orderId: stop.orderId,
        orderNumber: `ORD-${String(stop.orderId).padStart(6, '0')}`,
        status: NotificationType.ORDER_UPDATE,
        title: 'Order Completed Successfully',
        message: `Your order ORD-${String(stop.orderId).padStart(6, '0')} has been completed with total cost $${stop.order.total_cost.toFixed(2)}.`,
      });
      // Send notification to raider
      await this.emailQueueService.queueOrderStatusNotification({
        userId: raider.userId,
        fcmToken: raider.user.fcmToken ?? '',
        orderId: stop.orderId,
        orderNumber: `ORD-${String(stop.orderId).padStart(6, '0')}`,
        status: NotificationType.ORDER_UPDATE,
        title: 'Order Completed Successfully',
        message: `Your order ORD-${String(stop.orderId).padStart(6, '0')} has been completed with total cost $${stop.order.total_cost.toFixed(2)}.`,
      });
      return {
        message: 'Stop completed successfully',
        orderCompleted: false,
        remainingStops: incompleteStops.length,
      };
    });
  }
  // 
  private async calculateDriverFee(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderStops: true,
        serviceZone: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (!order.serviceZone) throw new NotFoundException('Service area not found');

    // Sum standard commission fees
    const standardCommissionRates = await this.prisma.standardCommissionRate.findMany({
      where: { service_area_id: order.serviceZoneId }
    });
    const standardCommissionFee = standardCommissionRates.reduce(
      (acc, rate) => acc + rate.commission_rate_delivery_fee,
      0
    );

    // Sum deductions
    const deductionFees = await this.prisma.raiderDeductionFee.findMany();
    const deductionFeeAmount = deductionFees.reduce(
      (acc, fee) => acc + fee.amount,
      0
    );

    // Calculate total, clamp to zero
    const totalFee = Math.max(0, standardCommissionFee + deductionFeeAmount);
    return totalFee;
  }




  // cancle order 
  async cancelOrder(orderId: number, userId: number, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderStops: { include: { payment: true } },
        user: true,
        assign_rider: {
          include: {
            user: {
              select: {
                id: true,
                fcmToken: true
              }
            }
          }
        },
      },
    });

    if (!order || order.userId !== userId) {
      throw new BadRequestException('Order not found or unauthorized');
    }

    // Can only cancel PROGRESS or PENDING orders
    if (!["PROGRESS", "PENDING"].includes(order.order_status)) {
      throw new BadRequestException('Cannot cancel order in current status');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Refund if already paid
      if (order.pay_type === PayType.WALLET && order.is_placed) {
        await tx.user.update({
          where: { id: userId },
          data: {
            currentWalletBalance: {
              increment: Number(order.total_cost),
            },
          },
        });
      }

      // For ONLINE_PAY, you'd trigger a refund via payment gateway here
      if (order.pay_type === PayType.ONLINE_PAY && order.is_placed) {
        // await this.walletService.refund(...)
      }

      // Update order status
      const cancelledOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          order_status: OrderStatus.CANCELLED,
          // You could add a cancellation_reason field to store the reason
        },
      });

      // Update transaction if exists
      const transaction = await tx.transaction.findFirst({
        where: { orderId },
      });

      if (transaction) {
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            tx_status: TransactionStatus.FAILED,
            payment_status: PaymentStatus.PENDING,
          },
        });
      }
      if (order.user?.fcmToken) {
        // Send notification to user
        await this.emailQueueService.queueOrderStatusNotification({
          userId: order.userId!,
          fcmToken: order.user.fcmToken ?? '',
          orderId: order.id,
          orderNumber: `ORD-${String(order.id).padStart(6, '0')}`,
          status: NotificationType.ORDER_UPDATE,
          title: 'Order Cancelled',
          message: `Your order ORD-${String(order.id).padStart(6, '0')} has been cancelled.`,
        });
      }
      // Send notification to raider
      if (order.assign_rider?.user?.fcmToken) {
        await this.emailQueueService.queueOrderStatusNotification({
          userId: order.assign_rider_id!,
          fcmToken: order.assign_rider.user.fcmToken ?? '',
          orderId: order.id,
          orderNumber: `ORD-${String(order.id).padStart(6, '0')}`,
          status: NotificationType.ORDER_UPDATE,
          title: 'Order Cancelled',
          message: `Your order ORD-${String(order.id).padStart(6, '0')} has been cancelled.`,
        });
      }

      // 
      return {
        message: 'Order cancelled successfully',
        order: cancelledOrder,
        refunded: order.is_placed
      };
    });
  }

  /**
   * Fail a stop (Rule #4: Receiver not available)
   */
  async failStop(stopId: number, reason: string) {
    const stop = await this.prisma.orderStop.findUnique({
      where: { id: stopId },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                fcmToken: true
              }
            },
            assign_rider: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    fcmToken: true
                  }
                }
              }
            }
          }
        }
      },
    });

    if (!stop) throw new NotFoundException('Stop not found');

    if (stop.status === StopStatus.COMPLETED) {
      throw new BadRequestException('Cannot fail completed stop');
    }

    await this.prisma.orderStop.update({
      where: { id: stopId },
      data: {
        status: StopStatus.FAILED,
        failedAt: new Date(),
        failureReason: reason,
      },
    });
    // Send notification to user
    if (stop.order.user?.fcmToken) {
      await this.emailQueueService.queueOrderStatusNotification({
        userId: stop.order.userId!,
        fcmToken: stop.order.user.fcmToken ?? '',
        orderId: stop.order.id,
        orderNumber: `ORD-${String(stop.order.id).padStart(6, '0')}`,
        status: NotificationType.ORDER_UPDATE,
        title: 'Order Failed',
        message: `Your order ORD-${String(stop.order.id).padStart(6, '0')} has been failed with total cost $${stop.order.total_cost.toFixed(2)}.`,
      });
    }
    // Send notification to raider
    if (stop.order.assign_rider?.user?.fcmToken) {
      await this.emailQueueService.queueOrderStatusNotification({
        userId: stop.order.assign_rider_id!,
        fcmToken: stop.order.assign_rider.user.fcmToken ?? '',
        orderId: stop.order.id,
        orderNumber: `ORD-${String(stop.order.id).padStart(6, '0')}`,
        status: NotificationType.ORDER_UPDATE,
        title: 'Order Failed',
        message: `Your order ORD-${String(stop.order.id).padStart(6, '0')} has been failed with total cost $${stop.order.total_cost.toFixed(2)}.`,
      });
    }
    return {
      message: 'Stop marked as FAILED. Order cannot complete until resolved.',
      requiresAdminAction: true,
      stopId,
      orderId: stop.orderId,
    };
  }

  /**
   * Retry a failed stop
   */
  async retryFailedStop(stopId: number) {
    const stop = await this.prisma.orderStop.findUnique({
      where: {
        id: stopId,
      },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                fcmToken: true
              }
            },
          }
        }
      }
    });

    if (!stop) throw new NotFoundException('Stop not found');

    if (stop.status !== StopStatus.FAILED) {
      throw new BadRequestException('Stop is not in FAILED state');
    }

    await this.prisma.orderStop.update({
      where: { id: stopId },
      data: {
        status: StopStatus.PENDING,
        failedAt: null,
        failureReason: null,
      },
    });
    // 
    // Send notification to user
    if (stop.order.user?.fcmToken) {
      await this.emailQueueService.queueOrderStatusNotification({
        userId: stop.order.userId!,
        fcmToken: stop.order.user.fcmToken ?? '',
        orderId: stop.order.id,
        orderNumber: `ORD-${String(stop.order.id).padStart(6, '0')}`,
        status: NotificationType.ORDER_UPDATE,
        title: 'Order retried',
        message: `Your order ORD-${String(stop.order.id).padStart(6, '0')} has been retried with total cost $${stop.order.total_cost.toFixed(2)}.`,
      });
    }
    return {
      message: 'Stop reset to PENDING for retry',
      stopId
    };
  }

  /** deprecated
 * Create individual order with geocoding and pricing
 */

  // 
  async createIndividualOrder(payload: CreateIndiOrderDto, user: IUser) {
    // Step 1: Geocode all destinations
    const geocodedDestinations: DestinationInput[] = [];
    let orderServiceZoneId: number | null = null;
    let orderServiceZone: DeliveryZone | null = null;

    for (const d of payload.destinations) {
      let lat = d.latitude;
      let lng = d.longitude;
      let formattedAddress = d.addressFromApr;

      // Geocode if coordinates missing
      if (!lat || !lng) {
        const geo = await this.geoServices.getLatLngFromAddress(d.address ?? '');
        lat = geo.lat;
        lng = geo.lng;
        formattedAddress = geo.formattedAddress;
      }

      // Find service zone
      const zone = await this.serviceZone.findZoneByPoint(lat, lng);

      // Assign service zone from SENDER destination
      if (d.type === DestinationType.SENDER && zone && !orderServiceZone) {
        orderServiceZoneId = zone.id;
        orderServiceZone = zone;
      }

      geocodedDestinations.push({
        ...d,
        address: d.address ?? '',
        latitude: lat,
        longitude: lng,
        type: d.type ?? DestinationType.SENDER,
        is_saved: d.is_saved ?? false,
        addressFromApr: formattedAddress,
      });
    }

    // Validate service zone
    if (!orderServiceZone) {
      throw new BadRequestException('Pickup location is outside service zone');
    }

    // Step 2: Extract sender and receivers
    const senderDestination = geocodedDestinations.find(
      (d) => d.type === DestinationType.SENDER,
    );

    if (!senderDestination?.latitude || !senderDestination?.longitude) {
      throw new BadRequestException('Sender location not found');
    }

    const sender: Receiver = {
      lat: senderDestination.latitude,
      lng: senderDestination.longitude,
    };

    const receiverDestinations = geocodedDestinations.filter(
      (d) => d.type !== DestinationType.SENDER
    );

    if (receiverDestinations.length === 0) {
      throw new BadRequestException('At least one receiver destination is required');
    }

    // Step 3: Calculate individual pricing per drop
    const receiversWithPrice = await getReceiversWithIndividualPrice(
      this.prisma,
      sender,
      receiverDestinations.map((d) => ({ lat: d.latitude, lng: d.longitude })),
      payload.delivery_type,
      payload.vehicle_type_id,
      orderServiceZone,
      {
        isRoundTrip: payload.route_type === RouteType.ROUND,
        returnFactor: 0.5,
      },
    );
    // console.log(receiversWithPrice,)
    const totalCost = receiversWithPrice.reduce((sum, r) => sum + r.pricing.totalPrice, 0);
    const totalFee = receiversWithPrice.reduce((sum, r) => sum + r.pricing.totalFee, 0);
    const totalDistance = receiversWithPrice.reduce((sum, r) => sum + r.distanceKm, 0);

    // Step 4: Create order in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          serviceZoneId: Number(orderServiceZoneId),
          userId: user.id,
          route_type: payload.route_type,
          delivery_type: payload.delivery_type,
          collect_time: payload.collect_time,
          scheduled_time: payload.scheduled_time,
          vehicle_type_id: payload.vehicle_type_id,
          originalCost: parseFloat(totalCost.toFixed(2)),
          total_cost: parseFloat(totalCost.toFixed(2)),
          total_fee: parseFloat(totalFee.toFixed(2)),
          total_distance: parseFloat(totalDistance.toFixed(2)),
          isFixed: payload.isFixed ?? false,
          order_status: OrderStatus.PROGRESS,
        },
      });

      const createdStops: any[] = [];

      // Step 1: Create PICKUP first (sequence 1 - index 0)
      const pickupDest = await tx.destination.create({
        data: {
          userId: user.id,
          address: senderDestination.address,
          addressFromApr: senderDestination.addressFromApr ?? senderDestination.address,
          floor_unit: senderDestination.floor_unit ?? null,
          contact_name: senderDestination.contact_name ?? null,
          contact_number: senderDestination.contact_number ?? null,
          latitude: senderDestination.latitude,
          longitude: senderDestination.longitude,
          additionalInfo: senderDestination.note_to_driver ?? null,
          type: DestinationType.SENDER,
          is_saved: senderDestination.is_saved ?? false,
          lastUsedAt: new Date(),
          useCount: 1,
        },
      });

      const pickupStop = await tx.orderStop.create({
        data: {
          orderId: order.id,
          destinationId: pickupDest.id,
          type: StopType.PICKUP,
          sequence: 1, // Always first
          status: StopStatus.PENDING,
          address: senderDestination.addressFromApr ?? senderDestination.address,
          latitude: senderDestination.latitude,
          longitude: senderDestination.longitude,
          additionalInfo: senderDestination.note_to_driver ?? null,
          payment: {
            create: {
              payType: PayType.COD,
              amount: 0, // Pickup doesn't pay
              status: PaymentStatus.PAID,
            },
          },
        },
      });

      createdStops.push(pickupStop);

      // Step 2: Create DROP stops (sequence 2, 3, 4...)
      for (let i = 0; i < receiverDestinations.length; i++) {
        const d = receiverDestinations[i];
        const pricing = receiversWithPrice[i];

        // Create destination
        const dropDest = await tx.destination.create({
          data: {
            userId: user.id,
            address: d.address,
            addressFromApr: d.addressFromApr ?? d.address,
            floor_unit: d.floor_unit ?? null,
            contact_name: d.contact_name ?? null,
            contact_number: d.contact_number ?? null,
            latitude: d.latitude,
            longitude: d.longitude,
            additionalInfo: d.note_to_driver ?? null,
            type: DestinationType.RECEIVER,
            is_saved: d.is_saved ?? false,
            lastUsedAt: new Date(),
            useCount: 1,
          },
        });

        // Create drop stop with individual price
        const dropStop = await tx.orderStop.create({
          data: {
            orderId: order.id,
            destinationId: dropDest.id,
            type: StopType.DROP,
            sequence: i + 2, // Starts from 2 (after pickup)
            status: StopStatus.PENDING,
            address: d.addressFromApr ?? d.address,
            latitude: d.latitude,
            longitude: d.longitude,
            additionalInfo: d.note_to_driver ?? null,
            payment: {
              create: {
                payType: PayType.COD,
                amount: parseFloat(pricing.pricing.totalPrice.toFixed(2)), // Individual price
                status: PaymentStatus.UNPAID,
              },
            },
          },
        });

        createdStops.push(dropStop);
      }

      // Create transaction record
      const txId = this.txIdService.generate();
      const transaction = await tx.transaction.create({
        data: {
          transaction_code: txId,
          payment_status: PaymentStatus.UNPAID,
          type: TransactionType.BOOK_ORDER,
          delivery_fee: order.total_cost,
          total_fee: order.total_fee,
          userId: user.id,
          pay_type: PayType.COD,
          orderId: order.id,
        },
      });

      return {
        order,
        transaction,
        stops: createdStops,
        pricingBreakdown: receiversWithPrice.map((r, i) => ({
          stopSequence: i + 2,
          address: receiverDestinations[i].address,
          distance: r.distanceKm,
          price: r.pricing.totalPrice,
        })),
      };
    });
    const exUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });
    // send notification to user
    await this.emailQueueService.queueOrderStatusNotification({
      userId: user.id,
      fcmToken: exUser?.fcmToken ?? '',
      orderId: result.order.id,
      orderNumber: `ORD-${String(result.order.id).padStart(6, '0')}`,
      status: NotificationType.ORDER_UPDATE,
      title: 'Order Created Successfully',
      message: `Your order ORD-${String(result.order.id).padStart(6, '0')} has been created with total cost $${result.order.total_cost.toFixed(2)}.`,
    });


    return result;
  }


  //  export as csv
  async exportOrdersAsCsv() {
    const orders = await this.prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            vehicle_type: true,
          },
        },
        orderStops: {
          include: {
            destination: true,
          },
          orderBy: { sequence: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted_orders = orders.map((order) => {
      const sender = order.orderStops.find(
        s => s.type === 'PICKUP'
      );

      const receiver = order.orderStops.find(
        s => s.type === 'DROP'
      );

      return {
        order_id: order.id,
        user_name: order.user?.username ?? '',
        user_phone: order.user?.phone ?? '',
        route_type: order.route_type,
        delivery_type: order.delivery_type,
        pay_type: order.pay_type,
        collect_time: order.collect_time,
        vehicle_type: order.vehicle?.vehicle_type ?? '',
        total_cost: order.total_cost,
        total_fee: order.total_fee,
        total_distance: order.total_distance,
        order_status: order.order_status,
        is_fixed: order.isFixed,
        raider_confirmation: order.raider_confirmation,

        // Sender info from stop
        sender_address: sender?.address ?? '',
        sender_contact_name: sender?.destination?.contact_name ?? '',
        sender_contact_number: sender?.destination?.contact_number ?? '',
        sender_floor_unit: sender?.destination?.floor_unit ?? '',
        sender_note: sender?.destination?.additionalInfo ?? '',

        // Receiver info from stop
        receiver_address: receiver?.address ?? '',
        receiver_contact_name: receiver?.destination?.contact_name ?? '',
        receiver_contact_number: receiver?.destination?.contact_number ?? '',
        receiver_floor_unit: receiver?.destination?.floor_unit ?? '',
        receiver_note: receiver?.destination?.additionalInfo ?? '',

        created_at: order.created_at,
        updated_at: order.updated_at,
      };
    });

    const fields = [
      { label: 'Order ID', value: 'order_id' },
      { label: 'User Name', value: 'user_name' },
      { label: 'User Phone', value: 'user_phone' },
      { label: 'Route Type', value: 'route_type' },
      { label: 'Delivery Type', value: 'delivery_type' },
      { label: 'Payment Type', value: 'pay_type' },
      { label: 'Collection Time', value: 'collect_time' },
      { label: 'Vehicle Type', value: 'vehicle_type' },
      { label: 'Total Cost', value: 'total_cost' },
      { label: 'Total Fee', value: 'total_fee' },
      { label: 'Total Distance', value: 'total_distance' },
      { label: 'Order Status', value: 'order_status' },
      { label: 'Is Fixed', value: 'is_fixed' },
      { label: 'Raider Confirmation', value: 'raider_confirmation' },

      { label: 'Sender Address', value: 'sender_address' },
      { label: 'Sender Contact Name', value: 'sender_contact_name' },
      { label: 'Sender Contact Number', value: 'sender_contact_number' },
      { label: 'Sender Floor/Unit', value: 'sender_floor_unit' },
      { label: 'Sender Note', value: 'sender_note' },

      { label: 'Receiver Address', value: 'receiver_address' },
      { label: 'Receiver Contact Name', value: 'receiver_contact_name' },
      { label: 'Receiver Contact Number', value: 'receiver_contact_number' },
      { label: 'Receiver Floor/Unit', value: 'receiver_floor_unit' },
      { label: 'Receiver Note', value: 'receiver_note' },

      { label: 'Created At', value: 'created_at' },
      { label: 'Updated At', value: 'updated_at' },
    ];

    const parser = new Parser({ fields });
    return parser.parse(formatted_orders);
  }


  // bulk order create from csv
  async bulkCreateOrdersFromCsv(dto: BulkOrderWithDestinationsDto, userId: number) {
    // Validate file URL
    // if (!dto?.fileUrl.startsWith(process.env.BASE_URL!)) {
    //   throw new BadRequestException('Invalid file source');
    // }

    const response = await axios.get(dto.fileUrl, { responseType: 'stream' });

    const skippedRows: any[] = [];
    const successfulOrders: any[] = [];
    const rowsToProcess: any[] = [];

    // Collect all rows first
    const stream = response.data.pipe(csvParser());
    for await (const row of stream) {
      rowsToProcess.push(row);
    }

    // Process each row
    for (const row of rowsToProcess) {
      try {
        const result = await this.processAndCreateOrder(row, userId, dto.destinations);
        if (result.success) {
          successfulOrders.push(result.order);
        } else {
          skippedRows.push({ row, reason: result.reason });
        }
      } catch (err: any) {
        console.error('Row processing error:', err);
        skippedRows.push({
          row,
          reason: err.message || 'Unknown error occurred',
        });
      }
    }

    return {
      total_uploaded: rowsToProcess.length,
      success: successfulOrders.length,
      skipped: skippedRows.length,
      skippedDetails: skippedRows,
      message: `Bulk orders processed: ${successfulOrders.length} successful, ${skippedRows.length} skipped`,
    };
  }

  // bulk order mark as pending
  async markOrdersAsPending(userId: number, dto: UpdatePendingOrdersDto) {
    const { orderIds } = dto;

    if (!orderIds?.length) {
      throw new BadRequestException('Order IDs are required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fcmToken: true,
        currentWalletBalance: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    /* ---------------- VALIDATE ORDERS ---------------- */
    const orders = await this.prisma.order.findMany({
      where: {
        id: { in: orderIds },
        userId,
        isBulk: true,
        order_status: OrderStatus.PROGRESS,
      },
      include: {
        orderStops: {
          include: { payment: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (orders.length !== orderIds.length) {
      const foundIds = orders.map(o => o.id);
      const missing = orderIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(`Orders not found: ${missing.join(', ')}`);
    }

    const totalAmount = orders.reduce((sum, o) => sum + Number(o.total_cost), 0);

    /* ---------------- TRANSACTION ---------------- */
    const result = await this.prisma.$transaction(async (tx) => {
      const payType = dto.paymentMethod || PayType.COD;
      const codCollectFrom = dto.codCollectFrom || 'RECEIVER';

      /* ---------------- UPFRONT PAYMENT (WALLET/ONLINE) ---------------- */
      if (dto.payType === PaymentType.PAYMENT) {
        if (dto.paymentMethod === PayType.ONLINE_PAY) {
          if (!dto.stripePaymentMethodId) {
            throw new BadRequestException('Stripe payment method required');
          }

          const paid = await this.walletService.addMoney(
            userId,
            totalAmount,
            dto.stripePaymentMethodId,
            dto.payType,
          );

          if (!paid) throw new BadRequestException('Online payment failed');
        }

        if (dto.paymentMethod === PayType.WALLET) {
          if (Number(user.currentWalletBalance) < totalAmount) {
            throw new BadRequestException('Insufficient wallet balance');
          }

          await tx.user.update({
            where: { id: userId },
            data: { currentWalletBalance: { decrement: totalAmount } },
          });
        }

        // Mark all stops as PAID for WALLET/ONLINE
        const allStopIds = orders.flatMap(o => o.orderStops.map(s => s.id));
        await tx.stopPayment.updateMany({
          where: { orderStopId: { in: allStopIds } },
          data: {
            payType: dto.paymentMethod,
            status: PaymentStatus.PAID,
            amount: 0,
          },
        });
      }

      /* ---------------- COD PAYMENT SETUP ---------------- */
      if (payType === PayType.COD) {
        for (const order of orders) {
          const pickupStop = order.orderStops.find(s => s.type === StopType.PICKUP);
          const dropStops = order.orderStops.filter(s => s.type === StopType.DROP);

          if (codCollectFrom === 'SENDER') {
            // Sender pays at pickup
            if (pickupStop) {
              await tx.stopPayment.update({
                where: { orderStopId: pickupStop.id },
                data: {
                  amount: Number(order.total_cost),
                  payType: PayType.COD,
                  status: PaymentStatus.UNPAID,
                },
              });
            }

            // Receivers pay nothing
            for (const drop of dropStops) {
              await tx.stopPayment.update({
                where: { orderStopId: drop.id },
                data: { amount: 0, status: PaymentStatus.PAID },
              });
            }
          } else {
            // Each receiver pays
            const perDropAmount = Number(order.total_cost) / dropStops.length;

            // Sender pays nothing
            if (pickupStop) {
              await tx.stopPayment.update({
                where: { orderStopId: pickupStop.id },
                data: { amount: 0, status: PaymentStatus.PAID },
              });
            }

            // Each receiver pays their share
            for (const drop of dropStops) {
              await tx.stopPayment.update({
                where: { orderStopId: drop.id },
                data: {
                  amount: perDropAmount,
                  payType: PayType.COD,
                  status: PaymentStatus.UNPAID,
                },
              });
            }
          }
        }
      }

      /* ---------------- UPDATE ORDERS ---------------- */
      const updateResult = await tx.order.updateMany({
        where: {
          id: { in: orderIds },
          userId,
          isBulk: true,
        },
        data: {
          order_status: OrderStatus.PENDING,
          is_placed: true,
          pay_type: payType,
        },
      });

      if (updateResult.count !== orderIds.length) {
        throw new ConflictException('Some orders could not be updated');
      }

      /* ---------------- UPDATE TRANSACTIONS ---------------- */
      await tx.transaction.updateMany({
        where: { orderId: { in: orderIds } },
        data: {
          tx_status: TransactionStatus.COMPLETED,
          payment_status:
            payType === PayType.COD ? PaymentStatus.UNPAID : PaymentStatus.PAID,
        },
      });

      return {
        totalUpdated: updateResult.count,
        totalAmount,
      };
    });

    /* ---------------- NOTIFICATIONS ---------------- */
    if (user.email && result.totalUpdated > 0) {
      await this.emailQueueService.queueBulkOrderPendingEmail({
        userId: user.id,
        email: user.email,
        username: user.username ?? undefined,
        orderIds,
        totalOrders: result.totalUpdated,
        totalAmount: result.totalAmount,
      });
    }

    if (user.fcmToken) {
      await this.emailQueueService.queueOrderStatusNotification({
        userId: user.id,
        fcmToken: user.fcmToken,
        orderId: 'BULK',
        status: OrderStatus.PENDING,
        title: 'Bulk Orders Now Pending',
        message: `Your ${result.totalUpdated} bulk orders are now placed.`,
      });
    }

    return {
      success: true,
      totalOrders: result.totalUpdated,
      totalAmount: result.totalAmount,
    };
  }


  // find user orders
  async findMine(
    userId: number,
    page: number = 1,
    limit: number = 20,
    status?: OrderStatus,
  ) {
    const skip = (page - 1) * limit;

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: {
          userId,
          ...(status && { order_status: status }), // filter if status provided
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          serviceZoneId: true,
          userId: true,
          route_type: true,
          delivery_type: true,
          pay_type: true,
          collect_time: true,
          scheduled_time: true,
          vehicle_type_id: true,
          total_cost: true,
          total_fee: true,
          total_distance: true,
          commission: true,
          refund_amount: true,
          has_additional_services: true,
          notify_favorite_raider: true,
          payment_method_id: true,
          assign_rider_id: true,
          raider_confirmation: true,
          is_auto_confirmation: true,
          is_reviewed: true,

          // only for counting
          orderStops: {
            include: {
              destination: true,
            }
          },
        },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    // const data = orders.map(({ orderStops, ...order }) => ({
    //   ...order,
    //   total_stops: orderStops.length,
    // }));

    return {
      data: orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }


  // find raider order
  async findRaiderMine(
    userId: number,
    page: number = 1,
    limit: number = 20,
    status?: OrderStatus,
  ) {
    const skip = (page - 1) * limit;
    const raider = await this.prisma.raider.findFirst({
      where: { userId: userId }
    })
    // console.log(raider);
    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: {
          assign_rider_id: raider?.id,
          ...(status && { order_status: status }), // filter if status provided
        },
        orderBy: { created_at: 'desc' },
        include: {
          user: true, transactions: true, orderStops: {
            include: {
              destination: true,
            }
          }
        },
        skip,
        take: limit,
      }),
      this.prisma.order.count({
        where: {
          assign_rider_id: raider?.id,
          ...(status && { order_status: status }),
        },
      }),
    ]);


    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // admin only
  async findUserOrder(
    userId: number,
    // page: number = 1,
    // limit: number = 20,
    filterDto: OrderFilterDto
  ) {

    const page = filterDto.page ?? 1;
    const limit = filterDto.limit ?? 10;


    const skip = (page - 1) * limit;

    const where = {
      order_status: filterDto.status,
      userId
    }

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: { user: true },
        skip,
        take: limit,
      }),

      this.prisma.order.count({
        where
      }),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }


  // ** for system use user(admin only)

  async findAll(filters: OrderFilterDto) {
  const {
    page = 1,
    limit = 20,
    startDate,
    endDate,
    status,
    category,
    search,
  } = filters;

  const skip = (page - 1) * limit;

  const where: any = {};

  // Search by order ID
  if (search) {
    const orderId = parseInt(search.replace(/\D/g, ''), 10);
    if (!isNaN(orderId)) {
      where.id = orderId;
    }
  }

  // Filter by status if provided
  if (status) {
    where.order_status = status;
  } else {
    // Exclude PROGRESS orders if no specific status is provided
    where.order_status = { not: OrderStatus.PROGRESS };
  }

  // Filter by category
  if (category) {
    where.delivery_type = category;
  }

  // Filter by date range
  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) where.created_at.gte = new Date(startDate);
    if (endDate) where.created_at.lte = new Date(endDate);
  }

  const [orders, total] = await this.prisma.$transaction([
    this.prisma.order.findMany({
      where,
      select: {
        id: true,
        userId: true,
        route_type: true,
        delivery_type: true,
        pay_type: true,
        vehicle_type_id: true,
        total_cost: true,
        collect_time: true,
        scheduled_time: true,
        has_additional_services: true,
        notify_favorite_raider: true,
        payment_method_id: true,
        assign_rider_id: true,
        raider_confirmation: true,
        is_reviewed: true,
        is_placed: true,
        is_pickup: true,
        isBulk: true,
        order_status: true,
        is_out_for_delivery: true,
        created_at: true,
        user: {
          select: {
            id: true,
            username: true,
            phone: true,
          },
        },
        orderStops: true,
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    this.prisma.order.count({ where }),
  ]);

  return {
    data: orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

  async findAllLiveTrack(filters: OrderFilterDto, userId:number) {
  const {
    page = 1,
    limit = 20,
    startDate,
    endDate,
    status,
    category,
    search,
  } = filters;

  const skip = (page - 1) * limit;

  const where: any = {userId};

  // Search by order ID
  if (search) {
    const orderId = parseInt(search.replace(/\D/g, ''), 10);
    if (!isNaN(orderId)) {
      where.id = orderId;
    }
  }

  // Filter by status if provided
  if (status) {
    where.order_status = status;
  } else {
    // Exclude PROGRESS orders if no specific status is provided
    where.order_status = { not: OrderStatus.PROGRESS };
    where.order_status = OrderStatus.PENDING || OrderStatus.ONGOING;
  }

  // Filter by category
  if (category) {
    where.delivery_type = category;
  }

  // Filter by date range
  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) where.created_at.gte = new Date(startDate);
    if (endDate) where.created_at.lte = new Date(endDate);
  }

  const [orders, total] = await this.prisma.$transaction([
    this.prisma.order.findMany({
      where,
      select: {
        id: true,
        userId: true,
        route_type: true,
        delivery_type: true,
        pay_type: true,
        vehicle_type_id: true,
        total_cost: true,
        collect_time: true,
        scheduled_time: true,
        has_additional_services: true,
        notify_favorite_raider: true,
        payment_method_id: true,
        assign_rider_id: true,
        raider_confirmation: true,
        is_reviewed: true,
        is_placed: true,
        is_pickup: true,
        isBulk: true,
        order_status: true,
        is_out_for_delivery: true,
        created_at: true,
        user: {
          select: {
            id: true,
            username: true,
            phone: true,
          },
        },
        orderStops: true,
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    this.prisma.order.count({ where }),
  ]);

  return {
    data: orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

  // ** bulk order system
  async findAllBulk(dto: PaginationDto, user: IUser) {
    const {
      page = 1,
      limit = 20,
    } = dto;


    const skip = (page - 1) * limit;

    const [orders, totalOrderIds, total, totalOrderCost] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: {
          userId: user.id,
          isBulk: true,
          order_status: OrderStatus.PROGRESS
        },
        select: {
          id: true,
          userId: true,
          route_type: true,
          delivery_type: true,
          pay_type: true,
          vehicle_type_id: true,
          total_cost: true,
          collect_time: true,
          scheduled_time: true,
          has_additional_services: true,
          notify_favorite_raider: true,
          payment_method_id: true,
          assign_rider_id: true,
          raider_confirmation: true,
          is_reviewed: true,
          is_placed: true,
          is_pickup: true,
          isBulk: true,
          order_status: true,
          is_out_for_delivery: true,
          created_at: true,

          // If you want some relations, add them:
          user: {
            select: {
              id: true,
              username: true,
              phone: true,
            },
          },
          // destinations:true
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      //  
      this.prisma.order.findMany({
        where: {
          userId: user.id,
          isBulk: true,
          order_status: OrderStatus.PROGRESS
        },
        select: {
          id: true,
          userId: true
        },
        orderBy: { created_at: 'desc' },
      }),

      // 
      this.prisma.order.count({
        where: {
          userId: user.id,
          isBulk: true,
          order_status: OrderStatus.PROGRESS
        }
      }),

      // total cost
      this.prisma.order.aggregate({
        where: {
          userId: user.id,
          isBulk: true,
          order_status: OrderStatus.PROGRESS,
        },
        _sum: {
          total_cost: true,
        },
      })

    ]);
    // 

    return {
      data: orders,
      total,
      totalCost: totalOrderCost,
      totalOrderIds,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 
  async getOrderDetails(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        vehicle: true,
        orderStops: {
          include: {
            destination: true,
            payment: true,
          },
          orderBy: { sequence: 'asc' },
        },
        assign_rider: {
          include: {
            registrations: {
              select: {
                id: true,
                raider_name: true,
                contact_number: true,
                email_address: true,
                current_state_province: true,
                current_city: true,
                current_zip_post_code: true,
                current_country: true,
                current_address: true,
              }
            },
            locations: true
          }
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    const pickupStop = order.orderStops.find((s) => s.type === StopType.PICKUP);
    const dropStops = order.orderStops.filter((s) => s.type === StopType.DROP);

    // ✅ ADD: Calculate pricing breakdown for display
    if (order.is_placed && pickupStop && dropStops.length > 0) {
      const zone = await this.serviceZone.findZoneByPoint(
        pickupStop.latitude,
        pickupStop.longitude,
      );

      if (zone) {
        const sender = { lat: pickupStop.latitude, lng: pickupStop.longitude };
        const receivers = dropStops.map((s) => ({
          lat: s.latitude,
          lng: s.longitude,
        }));

        const pricingResults = await getReceiversWithIndividualPrice(
          this.prisma,
          sender,
          receivers,
          order.delivery_type,
          order.vehicle_type_id ?? 1,
          zone,
          { isRoundTrip: order.route_type === RouteType.ROUND },
        );
        const totalDistance = pricingResults.reduce((total, result) => total + result.distanceKm, 0);
        // ✅ ADD: Enrich stops with pricing details
        const enrichedStops = order.orderStops.map((stop) => {
          if (stop.type === StopType.PICKUP) return stop;

          const dropIndex = dropStops.findIndex((d) => d.id === stop.id);
          const pricing = pricingResults[dropIndex];

          return {
            ...stop,
            pricingBreakdown: pricing
              ? {
                distance: pricing.distanceKm,
                basePrice: pricing.pricing.basePrice,
                deliveryTypeCharge: pricing.pricing.deliveryTypeCharge,
                userFeeTotal: pricing.pricing.userFeeTotal,
                zoneFee: pricing.pricing.zoneFee,
                surgeAmount: pricing.pricing.surgeAmount,
                totalFee: pricing.pricing.totalFee,
                totalPrice: pricing.pricing.totalPrice,
              }
              : null,
          };
        });

        return {
          ...order,
          orderStops: enrichedStops,
          pricingSummary: {
            totalDistance,
            totalCost: Number(order.total_cost),
            totalFee: Number(order.total_fee),
            dropCount: dropStops.length,
            perDropBreakdown: pricingResults.map((r, idx) => ({
              stopId: dropStops[idx].id,
              address: dropStops[idx].address,
              sequence: dropStops[idx].sequence,
              distance: r.distanceKm,
              price: r.pricing.totalPrice,
            })),
          },
        };
      }
    }

    return order;
  }

  // 
  async updateOrderStatus(
    orderId: number,
    userId: number,
    dto: UpdateOrderStatusDto,
    raider: IUser,
  ) {
    const { status } = dto;

    // 1. Fetch order
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        order_status: OrderStatus.PROGRESS,
      },
      select: {
        id: true,
        userId: true,
        order_status: true,
        total_cost: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found or not in progress');
    }

    if (order.order_status === status) {
      throw new ConflictException(`Order already ${status}`);
    }

    // 2. Transaction
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      /** ---------------- PAYMENT ---------------- */
      if (status === OrderStatus.PENDING && dto.payType === PaymentType.PAYMENT) {
        // ONLINE PAYMENT
        if (dto.paymentMethod === PayType.ONLINE_PAY) {
          if (!dto.paymentMethodId) {
            throw new BadRequestException('Stripe payment method required');
          }

          const paid = await this.walletService.addMoney(
            userId,
            Number(order.total_cost),
            dto.paymentMethodId,
            dto.payType,
          );

          if (!paid) {
            throw new BadRequestException('Online payment failed');
          }
        }

        // WALLET PAYMENT
        if (dto.paymentMethod === PayType.WALLET) {
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { currentWalletBalance: true },
          });

          if (!user || Number(user.currentWalletBalance) < Number(order.total_cost)) {
            throw new BadRequestException('Insufficient wallet balance');
          }

          await tx.user.update({
            where: { id: userId },
            data: {
              currentWalletBalance: {
                decrement: Number(order.total_cost),
              },
            },
          });
        }
      }

      /** ---------------- ORDER UPDATE ---------------- */
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          order_status: status,
          is_placed: status === OrderStatus.PENDING,
          pay_type: dto.paymentMethod,
        },
      });

      /** ---------------- TRANSACTION UPDATE ---------------- */
      const transaction = await tx.transaction.findFirst({
        where: { orderId },
      });

      if (transaction) {
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            tx_status:
              status === OrderStatus.PENDING
                ? TransactionStatus.PENDING
                : status === OrderStatus.CANCELLED
                  ? TransactionStatus.FAILED
                  : status === OrderStatus.COMPLETED
                    ? TransactionStatus.COMPLETED
                    : transaction.tx_status,
          },
        });
      }

      /** ---------------- RAIDER UPDATE ---------------- */
      if (status === OrderStatus.COMPLETED) {
        await tx.raider.update({
          where: { userId: raider.id },
          data: {
            completed_orders: { increment: 1 },
          },
        });
      }

      return updatedOrder;
    });

    // 4. QUEUE NOTIFICATIONS (AFTER TRANSACTION)

    // Get user info for notifications
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fcmToken: true,
      }
    });

    if (user) {
      // Prepare status message
      const statusMessages = {
        [OrderStatus.PENDING]: 'Your order is being processed and will be assigned to a rider soon.',
        [OrderStatus.ONGOING]: 'Your order is on the way! The rider is heading to your location.',
        [OrderStatus.COMPLETED]: 'Your order has been successfully completed. Thank you for your business!',
        [OrderStatus.CANCELLED]: 'Your order has been cancelled. If you have any questions, please contact support.',
      };

      const statusMessage = statusMessages[status] || `Your order status has been updated to ${status}.`;

      // Queue email notification
      if (user.email) {
        await this.emailQueueService.queueOrderPendingEmail({
          userId: user.id,
          email: user.email,
          username: user.username ?? undefined,
          orderId: updatedOrder.id,
          status: updatedOrder.order_status,
          amount: Number(updatedOrder.total_cost),
          statusMessage,
        });
      }

      // Queue push notification
      if (user.fcmToken) {
        await this.emailQueueService.queueOrderStatusNotification({
          userId: user.id,
          fcmToken: user.fcmToken,
          orderId: updatedOrder.id,
          status: updatedOrder.order_status,
          title: `Order ${updatedOrder.order_status}`,
          message: statusMessage,
        });
      }
    }

    return updatedOrder;
  }

  // order update for admin
  async update(id: number, dto: UpdateOrderDto) {
    const existingOrder = await this.prisma.order.findUnique({
      where: { id }
    })
    if (!existingOrder) {
      throw new NotFoundException("Order not found")
    }
    return this.prisma.order.update({
      where: { id },
      data: dto,
    });
  }


  // its permanently deleted by admin
  async remove(id: number) {
    const existingOrder = await this.prisma.order.findUnique({
      where: { id }
    })
    if (!existingOrder) {
      throw new NotFoundException("Order not found")
    }
    return await this.prisma.order.delete({
      where: { id },
    });
  }


  // order assign by admin
  async assignDriver(id: number, riderId: number) {
    //  
    const raider = await this.prisma.raider.findFirst({
      where: {
        id: riderId,
        raider_verificationFromAdmin: RaiderVerification.APPROVED,
        isSuspended: false,
        raider_status: RaiderStatus.ACTIVE
      }
    })

    // 
    if (!raider) {
      throw new NotFoundException("Rider is not verified")
    }

    // 1. Check order exists
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // 2. Check if order already has assigned rider
    if (order.assign_rider_id) {
      throw new ConflictException('This order already has an assigned rider');
    }

    // 3. OPTIONAL: Check if this rider is already assigned to another active order
    const riderAlreadyAssigned = await this.prisma.order.findFirst({
      where: {
        assign_rider_id: riderId,
        order_status: {
          in: ['PENDING', 'ONGOING'],
        },
      },
    });

    if (riderAlreadyAssigned) {
      throw new ConflictException('This rider is already assigned to another active order');
    }

    //  Save rider to order
    return this.prisma.order.update({
      where: { id },
      data: {
        assign_rider_id: riderId,
        order_status: OrderStatus.ONGOING,
        competition_closed: true,
      },
    });
  }



  //  stats dashboard
  async getOrderStats() {
    const [totalOrders, ongoing, scheduled, pending] = await this.prisma.$transaction([
      // Total Orders
      this.prisma.order.count(),

      // Ongoing Orders (progressing states)
      this.prisma.order.count({
        where: {
          order_status: {
            in: [OrderStatus.ONGOING],
          },
        },
      }),

      // Scheduled Orders
      this.prisma.order.count({
        where: { collect_time: CollectTime.SCHEDULED },
      }),

      // Pending Orders
      this.prisma.order.count({
        where: { order_status: OrderStatus.PENDING },
      }),
    ]);

    return {
      totalOrders,
      ongoing,
      scheduled,
      pending,
    };
  }

  // feed only order
  async orderForFeed(userId: number, page = 1, limit = 100) {
    const skip = (page - 1) * limit;

    const raider = await this.prisma.raider.findFirst({
      where: { userId, is_online: true, isSuspended: false, raider_status: RaiderStatus.ACTIVE },
      select: { id: true },
    });
    // 
    if (!raider) {
      throw new ForbiddenException('Raider is offline or inactive');
    }

    const declineFilter = raider
      ? {
        NOT: {
          declines: {
            some: {
              raiderId: raider.id,
            },
          },
        },
      }
      : {};

    const whereClause = {
      order_status: OrderStatus.PENDING,
      is_placed: true,
      ...declineFilter,
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        include: {
          user: true,
          vehicle: true,
          orderStops: true,
        },
        skip,
        take: limit,
      }),

      this.prisma.order.count({
        where: whereClause,
      }),
    ]);

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }



  //order decline
  async declineOrder(orderId: number, raiderId: number) {

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: raiderId },
      include: {
        raiderProfile: true
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.prisma.orderDecline.create({
      data: {
        orderId,
        raiderId: user.raiderProfile?.id!
      },
    });
  }


  // **HOT CAKE: recalculate order price with individual drop pricing
  private async recalculateOrderPrice(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderStops: {
          include: { payment: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!order) return;

    const pickupStop = order.orderStops.find((s) => s.type === StopType.PICKUP);
    const dropStops = order.orderStops.filter((s) => s.type === StopType.DROP);

    if (!pickupStop || dropStops.length === 0) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { total_cost: 0, total_fee: 0 },
      });
      return { totalCost: 0, totalFee: 0 };
    }

    const zone = await this.serviceZone.findZoneByPoint(
      pickupStop.latitude,
      pickupStop.longitude,
    );

    if (!zone) {
      throw new BadRequestException('Pickup address outside service zone');
    }

    //Use individual pricing
    const sender = { lat: pickupStop.latitude, lng: pickupStop.longitude };
    const receivers = dropStops.map((s) => ({
      lat: s.latitude,
      lng: s.longitude,
    }));

    const pricingResults = await getReceiversWithIndividualPrice(
      this.prisma,
      sender,
      receivers,
      order.delivery_type,
      order.vehicle_type_id ?? 1,
      zone,
      { isRoundTrip: order.route_type === RouteType.ROUND },
    );

    // Sum individual prices
    const totalCost = pricingResults.reduce(
      (sum, r) => sum + r.pricing.totalPrice,
      0,
    );
    const totalFee = pricingResults.reduce(
      (sum, r) => sum + r.pricing.totalFee,
      0,
    );

    // Update order totals
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        total_cost: parseFloat(totalCost.toFixed(2)),
        total_fee: parseFloat(totalFee.toFixed(2)),
        serviceZoneId: zone.id,
      },
    });

    // Update individual stop payment amounts
    await this.prisma.$transaction(
      dropStops.map((drop, index) => {
        const pricing = pricingResults[index];
        return this.prisma.stopPayment.update({
          where: { orderStopId: drop.id },
          data: {
            amount: parseFloat(pricing.pricing.totalPrice.toFixed(2)),
          },
        });
      }),
    );

    return {
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalFee: parseFloat(totalFee.toFixed(2)),
    };
  }



  //Promo code applay discount
  async applyDiscount(
    orderId: number,
    userId: number,
    dto: ApplyDiscountDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, userId },
      include: {
        orderStops: {
          include: {
            payment: true
          }
        },
      }
    });

    if (!order) throw new NotFoundException('Order not found');

    if (order.order_status !== OrderStatus.PROGRESS) {
      throw new BadRequestException('Cannot apply discount to placed order');
    }


    let totalDiscount = 0;
    let coinsUsed = 0;
    let promoDiscount = 0;

    await this.prisma.$transaction(async (tx) => {
      // 1. Apply Coins (e.g., 100 coins = ৳10)
      if (dto.useCoins && dto.coinsAmount) {
        const userWallet = await tx.user.findUnique({
          where: { id: userId },
        });
        // calculate total coin
        const coinBalance = Number(userWallet?.current_coin_balance) + Number(userWallet?.reward_points);
        // 
        if (!userWallet || coinBalance < dto.coinsAmount) {
          throw new BadRequestException('Insufficient coins');
        }

        // Convert coins to money (e.g., 1 coins = ৳1)
        const result = await tx.coin.aggregate({
          _avg: {
            coin_value_in_cent: true,
          },
        });

        const avgPrice = Number(result._avg.coin_value_in_cent ?? 0);
        const coinValue = dto.coinsAmount * avgPrice;


        if (Number(order.total_cost) < coinValue) {
          throw new BadRequestException('Coins amount is greater than order total cost');
        }

        // Deduct coins
        await tx.user.update({
          where: { id: userId },
          data: { current_coin_balance: { decrement: dto.coinsAmount } },
        });

        totalDiscount += coinValue;
        coinsUsed = dto.coinsAmount;
      }

      // 2. Apply Promo Code
      if (dto.promoCode) {
        const promo = await tx.promoCode.findUnique({
          where: { promoCode: dto.promoCode, isActive: true },
        });

        if (!promo) {
          throw new BadRequestException('Invalid promo code');
        }

        // Check expiry
        if (promo.expires_at && promo.expires_at < new Date()) {
          throw new BadRequestException('Promo code expired');
        }

        // Calculate discount
        if (promo.discountType === 'PERCENTAGE') {
          promoDiscount = (Number(order.total_cost) * promo.discountValue) / 100;

          // Apply max cap if exists
          // if (promo.maxDiscount && promoDiscount > promo.maxDiscount) {
          //   promoDiscount = promo.maxDiscount;
          // }
        } else {
          // Fixed amount
          promoDiscount = promo.discountValue;
        }

        totalDiscount += promoDiscount;

        // Mark promo as used
        await tx.promaCodeUses.create({
          data: {
            promoCodeId: promo.id,
            userId,
            orderId,
            discountAmount: promoDiscount,
            discounttype: promo.discountType,
          },
        });
      }

      // ✅ 3. Update Order
      const finalCost = Math.max(
        Number(order.total_cost) - totalDiscount,
        0, // Never go below 0
      );

      await tx.order.update({
        where: { id: orderId },
        data: {
          originalCost: order.total_cost,
          discountAmount: totalDiscount,
          coinsRedeemed: coinsUsed,
          promoCode: dto.promoCode || null,
          promoDiscount,
          total_cost: finalCost,
        },
      });
      //Problem: discount need to split if order is COD and multiple drop // solved
      // if order is cod
      if (order.pay_type === PayType.COD) {
        //find sender and reciever
        const senders = order.orderStops.filter(
          s => s.type === 'PICKUP' && s.payment?.status === 'UNPAID'
        );

        const receivers = order.orderStops.filter(
          r => r.type === 'DROP' && r.payment?.status === 'UNPAID'
        );
        // find payers
        const payers = senders.length > 0 ? senders : receivers;
        if (payers.length === 0) return;

        const total = Number(totalDiscount);
        const baseSplit = Math.floor((total / payers.length) * 100) / 100;
        let remainder = +(total - baseSplit * payers.length).toFixed(2);

        for (const stop of payers) {
          const discount =
            remainder > 0 ? +(baseSplit + 0.01).toFixed(2) : baseSplit;

          remainder = +(remainder - 0.01).toFixed(2);

          await tx.stopPayment.update({
            where: { id: stop.payment?.id },
            data: {
              discount,
              amount: {
                decrement: discount
              }
            },
          });
        }
      }

    });

    return this.getOrderDetails(orderId);
  }

  // Remove discount
  async removeDiscount(orderId: number, userId: number, type: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, userId },
      include: {
        orderStops: {
          include: {
            payment: true,
          }
        }
      }
    });

    if (!order) throw new NotFoundException('Order not found');

    await this.prisma.$transaction(async (tx) => {
      // Refund coins
      if (order.coinsRedeemed > 0 && type === 'coin') {
        await tx.user.update({
          where: { id: userId },
          data: { current_coin_balance: { increment: order.coinsRedeemed } },
        });
      }

      // Remove promo usage
      if (order.promoCode && type === 'promo') {
        await tx.promaCodeUses.deleteMany({
          where: { orderId },
        });
      }


      const discountAmount = type === 'coin' ? Number(order.discountAmount) - Number(order.coinsRedeemed) : Number(order.discountAmount) - Number(order.promoDiscount);
      const coinsRedeemed = type === 'coin' ? Number(order.coinsRedeemed) - Number(order.coinsRedeemed) : Number(order.coinsRedeemed);
      const promoDiscount = type === 'promo' ? Number(order.promoDiscount) - Number(order.promoDiscount) : Number(order.promoDiscount);

      // Restore original price
      await tx.order.update({
        where: { id: orderId },
        data: {
          total_cost: order.originalCost,
          discountAmount: discountAmount,
          coinsRedeemed: coinsRedeemed,
          promoCode: type === 'promo' && order.promoCode ? null : order.promoCode,
          promoDiscount: promoDiscount,
        },
      });

      //  remove discount from order stop
      if (order.pay_type === PayType.COD) {
        //  Find unpaid PICKUP (sender) and DROP (receiver)
        const senders = order.orderStops.filter(
          s => s.type === 'PICKUP' && s.payment?.status === 'UNPAID'
        );

        const receivers = order.orderStops.filter(
          r => r.type === 'DROP' && r.payment?.status === 'UNPAID'
        );

        // Decide who gets discount removed
        const backPayers = senders.length > 0 ? senders : receivers;
        if (backPayers.length === 0) return;

        //  Re-split discount (same logic used when applying)
        const total = Number(order.discountAmount);
        const count = backPayers.length;

        const base = Math.floor((total / count) * 100) / 100;
        let remainder = +(total - base * count).toFixed(2);

        // Reverse discount (add back)
        for (const stop of backPayers) {
          const restore =
            remainder > 0 ? +(base + 0.01).toFixed(2) : base;

          remainder = +(remainder - 0.01).toFixed(2);

          await tx.stopPayment.update({
            where: { id: stop.payment?.id },
            data: {
              discount: {
                decrement: restore, // discount removed
              },
              amount: {
                increment: restore, // money added back
              },
            },
          });
        }
      }


    });

    return this.getOrderDetails(orderId);
  }
  // add additional price
  async additionalService(orderId: number, userId: number, serviceId: number) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId, userId },
      });

      if (!order) throw new NotFoundException('Order not found');
      if (order.order_status !== OrderStatus.PROGRESS) {
        throw new BadRequestException('Cannot add services to this order');
      }

      const service = await tx.additionalServices.findUnique({
        where: { id: serviceId, isActive: true },
      });

      if (!service) {
        throw new NotFoundException('Additional service not found');
      }

      const existingServices: any[] = Array.isArray(order.additional_services)
        ? order.additional_services
        : [];

      // ❗ Prevent duplicate service
      const alreadyAdded = existingServices.some(
        s => s.id === service.id,
      );
      if (alreadyAdded) {
        throw new BadRequestException('Service already added to this order');
      }

      const serviceValue = Number(service.value);
      const prevAdditional = Number(order.additional_cost ?? 0);
      //  addition fix
      const originalCost =
        Number(order.originalCost) !== 0
          ? Number(order.originalCost)
          : Number(order.total_cost);
      // console.log(originalCost, prevAdditional, serviceValue);
      const updatedOrder = await tx.order.update({
        where: { id: orderId, userId },
        data: {
          originalCost,
          additional_cost: prevAdditional + serviceValue,
          total_cost: originalCost + prevAdditional + serviceValue,
          has_additional_services: true,

          // JSON append
          additional_services: [
            ...existingServices,
            {
              id: service.id,
              name: service.service_name,
              desc: service.desc,
              price: serviceValue,
            },
          ],
        },
      });
      return updatedOrder;
    });
  }




  // remove additional services
  async removeAdditionalService(orderId: number, userId: number, serviceId: number) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId, userId },
      });

      if (!order) throw new NotFoundException('Order not found');
      if (order.order_status !== OrderStatus.PROGRESS) {
        throw new BadRequestException('Cannot remove services from this order');
      }

      const existingServices: any[] = Array.isArray(order.additional_services)
        ? order.additional_services
        : [];

      // ❗ Check if service exists in JSON
      const serviceExists = existingServices.some(
        s => s.id === serviceId,
      );

      if (!serviceExists) {
        throw new BadRequestException('Service not applied to this order');
      }

      //  Remove service from JSON
      const filteredServices = existingServices.filter(
        s => s.id !== serviceId,
      );

      // Recalculate additional cost from JSON
      const newAdditional = filteredServices.reduce(
        (sum: number, s) => sum + Number(s.price),
        0,
      );

      const baseCost =
        Number(order.originalCost) !== 0
          ? Number(order.originalCost)
          : Number(order.total_cost);

      // Update order
      const updatedOrder = await tx.order.update({
        where: { id: orderId, userId },
        data: {
          additional_services: filteredServices,
          additional_cost: newAdditional,
          total_cost: baseCost + newAdditional,
          has_additional_services: filteredServices.length > 0,
        },
      });

      return updatedOrder;
    });
  }




  // **HOT CAKE: process and create bulk order
  private async processAndCreateOrder(
    row: any,
    userId: number,
    defaultDestinations?: CreateDestinationDto[],
  ) {
    try {
      // Get defaults
      const defaultSender = defaultDestinations?.find(d => d.type === DestinationType.SENDER);
      const defaultReceiver = defaultDestinations?.find(d => d.type === DestinationType.RECEIVER);

      /* -------------------- Validate required fields -------------------- */
      if (!row.delivery_type) {
        return { success: false, reason: 'Missing delivery_type' };
      }

      // Get addresses from CSV OR defaults
      const senderAddress = row.sender_address?.trim() || defaultSender?.address;
      const receiverAddress = row.receiver_address?.trim() || defaultReceiver?.address;

      if (!senderAddress || !receiverAddress) {
        return {
          success: false,
          reason: 'Missing sender or receiver address in both CSV and defaults',
        };
      }

      /* -------------------- Validate delivery type -------------------- */
      const deliveryTypeEnum = row.delivery_type as DeliveryTypeName;
      const deliveryTypeExists = await this.prisma.deliveryType.findFirst({
        where: { name: deliveryTypeEnum, is_active: true },
      });

      if (!deliveryTypeExists) {
        return {
          success: false,
          reason: `Invalid delivery_type: ${row.delivery_type}`,
        };
      }

      /* -------------------- Validate vehicle type -------------------- */
      const vehicle = await this.prisma.vehicleType.findFirst({
        where: { vehicle_type: row.vehicle_type },
      });

      if (!vehicle) {
        return {
          success: false,
          reason: `Invalid vehicle_type: ${row.vehicle_type}`,
        };
      }

      /* -------------------- Geocode sender -------------------- */
      let senderGeo;
      try {
        senderGeo = await this.geoServices.getLatLngFromAddress(senderAddress);
      } catch (error) {
        return {
          success: false,
          reason: `Geocoding failed for sender: ${error.message}`,
        };
      }

      if (!senderGeo?.lat || !senderGeo?.lng) {
        return {
          success: false,
          reason: `Cannot geocode sender address: ${senderAddress}`,
        };
      }

      const sender: Receiver = {
        lat: senderGeo.lat,
        lng: senderGeo.lng,
      };

      /* -------------------- Service zone check -------------------- */
      const zone = await this.serviceZone.findZoneByPoint(sender.lat, sender.lng);
      if (!zone) {
        return { success: false, reason: 'Sender outside service zone' };
      }

      /* -------------------- Geocode receiver -------------------- */
      let receiverGeo;
      try {
        receiverGeo = await this.geoServices.getLatLngFromAddress(receiverAddress);
      } catch (error) {
        return {
          success: false,
          reason: `Geocoding failed for receiver: ${error.message}`,
        };
      }

      if (!receiverGeo?.lat || !receiverGeo?.lng) {
        return {
          success: false,
          reason: `Cannot geocode receiver address: ${receiverAddress}`,
        };
      }

      const receivers: Receiver[] = [
        { lat: receiverGeo.lat, lng: receiverGeo.lng },
      ];

      /* -------------------- Calculate price -------------------- */
      const pricingResults = await getReceiversWithIndividualPrice(
        this.prisma,
        sender,
        receivers,
        deliveryTypeEnum,
        vehicle.id,
        zone,
        {
          isRoundTrip: row.route_type === RouteType.ROUND,
          returnFactor: 0.5,
        },
      );

      const totalCost = pricingResults[0]?.pricing.totalPrice ?? 0;
      const totalFee = pricingResults[0]?.pricing.totalFee ?? 0;

      /* -------------------- Merge CSV data with defaults -------------------- */
      const senderData = {
        address: senderAddress,
        addressFromApr: senderGeo.formattedAddress || senderAddress,
        contact_name: row.sender_contact_name || defaultSender?.contact_name || null,
        contact_number: row.sender_contact_number || defaultSender?.contact_number || null,
        floor_unit: row.sender_floor_unit || defaultSender?.floor_unit || null,
        additionalInfo: row.sender_note_to_driver || defaultSender?.note_to_driver || null,
      };

      const receiverData = {
        address: receiverAddress,
        addressFromApr: receiverGeo.formattedAddress || receiverAddress,
        contact_name: row.receiver_contact_name || defaultReceiver?.contact_name || null,
        contact_number: row.receiver_contact_number || defaultReceiver?.contact_number || null,
        floor_unit: row.receiver_floor_unit || defaultReceiver?.floor_unit || null,
        additionalInfo: row.receiver_note_to_driver || defaultReceiver?.note_to_driver || null,
      };

      /* -------------------- Create order with destinations in transaction -------------------- */
      const order = await this.prisma.$transaction(async (tx) => {
        // 1. Create Order
        const newOrder = await tx.order.create({
          data: {
            userId,
            serviceZoneId: zone.id,
            route_type: row.route_type || RouteType.ONE_WAY,
            delivery_type: deliveryTypeEnum,
            collect_time: row.collect_time || 'ASAP',
            scheduled_time: row.scheduled_time || null,
            vehicle_type_id: vehicle.id,
            payment_method_id: row.payment_method_id ? Number(row.payment_method_id) : null,
            pay_type: row.pay_type || PayType.COD,
            total_cost: parseFloat(totalCost.toFixed(2)),
            total_fee: parseFloat(totalFee.toFixed(2)),
            order_status: row.order_status || OrderStatus.PROGRESS,
            isFixed: row.is_fixed === 'true' || row.is_fixed === true || false,
            isBulk: true,
            raider_confirmation: row.raider_confirmation === 'true' || row.raider_confirmation === true || false,
          },
        });

        // 2. Create Sender Destination
        const senderDestination = await tx.destination.create({
          data: {
            userId,
            latitude: sender.lat,
            longitude: sender.lng,
            type: DestinationType.SENDER,
            is_saved: false,
            lastUsedAt: new Date(),
            useCount: 1,
            ...senderData,
          },
        });

        // 3. Create Receiver Destination
        const receiverDestination = await tx.destination.create({
          data: {
            userId,
            latitude: receiverGeo.lat,
            longitude: receiverGeo.lng,
            type: DestinationType.RECEIVER,
            is_saved: false,
            lastUsedAt: new Date(),
            useCount: 1,
            ...receiverData,
          },
        });

        // 4. Create OrderStop for Pickup
        await tx.orderStop.create({
          data: {
            orderId: newOrder.id,
            destinationId: senderDestination.id,
            address: senderAddress,
            latitude: sender.lat,
            longitude: sender.lng,
            additionalInfo: senderData.additionalInfo,
            type: StopType.PICKUP,
            sequence: 1,
            status: 'PENDING',
            payment: {
              create: {
                payType: newOrder.pay_type || PayType.COD,
                amount: 0,
                status: PaymentStatus.PAID,
              },
            },
          },
        });

        // 5. Create OrderStop for Drop
        await tx.orderStop.create({
          data: {
            orderId: newOrder.id,
            destinationId: receiverDestination.id,
            address: receiverAddress,
            latitude: receiverGeo.lat,
            longitude: receiverGeo.lng,
            additionalInfo: receiverData.additionalInfo,
            type: StopType.DROP,
            sequence: 2,
            status: 'PENDING',
            payment: {
              create: {
                payType: newOrder.pay_type || PayType.COD,
                amount: parseFloat(totalCost.toFixed(2)),
                status: PaymentStatus.UNPAID,
              },
            },
          },
        });

        // 6. Create Transaction
        const txId = this.txIdService.generate();
        await tx.transaction.create({
          data: {
            transaction_code: txId,
            payment_status: PaymentStatus.UNPAID,
            payment_method_id: newOrder.payment_method_id,
            type: TransactionType.BOOK_ORDER,
            delivery_fee: newOrder.total_cost,
            total_fee: newOrder.total_fee,
            userId: newOrder.userId,
            pay_type: newOrder.pay_type,
            orderId: newOrder.id,
          },
        });

        return newOrder;
      });

      return {
        success: true,
        order: {
          orderId: order.id,
          senderAddress,
          receiverAddress,
          totalCost: order.total_cost,
          status: order.order_status,
        },
      };
    } catch (err: any) {
      console.error('Order creation error:', err);
      return {
        success: false,
        reason: err.message || 'Unknown error occurred',
      };
    }
  }

  // sent notification to followed rider **deprecated
  async followedRiderOrder(orderId: number) {
    // find order
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return;

    // find fav riders
    const favRaiders = await this.prisma.myRaider.findMany({
      where: {
        user_id: order.userId!,
        is_fav: true,

      }
    });
    if (!favRaiders) return;

    // find sender
    const sender = await this.prisma.user.findUnique({ where: { id: order.userId! } });
    if (!sender) return;

    // send notification to each rider
    favRaiders.map((rider) => rider.id).forEach(async (riderId) => {
      const rider = await this.prisma.user.findFirst({
        where: {
          id: riderId
        }
      });
      if (!rider) return;

      await this.emailQueueService.queuePushNotification({
        userId: rider.id,
        fcmToken: rider.fcmToken!,
        title: 'Incoming Order',
        body: `You have a new order from your follower ${sender.username} orderID: ${order.id}`,
      });
    })

  }

  // 
  async getActiveOrderByRider(riderId: number) {
    return await this.prisma.order.findFirst({
      where: { assign_rider_id: riderId, order_status: OrderStatus.ONGOING },
    });
  }

  async getAllActiveOrders() {
    return await this.prisma.order.findMany({
      where: { order_status: OrderStatus.ONGOING }, include: {
        vehicle: {
          select: {
            vehicle_type: true,
          }
        }
      }
    })

  }
  // 
  async getAllActiveOrdersByRider(riderId: number) {
    return await this.prisma.order.findMany({
      where: {
        assign_rider_id: riderId,
        order_status: OrderStatus.ONGOING
      },
    });
  }

  // **HOT CAKE: driver compitition algorithom (If you dont understand it then dont touch it)
  // START COMPETITION (First rider triggers this)
  async driverCompitition(user: UserRaiderMapping, orderId: number) {
    console.log(`🎯 Rider joining competition - User: ${user.id}, Order: ${orderId}`);

    const raider = await this.prisma.raider.findFirst({
      where: {
        id: user.raider.id,
        raider_verificationFromAdmin: RaiderVerification.APPROVED,
        isSuspended: false,
        raider_status: RaiderStatus.ACTIVE,
      },
      include: { user: true },
    });

    if (!raider) {
      throw new NotFoundException('Raider not found or not eligible');
    }

    const lockKey = `order:competition:${orderId}`;
    const lockAcquired = await this.redisService.acquireLock(lockKey, 3000);

    if (!lockAcquired) {
      throw new ConflictException('Competition is processing, please try again');
    }

    try {
      const config = await this.prisma.driver_order_competition.findFirst();
      if (!config) throw new NotFoundException('Competition config missing');

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { orderStops: true, vehicle: true, user: true },
      });

      if (!order) throw new NotFoundException('Order not found');

      // check is the order is not placed
      if (order.order_status !== OrderStatus.PENDING) {
        throw new NotFoundException("Order Is not ready for compitition")
      }

      // 
      if (order.competition_closed) {
        throw new BadRequestException('Competition already closed');
      }

      // Already joined
      if (order.compititor_id.includes(raider.id)) {
        console.log(`⚠️ Rider ${raider.id} already joined`);

        const timeRemaining = this.calculateTimeRemaining(
          order.competition_started_at,
          config.challenges_timeout
        );

        return {
          updated: order,
          score: 0,
          shouldAutoConfirm: false,
          requiresManualConfirmation: true,
          alreadyJoined: true,
          timeRemaining,
        };
      }

      // Check max participants
      if (order.compititor_id.length >= config.max_users_to_join) {
        throw new BadRequestException('Maximum competitors reached');
      }

      // Add rider to competition
      const updated = await this.prisma.order.update({
        where: { id: orderId },
        data: { compititor_id: { push: raider.id } },
        include: { orderStops: true, vehicle: true, user: true },
      });

      console.log(`✅ Rider ${raider.id} joined! Total: ${updated.compititor_id.length}`);

      // FIRST RIDER - Start competition
      if (updated.compititor_id.length === 1 && !updated.competition_started_at) {
        console.log('🏁 First rider - starting competition');
        await this.startCompetition(orderId, config.challenges_timeout);
      }

      // Auto-confirmation check
      const autoConfirmResult = await this.checkAutoConfirmation(order, user, raider);

      // Calculate time remaining
      const timeRemaining = this.calculateTimeRemaining(
        updated.competition_started_at,
        config.challenges_timeout
      );

      return {
        updated,
        ...autoConfirmResult,
        alreadyJoined: false,
        timeRemaining,
      };

    } finally {
      await this.redisService.releaseLock(lockKey);
    }
  }

  // Calculate time remaining
  private calculateTimeRemaining(startedAt: Date | null, duration: number): number {
    if (!startedAt) return duration;

    const now = new Date();
    const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
    return Math.max(0, duration - elapsed);
  }

  // START COMPETITION
  private async startCompetition(orderId: number, timeoutSeconds: number, broadcastToAll = true) {
    console.log(`🏁 Starting competition - Order: ${orderId}, Duration: ${timeoutSeconds}s`);

    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { competition_started_at: new Date() },
      include: { orderStops: true, vehicle: true, serviceZone: true },
    });

    // Schedule BullMQ job
    await competitionQueue.add(
      'close-competition',
      { orderId },
      { delay: timeoutSeconds * 1000 },
    );
    console.log(`⏰ Auto-close scheduled in ${timeoutSeconds}s`);

    const now = new Date();
    const endsAt = new Date(now.getTime() + timeoutSeconds * 1000);

    const competitionData = {
      orderId: order.id,
      serviceZoneId: order.serviceZoneId,
      vehicleTypeId: order.vehicle_type_id,
      totalCost: Number(order.total_cost),
      pickupLocation: {
        lat: order.orderStops[0]?.latitude || 0,
        lng: order.orderStops[0]?.longitude || 0,
        address: order.orderStops[0]?.address || '',
      },
      deliveryLocation: {
        lat: order.orderStops[order.orderStops.length - 1]?.latitude || 0,
        lng: order.orderStops[order.orderStops.length - 1]?.longitude || 0,
        address: order.orderStops[order.orderStops.length - 1]?.address || '',
      },
      competitionStartedAt: order.competition_started_at?.toISOString()!,
      competitionEndsAt: endsAt.toISOString(),
      timeRemaining: timeoutSeconds,
      competitorIds: order.compititor_id,
      competitorCount: order.compititor_id.length,
    };

    console.log('📣 Broadcasting only to competitors');
    await this.raiderGateway.broadcastCompetitionUpdateToCompetitors(competitionData);

    console.log('✅ Competition started');
  }

  // AUTO-CONFIRMATION CHECK
  private async checkAutoConfirmation(order: any, user: UserRaiderMapping, raider: any) {
    const c = await this.prisma.customer_order_confirmation.findFirst();
    if (!c) return { score: 0, shouldAutoConfirm: false, requiresManualConfirmation: true };

    const orderCount = await this.prisma.order.count({
      where: { userId: user.id, order_status: 'COMPLETED' },
    });

    const avgRating = await this.prisma.rateCustomer.aggregate({
      where: { user_id: order.userId },
      _avg: { rating_star: true },
    });

    const customerRating = avgRating._avg.rating_star ?? 3.0;
    const isNewCustomer = orderCount === 0;

    const newCustomerScore = isNewCustomer ? 0 : 5;
    const completedOrdersScore = Math.min(orderCount / 10, 1) * 5;

    const score =
      newCustomerScore * (c.is_new_customer_weight / 100) +
      completedOrdersScore * (c.completed_orders_weight / 100);
    // also will checked by follower

    const shouldAutoConfirm = score >= 3.0;

    if (shouldAutoConfirm) {
      await this.prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { raider_confirmation: true, is_auto_confirmation: true },
        });

        await tx.customer_order_confirmation_ratio_logs.create({
          data: {
            customer_id: user?.id,
            raider_id: raider.id,
            confirmation_ratio_type: OrderConfirmationRatioType.GENIUNE,
            is_auto_confirm: true,
          },
        });
      });

      this.raiderGateway.server.to(`rider:${raider.id}`).emit('rider:order_auto_confirmed', {
        orderId: order.id,
        message: '✅ Order auto-confirmed!',
      });

    } else if (!shouldAutoConfirm && customerRating < 3) {
      await this.prisma.customer_order_confirmation_ratio_logs.create({
        data: {
          customer_id: user?.id,
          raider_id: raider?.id,
          confirmation_ratio_type: OrderConfirmationRatioType.SUSPICIOUS,
          is_auto_confirm: false,
        },
      });
    } else {
      await this.prisma.customer_order_confirmation_ratio_logs.create({
        data: {
          customer_id: user?.id,
          raider_id: raider?.id,
          confirmation_ratio_type: OrderConfirmationRatioType.MANUAL_CHECK,
          is_auto_confirm: false,
        },
      });
    }

    return { score, shouldAutoConfirm, requiresManualConfirmation: !shouldAutoConfirm };
  }







}