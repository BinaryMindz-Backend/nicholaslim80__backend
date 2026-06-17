import { RedisService } from "@liaoliaots/nestjs-redis";
import { ForbiddenException, forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { OrderStatus, RaiderStatus, StopType } from "@prisma/client";
import { TransactionIdService } from "src/common/services/transaction-id.service";
import { PrismaService } from "src/core/database/prisma.service";
import { EmailQueueService } from "src/modules/queue/services/email-queue.service";
import { RaiderGateway } from "src/modules/raider_root/raider gateways/raider.gateway";
import { ServiceZoneService } from "src/modules/superadmin_root/service-zone/service-zone.service";
import { GeoService } from "src/utils/geo-location.utils";
import { haversineDistance } from "src/utils/haversine";

@Injectable()
export class OrderFeedService {
    private readonly logger = new Logger(OrderFeedService.name);
    constructor(
        private prisma: PrismaService,
        private txIdService: TransactionIdService,
        // private redisService: RedisService,
        private readonly serviceZone: ServiceZoneService,
        private readonly geoServices: GeoService,
        private readonly emailQueueService: EmailQueueService,
        @Inject(forwardRef(() => RaiderGateway))
        private readonly raiderGateway: RaiderGateway



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












}
