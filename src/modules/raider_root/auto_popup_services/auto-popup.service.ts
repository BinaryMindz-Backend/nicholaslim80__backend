import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { RaiderGateway } from '../raider gateways/raider.gateway';
import { OrderStatus, RaiderVerification } from '@prisma/client';
import { autoPopupQueue, connection } from 'src/core/queues/queue'
import { haversineDistance } from 'src/utils/haversine';


// Redis key helpers — keeps all popup state in Redis, not DB
const POPUP_QUEUE_KEY = (orderId: number) => `popup:queue:${orderId}`;       // remaining driver queue
const POPUP_ACTIVE_KEY = (orderId: number) => `popup:active:${orderId}`;     // currently pending driver
const POPUP_ACCEPTED_KEY = (orderId: number) => `popup:accepted:${orderId}`; // accepted flag
const POPUP_TIMEOUT_SEC = 15; // configurable — match your admin portal setting

  // targeted codes  
  const GOLD_PLATINUM_CODES = ['GOLD', 'PLATINUM'];
   export interface EligibleDriver {
    raiderId: number;
    userId: number;
    distanceKm: number;
    isAvailable: boolean;
    tierCode: string;
    priorityScore: number;
    }
@Injectable()
export class AutoPopupService {
  private readonly logger = new Logger(AutoPopupService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => RaiderGateway))
    private readonly raiderGateway: RaiderGateway,
    
  ) {}

   async findEligibleDrivers(
    pickupLat: number,
    pickupLng: number,
    deliveryTypeName: string, // 'EXPRESS' | 'STANDARD' | 'SAVER' (pooling)
    radiusKm: number,
  ): Promise<EligibleDriver[]> {
    const isPooling = deliveryTypeName.toUpperCase() === 'SAVER';

    const raiders = await this.prisma.raider.findMany({
      where: {
        is_online: true,
        isAutoPopUpEnabled: true,
        isSuspended: false,
        raider_verificationFromAdmin: RaiderVerification.APPROVED,
          tier: {
              is: {
                code: { in: GOLD_PLATINUM_CODES },
                isActive: true,
              },
            },
          // Express/Standard: only available drivers
        // Pooling: available OR on delivery (can stack)
        ...(isPooling ? {} : { is_available: false }),
      },
      include: {
        locations: true,
        tier: true,
      },
    });

    const eligible: EligibleDriver[] = [];

    for (const raider of raiders) {
      if (!raider.locations) continue;

      const driverLat = Number(raider.locations.latitude);
      const driverLng = Number(raider.locations.longitude);

      const distanceKm = haversineDistance(
        pickupLat, pickupLng,
        driverLat, driverLng,
      );

      // Filter by radius
      if (distanceKm > radiusKm) continue;

      eligible.push({
        raiderId: raider.id,
        userId: raider.userId,
        distanceKm,
        isAvailable: raider.is_available,
        tierCode: raider.tier?.code ?? 'BRONZE',
        priorityScore: Number(raider.tier?.priorityScore ?? 1.0),
      });
    }

    // Sort: nearest first, then by tier priority score (higher = better)
    eligible.sort((a, b) => {
      const distanceDiff = a.distanceKm - b.distanceKm;
      if (Math.abs(distanceDiff) > 0.5) return distanceDiff; // distance wins if >500m apart
      return b.priorityScore - a.priorityScore;             // else higher tier wins
    });

    this.logger.log(
      `Found ${eligible.length} eligible drivers for ${deliveryTypeName} order at (${pickupLat}, ${pickupLng})`,
    );

    return eligible;
  }

  /**
   * STEP B: Start the popup chain for an order
   * Called right after placeOrder() succeeds
   */
  async startPopupChain(
    orderId: number,
    pickupLat: number,
    pickupLng: number,
    deliveryTypeName: string,
    radiusKm: number,
  ): Promise<void> {
    // Check if already accepted (safety guard)
    const alreadyAccepted = await this.isOrderAccepted(orderId);
    if (alreadyAccepted) return;

    // Find eligible drivers sorted nearest first
    const eligibleDrivers = await this.findEligibleDrivers(
      pickupLat,
      pickupLng,
      deliveryTypeName,
      radiusKm,
    );
    if (eligibleDrivers.length === 0) {
      this.logger.warn(`No eligible drivers for order ${orderId} — going to public queue`);
      await this.moveToPublicQueue(orderId);
      return;
    }

    // Store driver queue in Redis as JSON list
    await connection.set(
      POPUP_QUEUE_KEY(orderId),
      JSON.stringify(eligibleDrivers),
      'EX',
      60 * 10, // expire after 10 min safety TTL
    );

    // Popup first driver immediately
    await this.popupNextDriver(orderId);
  }

  /**
   * Popup the next driver in the queue
   * Called: on start, on decline, on timeout
   */
  async popupNextDriver(orderId: number): Promise<void> {
    // If already accepted by someone, stop chain
    const alreadyAccepted = await this.isOrderAccepted(orderId);
    if (alreadyAccepted) return;

    // Get remaining queue from Redis
    const raw = await connection.get(POPUP_QUEUE_KEY(orderId));
    if (!raw) {
      this.logger.warn(`Popup queue empty or expired for order ${orderId}`);
      await this.moveToPublicQueue(orderId);
      return;
    }

    const queue: EligibleDriver[] = JSON.parse(raw);

    if (queue.length === 0) {
      this.logger.log(`All drivers exhausted for order ${orderId} — moving to public queue`);
      await this.moveToPublicQueue(orderId);
      return;
    }

    // Take first driver from queue
    const driver = queue.shift()!;

    // Save remaining queue back
    await connection.set(
      POPUP_QUEUE_KEY(orderId),
      JSON.stringify(queue),
      'EX',
      60 * 10,
    );

    // Mark this driver as currently pending for this order
    await connection.set(
      POPUP_ACTIVE_KEY(orderId),
      String(driver.raiderId),
      'EX',
      POPUP_TIMEOUT_SEC + 5, // slight buffer over timeout
    );

    // Fetch order details to send with popup
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderStops: {
          include: { destination: true, payment: true },
          orderBy: { sequence: 'asc' },
        },
        delivery_type: true,
        vehicle: true,
      },
    });

    if (!order) return;

    // Emit popup to driver via existing gateway room system
    this.raiderGateway.server
      .to(`rider_${driver.raiderId}`)
      .emit('rider:order_popup', {
        orderId,
        timeoutSeconds: POPUP_TIMEOUT_SEC,
        distanceKm: Number(driver.distanceKm.toFixed(2)),
        order: {
          id: order.id,
          totalCost: Number(order.total_cost),
          totalDistance: Number(order.total_distance),
          deliveryType: order.delivery_type?.name,
          vehicleType: order.vehicle?.vehicle_type,
          routeType: order.route_type,
          stops: order.orderStops.map((s) => ({
            type: s.type,
            address: s.address,
            latitude: s.latitude,
            longitude: s.longitude,
          })),
        },
        message: `New order available! You have ${POPUP_TIMEOUT_SEC} seconds to accept.`,
      });

    this.logger.log(
      `Popup sent to rider_${driver.raiderId} for order ${orderId} | ` +
      `distance: ${driver.distanceKm.toFixed(2)}km | tier: ${driver.tierCode}`,
    );

    // Schedule timeout job — if driver doesn't respond, move to next
    await autoPopupQueue.add(
      'popup-timeout',
      { orderId, raiderId: driver.raiderId },
      {
        delay: POPUP_TIMEOUT_SEC * 1000,
        jobId: `popup-timeout:${orderId}:${driver.raiderId}`, // prevent duplicates
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  /**
   * STEP C (partial): Driver accepted — lock order, cancel timeout
   */
  async handleDriverAccepted(orderId: number, raiderId: number): Promise<void> {

    // Check this driver is the one currently being shown the popup
    const activeRaider = await connection.get(POPUP_ACTIVE_KEY(orderId));
    if (!activeRaider || Number(activeRaider) !== raiderId) {
      this.logger.warn(
        `Rider ${raiderId} tried to accept order ${orderId} but is not the active popup driver`,
      );
      throw new Error('Popup already expired or assigned to another driver');
    }

    // Mark order as accepted in Redis — stops chain for any parallel calls
    await connection.set(
      POPUP_ACCEPTED_KEY(orderId),
      String(raiderId),
      'EX',
      60 * 60, // 1 hour TTL
    );

    // Clean up queue and active keys
    await connection.del(POPUP_QUEUE_KEY(orderId));
    await connection.del(POPUP_ACTIVE_KEY(orderId));

    // Remove pending timeout job from BullMQ
    const timeoutJob = await autoPopupQueue.getJob(
      `popup-timeout:${orderId}:${raiderId}`,
    );
    if (timeoutJob) await timeoutJob.remove();

    // Assign rider to order in DB
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        assign_rider_id: raiderId,
        order_status: OrderStatus.ONGOING,
        raider_confirmation: true,
        assign_at:new Date(),
      },
    });

    // Notify driver of confirmed assignment
    this.raiderGateway.server
      .to(`rider_${raiderId}`)
      .emit('rider:order_accepted_confirmed', {
        orderId,
        message: '✅ Order locked! Navigate to pickup.',
      });

    this.logger.log(`Order ${orderId} accepted and locked by rider ${raiderId}`);
  }

  /**
   * STEP C (partial): Driver declined — move to next in queue
   */
  async handleDriverDeclined(orderId: number, raiderId: number): Promise<void> {
    const activeRaider = await connection.get(POPUP_ACTIVE_KEY(orderId));

    // Only process if this is the currently active driver
    if (!activeRaider || Number(activeRaider) !== raiderId) return;

    // Remove timeout job since driver already responded
    const timeoutJob = await autoPopupQueue.getJob(
      `popup-timeout:${orderId}:${raiderId}`,
    );
    if (timeoutJob) await timeoutJob.remove();

    // Log decline in DB
    await this.prisma.orderDecline.create({
      data: { orderId, raiderId },
    });

    this.logger.log(`Rider ${raiderId} declined order ${orderId} — moving to next driver`);

    // Popup next driver in chain
    await this.popupNextDriver(orderId);
  }

  /**
   * Called by BullMQ worker when timeout fires
   */
  async handlePopupTimeout(orderId: number, raiderId: number): Promise<void> {
    const alreadyAccepted = await this.isOrderAccepted(orderId);
    if (alreadyAccepted) return;

    const activeRaider = await connection.get(POPUP_ACTIVE_KEY(orderId));
    if (!activeRaider || Number(activeRaider) !== raiderId) return;

    // Log timeout as decline
    // await this.prisma.orderDecline.create({
    //   data: { orderId, raiderId },
    // }).catch(() => {}); // non-blocking

    this.logger.log(`Rider ${raiderId} timed out on order ${orderId} — moving to next driver`);

    await this.popupNextDriver(orderId);
  }

  /**
   * Move order to public queue — any nearby driver can manually accept
   */
  private async moveToPublicQueue(orderId: number): Promise<void> {
     await this.prisma.order.update({
        where: { id: orderId },
        data: { order_status: OrderStatus.PENDING }, // already PENDING from placeOrder
     });

    // Broadcast to all online drivers in the zone
    this.raiderGateway.server.emit('rider:public_order_available', {
      orderId,
      message: 'New order available in public queue',
    });

    this.logger.log(`Order ${orderId} moved to public queue`);
  }

  private async isOrderAccepted(orderId: number): Promise<boolean> {
    const val = await connection.get(POPUP_ACCEPTED_KEY(orderId));
    return !!val;
  }

}