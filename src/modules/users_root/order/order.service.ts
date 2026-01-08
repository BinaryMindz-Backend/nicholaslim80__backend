/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { DeliveryZone, DestinationInput, IUser, Receiver } from 'src/types';
import { CollectTime, DeliveryTypeName, DestinationType, OrderConfirmationRatioType, OrderStatus, PaymentStatus, PaymentType, PayType, RaiderStatus, RaiderVerification, RouteType, StopStatus, StopType, TransactionStatus, TransactionType } from '@prisma/client';
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


@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private txIdService: TransactionIdService,
    private redisService: RedisService,
    private readonly serviceZone: ServiceZoneService,
    private readonly geoServices: GeoService,
    private readonly emailQueueService: EmailQueueService,
    private readonly walletService: WalletService

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

    // Create OrderStop (snapshot)
    const sequence = order.orderStops.length + 1;

    // Create OrderStop
    const orderStop = await this.prisma.orderStop.create({
      data: {
        orderId,
        destinationId,
        type: stopType,
        sequence,
        address: destination.address!,
        latitude: destination.latitude!,
        longitude: destination.longitude!,
        additionalInfo: destination.additionalInfo,
        status: 'PENDING',
        payment: {
          create: {
            payType: order.pay_type ?? 'COD',
            amount: 0, // Will be calculated below
            status: 'UNPAID',
          },
        },
      },
      include: {
        destination: true,
        payment: true,
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
        orderStops: {
          include: { payment: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    if (!order || order.userId !== userId) {
      throw new BadRequestException('Order not found or unauthorized');
    }

    if (order.order_status !== OrderStatus.PROGRESS) {
      throw new BadRequestException('Order already placed');
    }

    // Validate order has stops
    const pickupStop = order.orderStops.find(s => s.type === StopType.PICKUP);
    const dropStops = order.orderStops.filter(s => s.type === StopType.DROP);

    if (!pickupStop || dropStops.length === 0) {
      throw new BadRequestException('Order must have at least 1 pickup and 1 drop location');
    }

    const payType = dto.paymentMethod ?? order.pay_type ?? PayType.COD;
    const codCollectFrom = dto.codCollectFrom ?? 'RECEIVER';

    return await this.prisma.$transaction(async (tx) => {
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
      return tx.order.update({
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

        //  find order to update transaction payment status
        await tx.transaction.findFirst({
          where: {
            orderId: stop.orderId
          }
        })


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

      return {
        message: 'Stop completed successfully',
        orderCompleted: false,
        remainingStops: incompleteStops.length,
      };
    });
  }

  // cancle order 
  async cancelOrder(orderId: number, userId: number, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderStops: { include: { payment: true } },
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
      include: { order: true },
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
      where: { id: stopId },
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

    return {
      message: 'Stop reset to PENDING for retry',
      stopId
    };
  }

  /**
 * Create individual order with geocoding and pricing
 */
  async createIndividualOrder(payload: CreateIndiOrderDto, user: IUser) {
    // Step 1: Geocode all destinations
    const geocodedDestinations: DestinationInput[] = [];
    let orderServiceZoneId: number | null = null;
    let orderServiceZone: DeliveryZone | null = null;

    for (const d of payload.destinations) {
      let lat = d.latitude;
      let lng = d.longitude;
      let formattedAddress;

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

    const receiverDestinations: Receiver[] = geocodedDestinations
      .filter((d) => d.type !== DestinationType.SENDER)
      .map((d) => ({ lat: d.latitude, lng: d.longitude }));

    if (receiverDestinations.length === 0) {
      throw new BadRequestException('At least one receiver destination is required');
    }

    // Step 3: Calculate pricing
    const receiversWithPrice = await getReceiversWithIndividualPrice(
      this.prisma,
      sender,
      receiverDestinations,
      payload.delivery_type,
      payload.vehicle_type_id,
      orderServiceZone,
      {
        isRoundTrip: payload.route_type === RouteType.ROUND,
        returnFactor: 0.5,
      },
    );

    const totalCost = receiversWithPrice.reduce((sum, r) => sum + r.pricing.totalPrice, 0);
    const totalFee = receiversWithPrice.reduce((sum, r) => sum + r.pricing.totalFee, 0);

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
          payment_method_id: payload.payment_method_id,
          total_cost: isNaN(Number(totalCost)) ? 0 : parseFloat(Number(totalCost).toFixed(2)),
          total_fee: parseFloat(Number(totalFee).toFixed(2)),
          isFixed: payload.isFixed ?? false,
          order_status: OrderStatus.PROGRESS,
        },
      });

      // Create destinations and order stops
      const createdStops: any[] = [];
      let sequence = 1;

      for (const d of geocodedDestinations) {
        // Create destination (if saving to address book)
        let destinationId: number;

        if (d.is_saved) {
          const savedDest = await tx.destination.create({
            data: {
              userId: user.id,
              address: d.address,
              addressFromApr: d.addressFromApr ?? null,
              floor_unit: d.floor_unit ?? null,
              contact_name: d.contact_name ?? null,
              contact_number: d.contact_number ?? null,
              latitude: d.latitude,
              longitude: d.longitude,
              additionalInfo: d.note_to_driver ?? null,
              type: d.type === DestinationType.SENDER
                ? DestinationType.SENDER
                : DestinationType.RECEIVER,
              lastUsedAt: new Date(),
              useCount: 1,
            },
          });
          destinationId = savedDest.id;
        } else {
          // Create temporary destination for this order only
          const tempDest = await tx.destination.create({
            data: {
              userId: user.id,
              address: d.address,
              addressFromApr: d.addressFromApr ?? null,
              floor_unit: d.floor_unit ?? null,
              latitude: d.latitude,
              longitude: d.longitude,
              type: d.type === DestinationType.SENDER
                ? DestinationType.SENDER
                : DestinationType.RECEIVER,
            },
          });
          destinationId = tempDest.id;
        }

        // Create order stop
        const stopType = d.type === DestinationType.SENDER ? StopType.PICKUP : StopType.DROP;

        const stop = await tx.orderStop.create({
          data: {
            orderId: order.id,
            destinationId,
            type: stopType,
            sequence,
            status: StopStatus.PENDING,
            address: d.addressFromApr!,
            latitude: d.latitude,
            longitude: d.longitude,
            additionalInfo: d.note_to_driver ?? null,
            // Create payment record
            payment: {
              create: {
                payType: payload.pay_type ?? PayType.COD,
                amount: 0, // Will be set in placeOrder
                status: PaymentStatus.UNPAID,
              },
            },
          },
        });

        createdStops.push(stop);
        sequence++;
      }

      // Create transaction record
      const txId = this.txIdService.generate();
      const transaction = await tx.transaction.create({
        data: {
          transaction_code: txId,
          payment_status: PaymentStatus.UNPAID,
          payment_method_id: payload.payment_method_id,
          type: TransactionType.BOOK_ORDER,
          delivery_fee: order.total_cost,
          total_fee: order.total_fee,
          userId: user.id,
          pay_type: payload.pay_type,
          orderId: order.id,
        },
        include: {
          user: { select: { username: true } },
          order: { select: { id: true, order_status: true } },
        },
      });

      return { order, transaction, stops: createdStops };
    });

    return result;
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
          id: userId,
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
          commission: true,
          refund_amount: true,
          has_additional_services: true,
          is_promo_used: true,
          notify_favorite_raider: true,
          payment_method_id: true,
          assign_rider_id: true,
          raider_confirmation: true,
          is_auto_confirmation: true,
          is_reviewed: true,

          // only for counting
          orderStops: {
            select: { id: true },
          },
        },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    const data = orders.map(({ orderStops, ...order }) => ({
      ...order,
      total_stops: orderStops.length,
    }));

    return {
      data,
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
        include: { user: true, transactions: true },
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
    //  
    if (search) {
      // Remove non-digit characters to get integer id
      const orderId = parseInt(search.replace(/\D/g, ''), 10);
      if (!isNaN(orderId)) {
        where.id = orderId;
      }
    }
    if (status) where.order_status = status;
    if (category) where.delivery_type = category;

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
          is_promo_used: true,
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
          orderStops: true

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
          is_promo_used: true,
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
        orderStops: {
          include: {
            destination: true,
            payment: true,
          },
          orderBy: { sequence: 'asc' },
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


  // **HOT CAKE: driver compitition algorithom (If you dont understand it then dont touch it)
  async driverCompitition(user: IUser, orderId: number) {
    // console.log("form order compition--->", user, orderId);
    //  
    const raider = await this.prisma.raider.findFirst({
      where: {
        userId: user.id,
        raider_verificationFromAdmin: RaiderVerification.APPROVED,
        isSuspended: false,
        raider_status: RaiderStatus.ACTIVE
      }
    })



    //  
    if (!raider) {
      throw new NotFoundException("Raider not found")
    }

    const lockKey = `order:competition:${orderId}`;

    const lockAcquired = await this.redisService.acquireLock(lockKey, 3000);
    if (!lockAcquired) {
      throw new ConflictException(
        'Competition is processing, please try again',
      );
    }

    try {
      const config = await this.prisma.driver_order_competition.findFirst();
      if (!config) throw new NotFoundException('Competition config missing');

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) throw new NotFoundException('Order not found');
      if (order.order_status !== OrderStatus.PENDING) {
        throw new NotFoundException("Order is not ready for compitition")
      }

      if (order.competition_closed) {
        throw new BadRequestException('Competition already closed');
      }

      if (order.compititor_id.includes(raider.id)) {
        return order; // already joined
      }

      if (order.compititor_id.length >= config.max_users_to_join) {
        throw new BadRequestException(
          'Maximum number of competitors has been reached',
        );
      }

      const updated = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          compititor_id: { push: raider.id },
        },
      });
      // console.log(updated,updated.compititor_id.length === 1, raider );
      // Start competition only once
      if (
        updated.compititor_id.length === 1 &&
        !updated.competition_started_at
      ) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { competition_started_at: new Date() },
        });

        // Schedule BullMQ job to auto-close competition
        await competitionQueue.add(
          'close-competition',          // job name
          { orderId },                  // job data
          { delay: config.challenges_timeout * 1000 } // delay in ms
        );
      }


      // Auto Order Confirmation
      const c = await this.prisma.customer_order_confirmation.findFirst();
      if (!c) return;

      // Get customer's completed order count
      const orderCount = await this.prisma.order.count({
        where: {
          userId: user.id,
          order_status: 'COMPLETED'
        }
      });

      // Get average rating from drivers for this customer
      const avgRating = await this.prisma.rateCustomer.aggregate({
        where: {
          user_id: order.userId
        },
        _avg: {
          rating_star: true
        }
      });

      // Default rating for new customers (no ratings yet)
      const customerRating = avgRating._avg.rating_star ?? 3.0;

      // Determine if new customer
      const isNewCustomer = orderCount === 0;

      // Calculate score components (normalized to 0-5 scale for consistency)
      const newCustomerScore = isNewCustomer ? 0 : 5; // New customer = 0, Existing = 5
      const completedOrdersScore = Math.min(orderCount / 10, 1) * 5; // Scale: 0-5 based on orders

      // Apply weights (convert percentage to decimal)
      const score =
        (newCustomerScore * (c.is_new_customer_weight / 100)) +
        (completedOrdersScore * (c.completed_orders_weight / 100));
      // (followerScore * (config.followers_weight / 100));

      // With your weights: 50% + 0% + 50%
      // Max possible score = 5 (if not new customer + is follower)
      // Example: (5 × 0.50) + (x × 0.00) + (5 × 0.50) = 2.5 + 0 + 2.5 = 5.0

      // Determine if auto-confirm
      const autoConfirmThreshold = 3.0; // Configurable
      const shouldAutoConfirm = score >= autoConfirmThreshold;
      // 
      console.log({
        userId: user.id,
        orderCount,
        isNewCustomer,
        customerRating,
        components: {
          newCustomer: newCustomerScore * (c.is_new_customer_weight / 100),
          completedOrders: completedOrdersScore * (c.completed_orders_weight / 100),
          // follower: followerScore * (config.followers_weight / 100)
        },
        finalScore: score,
        shouldAutoConfirm
      });
      //  check and create logs
      if (shouldAutoConfirm) {
        const res = await this.prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: {
              id: order.id
            },
            data: {
              raider_confirmation: true,
              is_auto_confirmation: true
            }
          })
          await tx.customer_order_confirmation_ratio_logs.create({
            data: {
              customer_id: user?.id,
              raider_id: raider.id,
              confirmation_ratio_type: OrderConfirmationRatioType.GENIUNE,
              is_auto_confirm: true
            }
          })
        })
        return res;
      }
      else if (!shouldAutoConfirm && customerRating < 3) {
        await this.prisma.customer_order_confirmation_ratio_logs.create({
          data: {
            customer_id: user?.id,
            raider_id: raider?.id,
            confirmation_ratio_type: OrderConfirmationRatioType.SUSPICIOUS,
            is_auto_confirm: false

          }
        })
      }
      else {
        await this.prisma.customer_order_confirmation_ratio_logs.create({
          data: {
            customer_id: user?.id,
            raider_id: raider?.id,
            confirmation_ratio_type: OrderConfirmationRatioType.MANUAL_CHECK,
            is_auto_confirm: false

          }
        })
      }


      return {
        updated,
        score,
        shouldAutoConfirm,
        requiresManualConfirmation: !shouldAutoConfirm
      };

    } finally {
      await this.redisService.releaseLock(lockKey);
    }
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
  async orderForFeed(
    userId: number,
    page = 1,
    limit = 100,
  ) {
    const skip = (page - 1) * limit;
    const raider = await this.prisma.raider.findFirst({
      where: {
        userId
      }
    })

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: {
          order_status: OrderStatus.PENDING,
          is_placed: true,
          // user: {
          //   raiderProfile: {
          //     is_online: true,
          //     isSuspended: false,
          //     // raider_status: RaiderStatus.ACTIVE
          //   }
          // },

          // EXCLUDE declined orders for THIS raider only
          NOT: {
            declines: {
              some: {
                raiderId: raider?.id,
              },
            },
          },
        },
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
        where: {
          order_status: OrderStatus.PENDING,
          is_placed: true,
          NOT: {
            declines: {
              some: {
                raiderId: raider?.id,
              },
            },
          },
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


  //order decline
  async declineOrder(orderId: number, raiderId: number) {
    return await this.prisma.orderDecline.create({
      data: {
        orderId,
        raiderId,
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

  // 
  async getActiveOrderByRider(riderId: number) {
    return await this.prisma.order.findFirst({
      where: { assign_rider_id: riderId, order_status: OrderStatus.ONGOING },
    });
  }

  async getAllActiveOrders() {
    return await this.prisma.order.findMany({ where: { order_status: OrderStatus.ONGOING } })

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

}