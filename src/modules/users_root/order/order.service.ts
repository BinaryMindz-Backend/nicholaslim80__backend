/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Parser } from 'json2csv';
import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { DeliveryZone, DestinationInput, IUser, Receiver } from 'src/types';
import { CollectTime, DeliveryTypeName, Destination, DestinationType, OrderConfirmationRatioType, OrderStatus, PaymentStatus, PaymentType, PayType, RaiderVerification, RouteType, TransactionStatus, TransactionType } from '@prisma/client';
import { OrderFilterDto } from './dto/order-filter.dto';
import { UpdateOrderStatusDto, UpdatePendingOrdersDto } from './dto/updateOrderStatusDto';
import { TransactionIdService } from 'src/common/services/transaction-id.service';
import { RedisService } from 'src/modules/auth/redis/redis.service';
import { competitionQueue } from 'src/core/queues/competition.queue';
import axios from 'axios';
import { CreateIndiOrderDto } from './dto/create_indivitual_order_dto';
import { BulkOrderWithDestinationsDto } from './dto/bulk-order-dto';
import { ServiceZoneService } from 'src/modules/superadmin_root/service-zone/service-zone.service';
import { GeoService } from 'src/utils/geo-location.utils';
import { PaginationDto } from 'src/utils/dto/pagination.dto';
import { EmailQueueService } from 'src/modules/queue/services/email-queue.service';
import { WalletService } from 'src/common/wallet/wallet.service';
import csvParser from 'csv-parser';
import { getReceiversWithPrice } from 'src/modules/dynamic_pricing/getReceiversWithPrice';


@Injectable()
export class OrderService {
  constructor(
     private prisma: PrismaService,
     private txIdService:TransactionIdService,
     private redisService: RedisService,
     private readonly serviceZone: ServiceZoneService,
     private readonly geoServices:GeoService,
     private readonly emailQueueService:EmailQueueService,
     private readonly walletService:WalletService

  ) {}
    
    // create 
    async create(dto: CreateOrderDto, user: IUser) {
    if (!user) throw new NotFoundException('Authenticated user not found');

    const isUserExist = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!isUserExist) throw new UnauthorizedException('Unauthorized');

