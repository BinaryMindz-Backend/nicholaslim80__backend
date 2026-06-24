import { BadRequestException, ConflictException, ForbiddenException, forwardRef, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { NotificationType, OrderStatus, PaymentStatus, PayType, RaiderStatus, RaiderVerification, StopType, TransactionStatus, UserRole, WalletTransactionStatus, WalletTransactionType } from "@prisma/client";
import { TransactionIdService } from "src/common/services/transaction-id.service";
import { PrismaService } from "src/core/database/prisma.service";
import { RedisService } from "src/modules/auth/redis/redis.service";
import { EmailQueueService } from "src/modules/queue/services/email-queue.service";
import { RaiderGateway } from "src/modules/raider_root/raider gateways/raider.gateway";
import { ServiceZoneService } from "src/modules/superadmin_root/service-zone/service-zone.service";
import { GeoService } from "src/utils/geo-location.utils";
import { haversineDistance } from "src/utils/haversine";
import { OrderService } from "./order.service";
import { IUser } from "src/types";
import { PriorityOrder } from "./dto/update-order.dto";
import { WalletService } from "src/common/wallet/wallet.service";
import { NotificationRuleEngineService } from "src/modules/superadmin_root/eta/notification_role/notification_role.engine";

@Injectable()
export class OrderFeedService {
    private readonly logger = new Logger(OrderFeedService.name);
    constructor(
        private prisma: PrismaService,
        private txIdService: TransactionIdService,
        private redisService: RedisService,
        private readonly serviceZone: ServiceZoneService,
        private readonly geoServices: GeoService,
        private readonly emailQueueService: EmailQueueService,
        @Inject(forwardRef(() => RaiderGateway))
        private readonly raiderGateway: RaiderGateway,
        @Inject(forwardRef(() => OrderService))
        private readonly orderService: OrderService,
        @Inject(forwardRef(() => WalletService))
        private readonly walletService: WalletService,
        private readonly ruleEngine: NotificationRuleEngineService,



    ) { }

    // order for feed
    async orderForFeed(userId: number, page = 1, limit = 100) {
        const skip = (page - 1) * limit;

        const raider = await this.prisma.raider.findFirst({
            where: {
                userId,
                is_online: true,
                isSuspended: false,
                raider_status: RaiderStatus.ACTIVE,
                raider_verificationFromAdmin: 'APPROVED',
            },
            include: {
                locations: true,
                tier: true,
            },
        });

        if (!raider) {
            throw new ForbiddenException('Raider is offline or inactive');
        }

        if (!raider.locations) {
            throw new ForbiddenException('Raider location not available');
        }

        const avgRating = await this.prisma.rateRaider.aggregate({
            where: { raiderId: raider.id },
            _avg: { rating_star: true },
            _count: { id: true },
        });

        const formattedAverage = avgRating._avg.rating_star
            ? Number(avgRating._avg.rating_star.toFixed(2))
            : 0;

        const minRating = Number(raider.tier?.minRating ?? 0);
        const minCompletionRate = raider.tier?.minCompletionRate ?? 0;
        const maxCancellationRate = raider.tier?.maxCancellationRate ?? 100;

        const raiderRating = formattedAverage;
        const completionRate = raider.completion_rate ?? 100;
        const cancellationRate = raider.cancellation_rate ?? 0;

        const hasHistory = raider.completed_orders > 0;

        // ── Performance check — restrict order types instead of blocking everything ──
        const allowedDeliveryTypes: string[] = ['STANDARD', 'SAVER', 'EXPRESS'];
        const performanceWarnings: string[] = [];

        if (hasHistory && raider.isPremium && !raider.tier?.isInvitationOnly) {
            if (raiderRating < minRating) {
                performanceWarnings.push(
                    `Your rating (${raiderRating}) is below the minimum required (${minRating}) for your tier.`,
                );
                allowedDeliveryTypes.splice(allowedDeliveryTypes.indexOf('EXPRESS'), 1);
            }
            if (completionRate < minCompletionRate) {
                performanceWarnings.push(
                    `Your completion rate (${completionRate}%) is below the minimum required (${minCompletionRate}%).`,
                );
                allowedDeliveryTypes.splice(allowedDeliveryTypes.indexOf('EXPRESS'), 1);
            }
            if (cancellationRate > maxCancellationRate) {
                performanceWarnings.push(
                    `Your cancellation rate (${cancellationRate}%) exceeds the maximum allowed (${maxCancellationRate}%).`,
                );
                allowedDeliveryTypes.splice(allowedDeliveryTypes.indexOf('EXPRESS'), 1);
            }
        }

        if (performanceWarnings.length > 0) {
            return {
                data: [],
                total: 0,
                page,
                limit,
                totalPages: 0,
                raiderInfo: {
                    tier: raider.tier?.name ?? 'BRONZE',
                    tierCode: raider.tier?.code ?? 'BRONZE',
                    radiusKm: this.getRadiusForTier(raider.tier?.code ?? 'BRONZE'),
                    avgRating: raiderRating,
                    completionRate,
                    cancellationRate,
                    completedOrders: raider.completed_orders,
                    isExpressEligible: false,
                    expressWarning: null,
                    performanceWarnings,
                },
            };
        }

        const isExpressEligible = raiderRating >= 4.5;
        const expressWarning = !isExpressEligible
            ? `Express orders require a 4.5+ rating. Your current rating is ${raiderRating}. Express orders will appear lower in your feed until you reach 4.5.`
            : null;

        const radiusKm = this.getRadiusForTier(raider.tier?.code ?? 'BRONZE');
        const raiderLat = Number(raider.locations.latitude);
        const raiderLng = Number(raider.locations.longitude);

        // Use bounding box in Prisma query to avoid loading all orders ──
        const latDelta = radiusKm / 111; // ~1 degree = 111km
        const lngDelta = radiusKm / (111 * Math.cos(raiderLat * Math.PI / 180));

        const allOrders = await this.prisma.order.findMany({
            where: {
                order_status: OrderStatus.PENDING,
                is_placed: true,
                assign_rider_id: null,
                NOT: {
                    declines: {
                        some: { raiderId: raider.id },
                    },
                },
                // Bounding box filter to reduce dataset
                orderStops: {
                    some: {
                        type: StopType.PICKUP,
                        latitude: {
                            gte: raiderLat - latDelta,
                            lte: raiderLat + latDelta,
                        },
                        longitude: {
                            gte: raiderLng - lngDelta,
                            lte: raiderLng + lngDelta,
                        },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
            include: {
                user: {
                    select: { id: true, username: true, image: true, phone: true },
                },
                vehicle: true,
                delivery_type: {
                    select: { id: true, name: true },
                },
                orderStops: {
                    orderBy: { sequence: 'asc' },
                    select: {
                        id: true,
                        type: true,
                        address: true,
                        destination: {
                            select: {
                                shortName: true,
                            }
                        },
                        latitude: true,
                        longitude: true,
                        sequence: true,
                        calculated_price: true,
                        calculated_distance: true,
                        calculated_time: true,
                        calculated_time_txt: true,
                        payment: {
                            select: { amount: true, payType: true, status: true },
                        },
                    },
                },
            },
        });

        // Then filter orders by allowed types
        const filteredOrders = allOrders.filter((order) => {
            const pickup = order.orderStops.find((s) => s.type === StopType.PICKUP);
            if (!pickup) return false;
            const inRadius = haversineDistance(raiderLat, raiderLng, pickup.latitude, pickup.longitude) <= radiusKm;
            const allowedType = allowedDeliveryTypes.includes(order.delivery_type?.name?.toUpperCase());
            return inRadius && allowedType;
        });


        const scored = filteredOrders.map((order) => {
            const pickup = order.orderStops.find((s) => s.type === StopType.PICKUP);
            const dropStops = order.orderStops.filter((s) => s.type === StopType.DROP);

            const raiderToPickupKm = pickup
                ? haversineDistance(raiderLat, raiderLng, pickup.latitude, pickup.longitude)
                : 0;

            return {
                ...order,
                feedMeta: {
                    raiderToPickupKm: Number(raiderToPickupKm.toFixed(2)),
                    basePay: Number(order.total_cost) - (Number(order.additional_cost) + Number(order.priority_fee)),
                    extraFee: Number(order.additional_cost) + Number(order.priority_fee),
                    dropCount: dropStops.length,
                    totalTimeMin: dropStops.reduce((sum, s) => sum + Number(s.calculated_time ?? 0), 0),
                    deliveryType: order.delivery_type?.name ?? '',
                    isExpressBoosted:
                        order.delivery_type?.name?.toUpperCase() === 'EXPRESS' && isExpressEligible,
                },
                _score: this.scoreOrderForRaider(order, raider, raiderRating, raiderLat, raiderLng),
            };
        });

        // DEBUG: log scores before sort
        scored.forEach(o => console.log(`Order ${o.id}: _score=${o._score}, type=${o.delivery_type?.name}, cost=${o.total_cost}`));

        scored.sort((a, b) => b._score - a._score);

        const total = scored.length;
        const paginated = scored.slice(skip, skip + limit);
        const data = paginated.map(({ _score, ...order }) => order);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            raiderInfo: {
                tier: raider.tier?.name ?? 'BRONZE',
                tierCode: raider.tier?.code ?? 'BRONZE',
                radiusKm,
                avgRating: raiderRating,
                completionRate,
                cancellationRate,
                completedOrders: raider.completed_orders,
                isExpressEligible,
                expressWarning,
                performanceWarnings: [],
            },
        };
    }


    // ── Score order for raider ──
    private scoreOrderForRaider(
        order: any,
        raider: any,
        raiderRating: number,
        raiderLat: number,
        raiderLng: number,
    ): number {
        let score = 0;

        // Recency — newer = higher score (max 50pts)
        // ensure age is never negative (timezone safety)
        const ageMinutes = Math.max(
            0,
            (Date.now() - new Date(order.created_at).getTime()) / 60000,
        );
        score += Math.max(0, 50 - ageMinutes);

        // Total cost — higher paying = higher score (max 30pts)
        const cost = Number(order.total_cost ?? 0);
        score += Math.min(30, cost / 10);

        // Distance — closer pickup = higher score (max 20pts)
        const pickup = order.orderStops?.find((s: any) => s.type === StopType.PICKUP);
        if (pickup) {
            const dist = haversineDistance(
                raiderLat,
                raiderLng,
                pickup.latitude,
                pickup.longitude,
            );
            score += Math.max(0, 20 - dist * 2);
        }

        // ── Delivery type priority ──
        const deliveryTypeName = order.delivery_type?.name?.toUpperCase() ?? '';
        const isHighRated = raiderRating >= 4.5;
        const EXPRESS_FALLBACK_MINUTES = 3;
        const expressOpenToAll = ageMinutes >= EXPRESS_FALLBACK_MINUTES;

        if (deliveryTypeName === 'EXPRESS') {
            if (isHighRated) {
                score += 100; // 4.5+ always sees Express at top
            } else if (expressOpenToAll) {
                score += 100; // waited 3 mins — open to everyone equally
            }
            // else: fresh Express + low rated → natural position

        } else if (deliveryTypeName === 'STANDARD') {
            score += 30; // mid priority for all raiders

        } else if (deliveryTypeName === 'SAVER') {
            // no boost — natural sort only
        }

        // Tier priority multiplier — higher tier sees better sorted feed
        const priorityScore = Number(raider.tier?.priorityScore) || 1.0;
        score *= priorityScore;

        return score;
    }


    // ── Radius per tier ──
    public getRadiusForTier(tierCode: string): number {
        const radiusMap: Record<string, number> = {
            BRONZE: 5000000000000,
            SILVER: 8000000000000,
            GOLD: 12000000000000,
            PLATINUM: 20000000000000,
        };
        return radiusMap[tierCode] ?? 5;
    }


    // feed only order
    async orderForFeedTest(userId: number, page = 1, limit = 100) {
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
                    orderStops: {
                        include: {
                            destination: {
                                select: {
                                    address: true,
                                    shortName: true
                                }
                            }
                        }
                    },
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

    // 
    async declineOrder(orderId: number, raiderId: number) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.order_status !== OrderStatus.PENDING) {
            throw new BadRequestException('Order is no longer available');
        }

        // Fetch raider by ID (not user)
        const raider = await this.prisma.raider.findUnique({
            where: { id: raiderId },
            include: { user: { select: { id: true } } },
        });

        if (!raider) {
            throw new NotFoundException('Raider not found');
        }

        // Prevent duplicate declines
        const alreadyDeclined = await this.prisma.orderDecline.findUnique({
            where: {
                orderId_raiderId: {
                    orderId,
                    raiderId: raider.id,
                },
            },
        });

        if (alreadyDeclined) {
            throw new ConflictException('Order already declined');
        }

        const decline = await this.prisma.orderDecline.create({
            data: {
                orderId,
                raiderId: raider.id,
            },
        });

        // Optional: real-time removal from rider's current feed
        if (raider.user?.id) {
            this.raiderGateway.server.to(`rider_${raider.user.id}`).emit('rider:order_declined', {
                orderId,
                message: 'Order removed from your feed',
            });
        }

        return decline;
    }

    //order cancelation
    async cancelOrder(orderId: number, user: IUser, reason?: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                orderStops: { include: { payment: true } },
                user: true,
                delivery_type: true,  // include for broadcast
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

        if (!order || order.userId !== user.id) {
            throw new BadRequestException('Order not found or unauthorized');
        }

        if (!["PROGRESS", "PENDING"].includes(order.order_status)) {
            throw new BadRequestException('Cannot cancel order in current status');
        }

        const pickupStop = order.orderStops.find((s) => s.type === StopType.PICKUP);

        const result = await this.prisma.$transaction(async (tx) => {
            // Refund if already paid
            if (order.pay_type === PayType.WALLET && order.is_placed) {
                await tx.user.update({
                    where: { id: user.id },
                    data: {
                        currentWalletBalance: {
                            increment: Number(order.total_cost),
                        },
                    },
                });
            }

            if (order.pay_type === PayType.ONLINE_PAY && order.is_placed) {
                // TODO: trigger refund via payment gateway
            }

            const cancelledOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    order_status: OrderStatus.CANCELLED,
                    cancellation_reason: reason ?? null,
                    cancelled_at: new Date(),
                    cancelled_by: user.roles.find((r) => r.name === UserRole.USER) ? 'USER' : user.roles.find((r) => r.name === UserRole.ADMIN) ? 'ADMIN' : 'RAIDER',
                },
            });

            if (cancelledOrder.assign_rider_id) {
                await this.redisService.hdel(
                    `rider:${cancelledOrder.assign_rider_id}:active_order_users`,
                    cancelledOrder.id.toString(),
                );
            }

            const transaction = await tx.transaction.findFirst({
                where: { orderId },
            });

            if (transaction) {
                await tx.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        tx_status: TransactionStatus.FAILED,  // or FAILED
                        payment_status: PaymentStatus.PENDING,
                    },
                });
            }

            // Notifications
            if (order.user?.fcmToken) {
                await this.emailQueueService.queueOrderStatusNotification({
                    userId: order.userId!,
                    fcmToken: order.user.fcmToken,
                    orderId: order.id,
                    orderNumber: `ORD-${String(order.id).padStart(6, '0')}`,
                    status: NotificationType.ORDER_UPDATE,
                    title: 'Order Cancelled',
                    message: `Your order has been cancelled${reason ? `: ${reason}` : ''}.`,
                });
            }

            if (order.assign_rider?.user?.fcmToken) {
                await this.emailQueueService.queueOrderStatusNotification({
                    userId: order.assign_rider_id!,
                    fcmToken: order.assign_rider.user.fcmToken,
                    orderId: order.id,
                    orderNumber: `ORD-${String(order.id).padStart(6, '0')}`,
                    status: NotificationType.ORDER_UPDATE,
                    title: 'Order Cancelled',
                    message: `Assigned order has been cancelled by customer.`,
                });
            }
            // notifyEtaUpdate trigger
            await this.ruleEngine.evaluateStatus(orderId, 'CANCELLED').catch((err) =>
                this.logger.error(`Rule engine failed for order ${orderId} status CANCELLED: ${err.message}`),
            );
            return {
                message: 'Order cancelled successfully',
                order: cancelledOrder,
                refunded: order.is_placed && order.pay_type === PayType.WALLET,
            };
        });

        // ── Broadcast feed update to nearby riders (non-blocking) ──
        if (pickupStop && order.order_status === OrderStatus.PENDING) {
            this.orderService.broadcastFeedToNearbyRiders(
                Number(pickupStop.latitude),
                Number(pickupStop.longitude),
                order.delivery_type?.name ?? 'STANDARD',
            ).catch((err) => {
                this.logger.error(`Feed broadcast failed after cancel: ${err.message}`);
            });
        }

        return result;
    }

    // assign by admin
    async assignDriver(id: number, riderId: number) {
        const raider = await this.prisma.raider.findFirst({
            where: {
                id: riderId,
                raider_verificationFromAdmin: RaiderVerification.APPROVED,
                isSuspended: false,
                raider_status: RaiderStatus.ACTIVE,
            },
            include: { locations: true, tier: true },
        });

        if (!raider) {
            throw new NotFoundException('Rider is not verified');
        }

        // 1. Check order exists
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                orderStops: true,
                delivery_type: true,
                user: { select: { id: true, fcmToken: true } },
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // 2. Check if order already has assigned rider
        if (order.assign_rider_id) {
            throw new ConflictException('This order already has an assigned rider');
        }

        // 3. Check if this rider is already assigned to another active order
        const riderAlreadyAssigned = await this.prisma.order.findFirst({
            where: {
                assign_rider_id: riderId,
                order_status: {
                    in: [OrderStatus.PENDING, OrderStatus.ONGOING],
                },
            },
        });

        if (riderAlreadyAssigned) {
            throw new ConflictException('This rider is already assigned to another active order');
        }

        // 4. Assign rider
        const updatedOrder = await this.prisma.$transaction(async (tx) => {
            if (order.userId && order.id) {
                await this.redisService.hset(
                    `rider:${raider.id}:active_order_users`,
                    order.id.toString(),
                    order.userId.toString(),
                );
            }

            this.logger.log(
                `[REDIS] Added tracking mapping rider:${raider.id}:active_order_users -> ${order.id}:${order.userId}`,
            );

            return tx.order.update({
                where: { id },
                data: {
                    assign_rider_id: riderId,
                    order_status: OrderStatus.ONGOING,
                    competition_closed: true,
                    assign_at: new Date(),
                },
            });
        });

        // ── BROADCAST: Assigned rider gets order details ── // TODO : future updates
        // this.raiderGateway.server
        //     .to(`rider_${raider.userId}`)
        //     .emit('rider:order_assigned', {
        //         orderId: updatedOrder.id,
        //         orderNumber: `ORD-${String(updatedOrder.id).padStart(6, '0')}`,
        //         status: OrderStatus.ONGOING,
        //         message: 'Order assigned to you',
        //         pickup: order.orderStops.find((s) => s.type === StopType.PICKUP),
        //         drops: order.orderStops.filter((s) => s.type === StopType.DROP),
        //         user: order.user,
        //     });

        // ── BROADCAST: Other riders get fresh feed (order removed) ──
        const pickupStop = order.orderStops.find((s) => s.type === StopType.PICKUP);
        if (pickupStop) {
            this.orderService.broadcastFeedToNearbyRiders(
                Number(pickupStop.latitude),
                Number(pickupStop.longitude),
                order.delivery_type?.name ?? 'STANDARD',
            ).catch((err) => {
                this.logger.error(
                    `Feed broadcast failed after assign: ${err.message}`,
                );
            });
        }

        // ── BROADCAST: User gets confirmation ──
        if (order.user?.fcmToken) {
            await this.emailQueueService.queueOrderStatusNotification({
                userId: order.user.id,
                fcmToken: order.user.fcmToken,
                orderId: order.id,
                orderNumber: `ORD-${String(order.id).padStart(6, '0')}`,
                status: NotificationType.ORDER_UPDATE,
                title: 'Driver Assigned',
                message: `A driver has been assigned to your order by admin.`,
            });
        }
        // 
        // notification role engine for auto-assignment trigger
        await this.ruleEngine.evaluateStatus(order.id, 'ASSIGNED');


        return updatedOrder;
    }

    // prioritize order
    async priorityOrder(orderId: number, userId: number, dto: PriorityOrder) {

        if (!dto.payType) {
            throw new BadRequestException('Payment type is required for priority order');
        }

        if (
            dto.payType !== PayType.WALLET &&
            dto.payType !== PayType.ONLINE_PAY
        ) {
            throw new BadRequestException(
                `Pay type ${dto.payType} is not supported for priority orders`,
            );
        }

        if (dto.payType === PayType.ONLINE_PAY && !dto.paymentMethodId) {
            throw new BadRequestException('Payment method ID required for online payment');
        }

        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                orderStops: true,
                delivery_type: true,
            }
        });

        if (!order || order.userId !== userId) {
            throw new NotFoundException(`ORD-${orderId} not found`);
        }

        // ── GUARD: Already prioritized ──
        if (order.isPriorited === true) {
            throw new ConflictException(`ORD-${orderId} is already on priority`);
        }

        // ── GUARD: Order status ──
        if (order.order_status !== OrderStatus.PENDING || order.is_placed !== true) {
            throw new BadRequestException('Can only prioritize placed orders');
        }
        // online payment
        if (dto.payType === PayType.ONLINE_PAY) {
            const paid = await this.walletService.payWithSavedCard(
                userId,
                dto.amount,
                dto.paymentMethodId!,
                dto.payType,
            );

            if (!paid) {
                throw new BadRequestException('Online payment failed');
            }
        }

        // ── TRANSACTION ──
        const updatedOrder = await this.prisma.$transaction(async (tx) => {
            // ── WALLET PAYMENT ──
            if (dto.payType === PayType.WALLET) {
                const user = await tx.user.findUnique({ where: { id: userId } });

                if (!user || Number(user.currentWalletBalance) < dto.amount) {
                    throw new BadRequestException(
                        `Insufficient wallet balance. Priority fee is $${dto.amount}`,
                    );
                }

                await tx.user.update({
                    where: { id: userId },
                    data: {
                        currentWalletBalance: { decrement: dto.amount },
                    },
                });
                // need to add transaction history for wallet payment
                await tx.walletHistory.create({
                    data: {
                        userId: userId,
                        amount: Number(dto.amount),
                        type: 'debit',
                        transactionId: this.txIdService.generate(),
                        transactionType: WalletTransactionType.PAYMENT,
                        status: WalletTransactionStatus.SUCCESS,
                        currency: 'SGD',
                        message: `Priority fee payment for order #${orderId}.`,
                    },
                });
            }

            // ── UPDATE ORDER ──
            // Freeze originalCost if not already set (same pattern as additionalService)
            const originalCost =
                Number(order.originalCost) !== 0
                    ? Number(order.originalCost)
                    : Number(order.total_cost);

            //  
            return tx.order.update({
                where: { id: orderId },
                data: {
                    isPriorited: true,
                    priorityAt: new Date(),
                    priority_fee: dto.amount,
                    originalCost,
                    total_cost: parseFloat((Number(order.total_cost) + dto.amount).toFixed(2)),
                    total_raider_earnings: parseFloat(
                        (Number(order.total_raider_earnings) + dto.amount).toFixed(2)
                    ),
                },
                include: {
                    orderStops: true,
                    delivery_type: true,
                },
            });
        });

        // ── BROADCAST: Nearby riders get updated feed (order now scores higher) ──
        const pickupStop = updatedOrder.orderStops.find((s: any) => s.type === StopType.PICKUP);
        if (pickupStop) {
            this.orderService.broadcastFeedToNearbyRiders(
                Number(pickupStop.latitude),
                Number(pickupStop.longitude),
                updatedOrder.delivery_type?.name ?? 'STANDARD',
            ).catch((err: any) => {
                this.logger.error(`Feed broadcast failed after prioritize: ${err.message}`);
            });
        }

        // ── NOTIFICATION ) ──
        const user = await this.prisma.user.findUnique({ where: { id: userId } });

        if (user) {
            await this.emailQueueService.queueOrderStatusNotification({
                userId: user.id,
                fcmToken: user.fcmToken ?? '',
                orderId: updatedOrder.id,
                orderNumber: `ORD-${String(updatedOrder.id).padStart(6, '0')}`,
                status: NotificationType.ORDER_UPDATE,
                title: 'Order Prioritized Successfully',
                message: `Your order ORD-${String(updatedOrder.id).padStart(6, '0')} has been prioritized. Priority fee of $${dto.amount.toFixed(2)} applied. New total: $${Number(updatedOrder.total_cost).toFixed(2)}.`,
            });
        }

        return updatedOrder;
    }

}