    const res = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          ...dto,
          userId: user.id,
          total_cost: 0,
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
    // update destination
    async upsertDestinationAndRecalculate(
      orderId: number,
      destinationId: number,
      user: IUser,
    ) {
      if (!orderId) throw new NotFoundException('Order ID is required');
      if (!destinationId) throw new NotFoundException('Destination ID is required');

      // Fetch order
      const order = await this.prisma.order.findUnique({
        where: { id: orderId, order_status: OrderStatus.PROGRESS },
        include: { destinations: true },
      });
      if (!order) throw new NotFoundException('Order not found');
      if (order.userId !== user.id) throw new BadRequestException('Unauthorized');

      // Fetch the destination
      const destination = await this.prisma.destination.findUnique({
        where: { id: destinationId },
      });
      if (!destination) throw new NotFoundException('Destination not found');

      // Connect the destination to the order if not already
      if (!order.destinations.some(d => d.id === destinationId)) {
        await this.prisma.destination.update({
          where: { id: destinationId },
          data: { order_id: orderId },
        });
      }

      // Fetch sender
      const senderDest = await this.prisma.destination.findFirst({
        where: {
          OR: [
            { order_id: orderId, type: DestinationType.SENDER },
            { user_id: user.id, type: DestinationType.SENDER },
          ],
        },
      });

      const sender: Receiver | null = senderDest
        ? { lat: senderDest.latitude!, lng: senderDest.longitude! }
        : null;

      if (!sender) {
        // No sender yet, price remains 0
        return { order, updatedDestination: destination, totalCost: 0, totalFee: 0 };
      }

      // Determine service zone
      const zone = await this.serviceZone.findZoneByPoint(sender.lat, sender.lng);
      if (!zone) throw new BadRequestException('Sender address is outside service zone');

      // Collect all receiver destinations (exclude sender)
      const receiverDestinations = await this.prisma.destination.findMany({
        where: {
          order_id: orderId,
          type: DestinationType.RECEIVER,
        },
      });

      const receivers: Receiver[] = receiverDestinations
        .filter(d => !(d.latitude === sender.lat && d.longitude === sender.lng)) // exclude sender
        .map(d => ({ lat: d.latitude!, lng: d.longitude! }));

      let totalCost = 0;
      let totalFee = 0;

      if (receivers.length > 0) {
        // Calculate pricing based on **all current receivers**
        const pricingResults = await getReceiversWithPrice(
          this.prisma,
          sender,
          receivers,
          order.delivery_type,
          order.vehicle_type_id ?? 1,
          zone,
          {
          isRoundTrip: order.route_type == RouteType.ROUND ? true : false, 
          returnFactor: 0.5,        // optional (default 50%)
          }
        );
       // Take totalPrice / totalFee from the first receiver (same for all)
        totalCost = pricingResults[0]?.pricing.totalPrice ?? 0;
        totalFee = pricingResults[0]?.pricing.totalFee ?? 0;
      }

      // Update order totals
      const updatedOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          total_cost: totalCost,
          total_fee: totalFee,
          serviceZoneId: zone.id,
        },
      });

      return {
        order: updatedOrder,
        updatedDestination: destination,
        totalCost,
        totalFee,
      };
    }

    // **create indivitual
    async createOrder(payload: CreateIndiOrderDto, user: IUser) {
      // 
      const geocodedDestinations: DestinationInput[] = [];
      let orderServiceZoneId: number | null = null;
      let orderServiceZone: DeliveryZone | null = null;


      for (const d of payload.destinations) {
          let lat = d.latitude;
          let lng = d.longitude;
          let formattedAddress = d.addressFromApr;

          if (!lat || !lng) {
            const geo = await this.geoServices.getLatLngFromAddress(d.address ?? '');
            lat = geo.lat;
            lng = geo.lng;
            formattedAddress = geo.formattedAddress;

            console.log("geocoded ->", lat, lng, formattedAddress); // <-- log after assignment
          }

        const zone = await this.serviceZone.findZoneByPoint(lat, lng);
        // Assign order service zone from SENDER destination
        if (
          d.type === DestinationType.SENDER &&
          zone &&
          !orderServiceZone
        ) {
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
          // service_zoneId: zone?.id ?? null,
          addressFromApr: formattedAddress,
        });
      }

      if (!orderServiceZone) {
        throw new Error('Pickup location is outside service zone');
      }
        // geocodedDestinations.find(d => d.type === DestinationType.SENDER)!.latitude!,
        // geocodedDestinations.find(d => d.type === DestinationType.SENDER)!.longitude!,
      // sender destination
      const senderDestination = geocodedDestinations.find(
          d => d.type === DestinationType.SENDER,
        );

        if (!senderDestination?.latitude || !senderDestination?.longitude) {
          throw new BadRequestException('Sender location not found');
        }

        const sender: Receiver = {
          lat: senderDestination.latitude,
          lng: senderDestination.longitude,
        };

      // Collect all receivers (exclude SENDER if you want sender → receiver)
      const receiverDestinations: Receiver[] = geocodedDestinations
        .filter(d => d.type !== DestinationType.SENDER)
        .map(d => ({ lat: d.latitude!, lng: d.longitude! }));
      // 
      const receiversWithPrice = await getReceiversWithPrice(
        this.prisma,
        sender,
        receiverDestinations,
        payload.delivery_type,  
        payload.vehicle_type_id,
        orderServiceZone,
        {
          isRoundTrip: payload.route_type == RouteType.ROUND ? true : false,        // ✅ enable round trip
          returnFactor: 0.5,        // optional (default 50%)
        }
      );

       // Calculate total cost for the order
       const totalCost = receiversWithPrice.reduce(
                (sum, r) => sum + r.pricing.totalPrice,
                0
              );

       const totalFee = receiversWithPrice.reduce(
                (sum, r) => sum + r.pricing.totalFee,
                0
              );
       
      const res = await this.prisma.$transaction(async (tx) => {
        // Create order WITH service zone
        const order = await tx.order.create({
          data: {                                                               
            serviceZoneId:Number(orderServiceZoneId),
            userId: user.id,
            route_type: payload.route_type,
            delivery_type: payload.delivery_type,
            // pay_type: payload.pay_type,
            collect_time: payload.collect_time,
            scheduled_time:payload.scheduled_time,
            vehicle_type_id: payload.vehicle_type_id,
            payment_method_id: payload.payment_method_id,
            total_cost: isNaN(Number(totalCost)) ? 0 : parseFloat(Number(totalCost).toFixed(3)),
            total_fee:totalFee,
            isFixed: payload.isFixed,                                       
            order_status:OrderStatus.PROGRESS,
          },
        });

        const createdDestinations: Destination[] = [];

        for (const d of geocodedDestinations) {
          const dest = await tx.destination.create({
            data: {
              order_id: order.id,
              user_id: user.id,
              address: d.address,
              addressFromApr: d.addressFromApr ?? null,
              floor_unit: d.floor_unit ?? null,
              contact_name: d.contact_name ?? null,
              contact_number: d.contact_number ?? null,
              note_to_driver: d.note_to_driver ?? null,
              is_saved: d.is_saved,
              type: d.type,
              latitude: d.latitude!,
              longitude: d.longitude!,
              accuracy: d.accuracy ?? null,
              // service_zoneId: d.service_zoneId,
            },
          });

          createdDestinations.push(dest);
        }

        const txId = this.txIdService.generate();
        const transaction = await tx.transaction.create({
          data: {
            transaction_code: txId,
            payment_status: PaymentStatus.UNPAID,
            payment_method_id: payload.payment_method_id,
            type: TransactionType.BOOK_ORDER,
            delivery_fee: order.total_cost,
            total_fee: order.total_cost,
            userId: user.id,
            pay_type: order.pay_type,
            orderId: order.id,
          },
          include: {
            user: { select: { username: true } },
            order: { select: { id: true, order_status: true } },
          },
        });

        return { order, transaction, destinations: createdDestinations };
      });

      return res;
    }
   
    // export order
    async exportOrdersAsCsv() {
      const orders = await this.prisma.order.findMany({
        // 
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
          destinations: true,
        },
        orderBy: { created_at: 'desc' },
      });

      const formatted_orders = orders.map((order) => {
        const sender = order.destinations.find(d => d.type === 'SENDER');
        const receiver = order.destinations.find(d => d.type === 'RECEIVER');

        return {
          order_id: order.id,
          user_id: order.userId,
          user_name: order.user?.username ?? '',
          user_phone: order.user?.phone ?? '',

          route_type: order.route_type,
          delivery_type: order.delivery_type,
          pay_type: order.pay_type,
          collect_time: order.collect_time,

          vehicle_type: order.vehicle?.vehicle_type ?? '',
          total_cost: order.total_cost,

          order_status: order.order_status,
          is_fixed: order.isFixed,
          raider_confirmation: order.raider_confirmation,

          pick_up_items: JSON.stringify(order.pick_up_items),

          sender_address: sender?.address ?? '',
          sender_contact_name: sender?.contact_name ?? '',
          sender_contact_number: sender?.contact_number ?? '',
          sender_latitude: sender?.latitude ?? '',
          sender_longitude: sender?.longitude ?? '',

          receiver_address: receiver?.address ?? '',
          receiver_contact_name: receiver?.contact_name ?? '',
          receiver_contact_number: receiver?.contact_number ?? '',
          receiver_latitude: receiver?.latitude ?? '',
          receiver_longitude: receiver?.longitude ?? '',

          created_at: order.created_at,
          updated_at: order.updated_at,
        };
      });

      const fields = [
        { label: 'order_id', value: 'order_id' },
        { label: 'user_id', value: 'user_id' },
        { label: 'user_name', value: 'user_name' },
        { label: 'user_phone', value: 'user_phone' },

        { label: 'route_type', value: 'route_type' },
        { label: 'delivery_type', value: 'delivery_type' },
        { label: 'pay_type', value: 'pay_type' },
        { label: 'collect_time', value: 'collect_time' },

        { label: 'vehicle_type', value: 'vehicle_type' },
        { label: 'total_cost', value: 'total_cost' },

        { label: 'order_status', value: 'order_status' },
        { label: 'is_fixed', value: 'is_fixed' },
        { label: 'raider_confirmation', value: 'raider_confirmation' },

        { label: 'pick_up_items', value: 'pick_up_items' },

        { label: 'sender_address', value: 'sender_address' },
        { label: 'sender_contact_name', value: 'sender_contact_name' },
        { label: 'sender_contact_number', value: 'sender_contact_number' },
        { label: 'sender_latitude', value: 'sender_latitude' },
        { label: 'sender_longitude', value: 'sender_longitude' },

        { label: 'receiver_address', value: 'receiver_address' },
        { label: 'receiver_contact_name', value: 'receiver_contact_name' },
        { label: 'receiver_contact_number', value: 'receiver_contact_number' },
        { label: 'receiver_latitude', value: 'receiver_latitude' },
        { label: 'receiver_longitude', value: 'receiver_longitude' },

        { label: 'created_at', value: 'created_at' },
        { label: 'updated_at', value: 'updated_at' },
      ];

      const parser = new Parser({ fields });
      return parser.parse(formatted_orders);
    }

    // create bulk order
    // async bulkCreateOrdersFromCsv(dto: BulkOrderWithDestinationsDto, userId: number) {
    //   if (!dto?.fileUrl.startsWith(process.env.BASE_URL!)) {
    //     throw new BadRequestException('Invalid file source');
    //   }

    //   const response = await axios.get(dto.fileUrl, { responseType: 'stream' });
    //   const skippedRows: any[] = [];
    //   const ordersToInsert: any[] = [];
    //   const destinationsToInsert: any[] = [];

    //   const processRow = async (row: any) => {
    //     try {
    //       if (!row.delivery_type || !row.sender_address) {
    //         skippedRows.push({ row, reason: 'Missing delivery_type or sender_address' });
    //         return;
    //       }

    //       // Validate delivery_type
    //       const deliveryTypeEnum = row.delivery_type as DeliveryTypeName;
    //       const deliveryTypeExists = await this.prisma.deliveryType.findFirst({
    //         where: { name: deliveryTypeEnum, is_active: true },
    //       });
    //       if (!deliveryTypeExists) {
    //         skippedRows.push({ row, reason: `Invalid delivery_type: ${row.delivery_type}` });
    //         return;
    //       }
          
    //       // Sender coordinates
    //       const senderAdd = row.sender_address ? row.sender_address : dto.destinations?.find(d => d.type === DestinationType.SENDER);
    //        let senderLat;
    //        let senderLng;
    //       if (!senderAdd) {
    //         const dtoSender = dto.destinations?.find(d => d.type === DestinationType.SENDER);
    //         const geo = await this.geoServices.getLatLngFromAddress(row.sender_address ? row.sender_address:dtoSender?.address);
    //         if (!geo) {
    //           skippedRows.push({ row, reason: 'Cannot geocode sender address' });
    //           return;
    //         }
    //         senderLat = geo.lat;
    //         senderLng = geo.lng;
    //       }

    //       // --- Service Zone ---
    //       const zone = await this.serviceZone.findZoneByPoint(senderLat , senderLng!);
    //       if (!zone) {
    //         skippedRows.push({ row, reason: 'Sender is outside service zone' });
    //         return;
    //       }
             
    //       const sender: Receiver = {
    //         lat: senderLat,
    //         lng: senderLng,
    //       };
    //       // Receiver coordinates
    //       const dtoReciver = dto.destinations?.find(d => d.type === DestinationType.RECEIVER)!.address;
    //       let receiverLat ;
    //       let receiverLng ;

    //       if (!receiverLat || !receiverLng) {
    //         const geo = await this.geoServices.getLatLngFromAddress(row.receiver_address ? row.receiver_address :dtoReciver);
    //         if (!geo) {
    //           skippedRows.push({ row, reason: 'Cannot geocode receiver address' });
    //           return;
    //         }
    //         receiverLat = geo.lat;
    //         receiverLng = geo.lng;
    //       }

    //       // Calculate price
    //       const receiversWithPrice = await getReceiversWithPrice(
    //         this.prisma,
    //         sender,  
    //         [{ lat: receiverLat!, lng: receiverLng! }],
    //         deliveryTypeEnum,
    //         row.vehicle_type_id ? Number(row.vehicle_type_id) : 1,
    //         zone,
    //         {
    //           isRoundTrip: row.route_type == RouteType.ROUND ? true : false,        // ✅ enable round trip
    //           returnFactor: 0.5,        // optional (default 50%)
    //         }
    //       );
    //       const totalCost = receiversWithPrice.reduce(
    //             (sum, r) => sum + r.pricing.totalPrice,
    //             0
    //           );

    //       const totalFee = receiversWithPrice.reduce(
    //             (sum, r) => sum + r.pricing.totalFee,
    //             0
    //           );


    //       // Build sender & receiver destination
    //       const senderDest = {
    //         user_id: userId,
    //         type: DestinationType.SENDER,
    //         latitude: senderLat,
    //         longitude: senderLng,
    //         address: row.sender_address,
    //         contact_name: row.sender_contact_name || null,
    //         contact_number: row.sender_contact_number || null,
    //         floor_unit: row.sender_floor_unit || null,
    //         note_to_driver: row.sender_note_to_driver || null,
    //         is_saved: false,
    //         accuracy: row.sender_accuracy ? Number(row.sender_accuracy) : null,
    //       };
    //       const receiverDest = {
    //         user_id: userId,
    //         type: DestinationType.RECEIVER,
    //         latitude: receiverLat,
    //         longitude: receiverLng,
    //         address: row.receiver_address,
    //         contact_name: row.receiver_contact_name || null,
    //         contact_number: row.receiver_contact_number || null,
    //         floor_unit: row.receiver_floor_unit || null,
    //         note_to_driver: row.receiver_note_to_driver || null,
    //         is_saved: false,
    //         accuracy: row.receiver_accuracy ? Number(row.receiver_accuracy) : null,
    //       };

    //       // Build order
    //       ordersToInsert.push({
    //         userId,
    //         route_type: row.route_type,
    //         delivery_type: deliveryTypeEnum,
    //         serviceZoneId: zone.id,
    //         isBulk: true,
    //         collect_time: row.collect_time,
    //         vehicle_type_id: row.vehicle_type_id ? Number(row.vehicle_type_id) : null,
    //         payment_method_id: row.payment_method_id ? Number(row.payment_method_id) : null,
    //         total_cost: totalCost,
    //         total_fee: totalFee,
    //         order_status: row.order_status ?? OrderStatus.PROGRESS,
    //         isFixed: row.is_fixed === 'true',
    //         raider_confirmation: row.raider_confirmation === 'true',
    //       });

    //       destinationsToInsert.push({ sender: senderDest, receiver: receiverDest, pricing: receiversWithPrice });

    //     } catch (err: any) {
    //       skippedRows.push({ row, reason: err.message });
    //     }
    //   };

    //   // Stream CSV safely
    //   const stream = response.data.pipe(csvParser());
    //   for await (const row of stream) {
    //     await processRow(row);
    //   }

    //   // Insert orders and destinations
    //   const createdOrders = await this.prisma.$transaction(
    //     ordersToInsert.map(order => this.prisma.order.create({ data: order })),
    //   );
    //     // 
    //   for (let i = 0; i < createdOrders.length; i++) {
    //     const order = createdOrders[i];
    //     const dest = destinationsToInsert[i];
    //     await this.prisma.destination.createMany({
    //       data: [
    //         { order_id: order.id, ...dest.sender },
    //         { order_id: order.id, ...dest.receiver },
    //       ],
    //     });
    //   }

    //   return {
    //     total_uploaded: ordersToInsert.length + skippedRows.length,
    //     success: createdOrders.length,
    //     skipped: skippedRows,
    //     message: 'Bulk orders processed successfully',
    //   };
    // }
     async bulkCreateOrdersFromCsv(
  dto: BulkOrderWithDestinationsDto,
  userId: number,
) {
  if (!dto?.fileUrl.startsWith(process.env.BASE_URL!)) {
    throw new BadRequestException('Invalid file source');
  }

  const response = await axios.get(dto.fileUrl, { responseType: 'stream' });

  const skippedRows: any[] = [];
  const ordersToInsert: any[] = [];
  const destinationsToInsert: any[] = [];

  const processRow = async (row: any) => {
    try {
      /* -------------------- Validate delivery type -------------------- */
      if (!row.delivery_type || !row.sender_address || !row.receiver_address) {
        skippedRows.push({ row, reason: 'Missing required fields' });
        return;
      }
     console.log(row);
      const deliveryTypeEnum = row.delivery_type as DeliveryTypeName;

      const deliveryTypeExists = await this.prisma.deliveryType.findFirst({
        where: { name: deliveryTypeEnum, is_active: true },
      });

      if (!deliveryTypeExists) {
        skippedRows.push({ row, reason: `Invalid delivery_type: ${row.delivery_type}` });
        return;
      }
       const vehicle = await this.prisma.vehicleType.findFirst({
                  where: {
                  vehicle_type: row.vehicle_type
                    
                  },
                });

            if (!vehicle) {
              skippedRows.push({
                row,
                reason: `Invalid vehicle_type: ${row.vehicle_type}`,
              });
              return;
            }


         //  Resolve sender address (CSV → DTO fallback)
          const csvSenderAddress = row.sender_address?.trim();
          const dtoSenderAddress = dto.destinations?.find(
            d => d.type === DestinationType.SENDER,
          )?.address;

          const senderAddress = csvSenderAddress || dtoSenderAddress;

          if (!senderAddress) {
            skippedRows.push({
              row,
              reason: 'Sender address missing in both CSV and DTO',
            });
            return;
          }



          // Geocode sender
          const senderGeo = await this.geoServices.getLatLngFromAddress(senderAddress);

          if (!senderGeo) {
            skippedRows.push({
              row,
              reason: 'Cannot geocode sender address',
            });
            return;
          }

          const sender: Receiver = {
            lat: senderGeo.lat,
            lng: senderGeo.lng,
          };


      /* -------------------- Service zone -------------------- */
        const zone = await this.serviceZone.findZoneByPoint(sender.lat, sender.lng);
        if (!zone) {
          skippedRows.push({
            row,
            reason: 'Sender outside service zone',
          });
          return;
        }


      /* -------------------- Geocode receiver -------------------- */
      const receiverGeo = await this.geoServices.getLatLngFromAddress(
        row.receiver_address,
      );

      if (!receiverGeo) {
        skippedRows.push({ row, reason: 'Cannot geocode receiver address' });
        return;
      }

      const receivers: Receiver[] = [
        { lat: receiverGeo.lat, lng: receiverGeo.lng },
      ];

      /* -------------------- Price calculation (ONCE) -------------------- */
      const pricingResults = await getReceiversWithPrice(
        this.prisma,
        sender,
        receivers,
        deliveryTypeEnum,
        row.vehicle_type ? Number(vehicle.id) : 1,
        zone,
        {
          isRoundTrip: row.route_type === RouteType.ROUND,
          returnFactor: 0.5,
        },
      );

      // IMPORTANT: pricing is order-level → take once
      const totalCost = pricingResults[0]?.pricing.totalPrice ?? 0;
      const totalFee = pricingResults[0]?.pricing.totalFee ?? 0;

      /* -------------------- Build destinations -------------------- */
      const senderDest = {
        user_id: userId,
        type: DestinationType.SENDER,
        latitude: sender.lat,
        longitude: sender.lng,
        address: row.sender_address,
        contact_name: row.sender_contact_name || null,
        contact_number: row.sender_contact_number || null,
        floor_unit: row.sender_floor_unit || null,
        note_to_driver: row.sender_note_to_driver || null,
        is_saved: false,
        accuracy: row.sender_accuracy ? Number(row.sender_accuracy) : null,
      };

      const receiverDest = {
        user_id: userId,
        type: DestinationType.RECEIVER,
        latitude: receiverGeo.lat,
        longitude: receiverGeo.lng,
        address: row.receiver_address,
        contact_name: row.receiver_contact_name || null,
        contact_number: row.receiver_contact_number || null,
        floor_unit: row.receiver_floor_unit || null,
        note_to_driver: row.receiver_note_to_driver || null,
        is_saved: false,
        accuracy: row.receiver_accuracy ? Number(row.receiver_accuracy) : null,
      };

      /* -------------------- Build order -------------------- */
      ordersToInsert.push({
        userId,
        route_type: row.route_type,
        delivery_type: deliveryTypeEnum,
        serviceZoneId: zone.id,
        isBulk: true,
        collect_time: row.collect_time,
        vehicle_type_id: row.vehicle_type_id
          ? Number(row.vehicle_type_id)
          : null,
        payment_method_id: row.payment_method_id
          ? Number(row.payment_method_id)
          : null,
        total_cost: totalCost,
        total_fee: totalFee,
        order_status: row.order_status ?? OrderStatus.PROGRESS,
        isFixed: row.is_fixed === 'true',
        raider_confirmation: row.raider_confirmation === 'true',
      });

      destinationsToInsert.push({
        sender: senderDest,
        receiver: receiverDest,
      });
    } catch (err: any) {
      skippedRows.push({ row, reason: err.message });
    }
  };

  /* -------------------- Stream CSV safely -------------------- */
  const stream = response.data.pipe(csvParser());
  for await (const row of stream) {
    await processRow(row);
  }

  /* -------------------- Insert orders -------------------- */
  const createdOrders = await this.prisma.$transaction(
    ordersToInsert.map(order =>
      this.prisma.order.create({ data: order }),
    ),
  );

  /* -------------------- Insert destinations -------------------- */
  for (let i = 0; i < createdOrders.length; i++) {
    const order = createdOrders[i];
    const dest = destinationsToInsert[i];

    await this.prisma.destination.createMany({
      data: [
        { order_id: order.id, ...dest.sender },
        { order_id: order.id, ...dest.receiver },
      ],
    });
  }

  return {
    total_uploaded: ordersToInsert.length + skippedRows.length,
    success: createdOrders.length,
    skipped: skippedRows,
    message: 'Bulk orders processed successfully',
  };
}

    // find mine
   async findMine(
      userId: number,
      page: number = 1,
      limit: number = 20,
   ) {
    // 
    const skip = (page - 1) * limit;
    // 
   const [orders, total] = await this.prisma.$transaction([
        this.prisma.order.findMany({
          where: { userId },
          orderBy: { created_at: 'desc' },
          include: { user: true , transactions:true},
          skip,
          take: limit,
          
        }),
        
        this.prisma.order.count({
          where: { userId },
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


    // find raider order
    async findRaiderMine(
      userId: number,
      page: number = 1,
      limit: number = 20,
      status?: OrderStatus,
    ) {
      const skip = (page - 1) * limit;
      const raider = await this.prisma.raider.findFirst({
           where:{userId:userId}
      })
      // console.log(raider);
      const [orders, total] = await this.prisma.$transaction([
        this.prisma.order.findMany({
          where: {
            assign_rider_id:raider?.id,
            ...(status && { order_status:status }), // filter if status provided
          },
          orderBy: { created_at: 'desc' },
          include: { user: true, transactions: true },
          skip,
          take: limit,
        }),
        this.prisma.order.count({
          where: {
            assign_rider_id:raider?.id,
            ...(status && { order_status:status }),
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
        filterDto:OrderFilterDto
      ) {

       const page = filterDto.page ?? 1;
       const limit = filterDto.limit ?? 10;
        

        const skip = (page - 1) * limit;

        const where = {
              order_status:filterDto.status,
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
            collect_time:true,
            scheduled_time:true,
            has_additional_services: true,
            is_promo_used: true,
            notify_favorite_raider: true,
            payment_method_id: true,
            assign_rider_id: true,
            raider_confirmation: true,
            is_reviewed: true,
            is_placed: true,
            is_pickup: true,
            isBulk:true,
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
            destinations:{
                select:{
                   address:true
                }
            }
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
   async findAllBulk(dto:PaginationDto , user:IUser) {
      const {
        page = 1,
        limit = 20,
      } = dto;

    
      const skip = (page - 1) * limit;

      const [orders,  totalOrderIds,total, totalOrderCost] = await this.prisma.$transaction([
            this.prisma.order.findMany({
              where:{
                userId:user.id,
                isBulk:true,
                order_status:OrderStatus.PROGRESS
              },
              select: {
                id: true,
                userId: true,
                route_type: true,
                delivery_type: true,
                pay_type: true,
                vehicle_type_id: true,
                total_cost: true,
                collect_time:true,
                scheduled_time:true,
                has_additional_services: true,
                is_promo_used: true,
                notify_favorite_raider: true,
                payment_method_id: true,
                assign_rider_id: true,
                raider_confirmation: true,
                is_reviewed: true,
                is_placed: true,
                is_pickup: true,
                isBulk:true,
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
                destinations:true
              },
              orderBy: { created_at: 'desc' },
              skip,
              take: limit,
            }),
             //  
              this.prisma.order.findMany({
              where:{
                userId:user.id,
                isBulk:true,
                order_status:OrderStatus.PROGRESS
              },
              select: {
                id: true,
                userId: true
              },
              orderBy: { created_at: 'desc' },
            }),
 
            // 
            this.prisma.order.count({ where:{
              userId:user.id,
              isBulk:true,
              order_status:OrderStatus.PROGRESS
            }  }),

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
        totalCost:totalOrderCost,
        totalOrderIds,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }

      // 
    async findOne(id: number) {
        const order = await this.prisma.order.findUnique({
          where: { id },
          include: {
            user: true,
            vehicle: true,
            payment_method: true,
            destinations: true,
          },
        });

        if (!order) throw new NotFoundException('Order not found');

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
            id:orderId,
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
            where: { id:orderId },
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

  
  // mark bulk order as pending
   async markOrdersAsPending(
        userId: number,
        dto: UpdatePendingOrdersDto,
      ) {
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

        if (!user) {
          throw new NotFoundException('User not found');
        }

        /* ---------------- VALIDATE ORDERS ---------------- */
        const orders = await this.prisma.order.findMany({
          where: {
            id: { in: orderIds },
            userId,
            isBulk: true,
            order_status: OrderStatus.PROGRESS,
          },
          select: {
            id: true,
            order_status: true,
            total_cost: true,
          },
        });

        if (orders.length !== orderIds.length) {
          const foundIds = orders.map(o => o.id);
          const missing = orderIds.filter(id => !foundIds.includes(id));
          throw new NotFoundException(`Orders not found or invalid: ${missing.join(', ')}`);
        }

        const totalAmount = orders.reduce(
          (sum, o) => sum + Number(o.total_cost),
          0,
        );

        /* ---------------- TRANSACTION ---------------- */
        const result = await this.prisma.$transaction(async (tx) => {
          /* ---------------- PAYMENT ---------------- */
          if (dto.payType === PaymentType.PAYMENT) {
            // ONLINE PAYMENT
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

              if (!paid) {
                throw new BadRequestException('Online payment failed');
              }
            }

            // WALLET PAYMENT
            if (dto.paymentMethod === PayType.WALLET) {
              if (Number(user.currentWalletBalance) < totalAmount) {
                throw new BadRequestException('Insufficient wallet balance');
              }

              await tx.user.update({
                where: { id: userId },
                data: {
                  currentWalletBalance: {
                    decrement: totalAmount,
                  },
                },
              });
            }
          }

          /* ---------------- ORDER UPDATE ---------------- */
          const updateResult = await tx.order.updateMany({
            where: {
              id: { in: orderIds },
              userId,
              isBulk: true,
            },
            data: {
              order_status: OrderStatus.PENDING,
              is_placed: true,
              pay_type: dto.paymentMethod,
            },
          });

          if (updateResult.count !== orderIds.length) {
            throw new ConflictException('Some orders could not be updated');
          }

          /* ---------------- TRANSACTION UPDATE ---------------- */
          await tx.transaction.updateMany({
            where: { orderId: { in: orderIds } },
            data: {
              tx_status: TransactionStatus.COMPLETED,
            },
          });

          return {
            totalUpdated: updateResult.count,
            totalAmount,
          };
        });

        /* ---------------- NOTIFICATIONS (AFTER TX) ---------------- */
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
            orderId:"N/A",
            status: OrderStatus.PENDING,
            message: `Your ${result.totalUpdated} bulk orders are now Placed.`,
          });
        }

        return {
          success: true,
          totalOrders: result.totalUpdated,
          totalAmount: result.totalAmount,
        };
      }

  // order update for admin
  async update(id: number, dto: UpdateOrderDto) {
    await this.findOne(id); // ensures existence

    return this.prisma.order.update({
      where: { id },
      data: dto,
    });
  }
   

  // its permanently deleted by admin
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.order.delete({
      where: { id },
    });
  }

  
  // driver compitition algoridom (If you dont understand it then dont touch it)
  async driverCompitition(user:IUser, orderId: number) {
    console.log("form order compition--->", user, orderId);
     //  
     const raider = await this.prisma.raider.findFirst({
            where:{
                userId:user.id
            }
     })
    if(!raider){
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
      if(order.order_status !== OrderStatus.PENDING){
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
        if(shouldAutoConfirm){
              const res = await this.prisma.$transaction(async(tx)=>{
                     await tx.order.update({
                         where:{
                           id:order.id
                         },
                         data:{
                           raider_confirmation:true,
                           is_auto_confirmation:true
                         }
                     })
                     await tx.customer_order_confirmation_ratio_logs.create({
                        data:{
                            customer_id:user?.id,
                            raider_id:raider.id,
                            confirmation_ratio_type: OrderConfirmationRatioType.GENIUNE,
                            is_auto_confirm:true
                        }
                     })
              })
              return res;
        }
        else if (!shouldAutoConfirm && customerRating < 3){
             await this.prisma.customer_order_confirmation_ratio_logs.create({
                 data:{
                    customer_id:user?.id,
                    raider_id:raider?.id,
                    confirmation_ratio_type:OrderConfirmationRatioType.SUSPICIOUS,
                    is_auto_confirm:false
                    
                 }
             })  
        }
        else{
             await this.prisma.customer_order_confirmation_ratio_logs.create({
                 data:{
                    customer_id:user?.id,
                    raider_id:raider?.id,
                    confirmation_ratio_type:OrderConfirmationRatioType.MANUAL_CHECK,
                    is_auto_confirm:false
                    
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
           where:{
               id:riderId,
               raider_verificationFromAdmin:RaiderVerification.APPROVED
           }
      }) 
      // 
       if(!raider){
          throw new NotFoundException("Verified order not found")
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
          order_status:OrderStatus.ONGOING,
          competition_closed:true,
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
        where: { collect_time:CollectTime.SCHEDULED  },
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
          where:{
             userId
          }
      })

      const [orders, total] = await this.prisma.$transaction([
        this.prisma.order.findMany({
          where: {
            order_status: OrderStatus.PENDING,
            is_placed: true,

            // EXCLUDE declined orders for THIS raider only
            NOT: {
              declines: {
                some: {
                  raiderId:raider?.id,
                },
              },
            },
          },
          orderBy: { created_at: 'desc' },
          include: {
            user: true,
            vehicle: true,
            destinations: true,
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
                  raiderId:raider?.id,
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


  }
   

