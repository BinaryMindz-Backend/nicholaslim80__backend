/* eslint-disable @typescript-eslint/restrict-template-expressions */
// import { NotFoundException } from "@nestjs/common";
// import { DeliveryTypeName, FeeAppliesType, PrismaClient } from "@prisma/client";
// import axios from "axios";
// import { DeliveryZone } from "src/types";
// import { BadRequestException } from '@nestjs/common';
// import { isWithinInterval, parse } from "date-fns";


// const prisma = new PrismaClient();

// export interface Receiver {
//   lat: number;
//   lng: number;
// }
// const orderDate = new Date()
// export interface DistancePriceResult extends Receiver {
//   distanceKm: number;
//   durationMin: number;
//   price: number;
// }

// // --- Google Maps API call with caching ---
// const distanceCache = new Map<string, { distanceKm: number; durationMin: number }>();

// export async function getRoadDistancesGoogle(
//   senderLat: number,
//   senderLng: number,
//   receivers: Receiver[]
// ): Promise<{ distanceKm: number; durationMin: number }[]> {
//   if (!receivers.length) return [];

//   const uncachedReceivers = receivers.filter(r => 
//     !distanceCache.has(`${senderLat},${senderLng}-${r.lat},${r.lng}`)
//   );

//   let roadDistances: { distanceKm: number; durationMin: number }[] = [];

//   if (uncachedReceivers.length) {
//     // Google API: max 25 destinations per request
//     const chunks: Receiver[][] = [];
//     for (let i = 0; i < uncachedReceivers.length; i += 25) {
//       chunks.push(uncachedReceivers.slice(i, i + 25));
//     }

//     for (const chunk of chunks) {
//       const destinations = chunk.map(r => `${r.lat},${r.lng}`).join('|');

//       const res = await axios.get(
//         'https://maps.googleapis.com/maps/api/distancematrix/json',
//         {
//           params: {
//             origins: `${senderLat},${senderLng}`,
//             destinations,
//             mode: 'driving',
//             key: process.env.GOOGLE_MAPS_API_KEY,
//           },
//         }
//       );

//       res.data.rows[0].elements.forEach((el: any, idx: number) => {
//         const receiver = chunk[idx];
//         const distanceKm = el.distance.value / 1000;
//         const durationMin = el.duration.value / 60;
//         distanceCache.set(`${senderLat},${senderLng}-${receiver.lat},${receiver.lng}`, { distanceKm, durationMin });
//       });
//     }
//   }

//   // Retrieve from cache for all receivers
//   roadDistances = receivers.map(r => {
//     const cached = distanceCache.get(`${senderLat},${senderLng}-${r.lat},${r.lng}`);
//     return cached!;
//   });

//   return roadDistances;
// }

// // --- Price calculation ---

// export interface LatLng {
//   lat: number;
//   lng: number;
// }


// export type OrderType = 'STANDARD' | 'EXPRESS' | 'SCHEDULED' | 'STACKED';

// export interface Vehicle {
//   base_price: number;
//   per_km_price: number;
//   peak_pricing?: boolean;
// }

// export interface DeliveryType {
//   percentage: number;
// }

// export interface DynamicSurge {
//   condition: 'TIME_RANGE' | 'DAY_TYPE' | 'ORDER_AMOUNT_LESS_THAN' | 'ORDER_TYPE';
//   time_range: string; // HH:mm-HH:mm for TIME_RANGE, 'WEEKEND'/'HOLIDAY' for DAY_TYPE, amount for ORDER_AMOUNT, type for ORDER_TYPE
//   price_multiplier: number; // percent, e.g., 20 = +20%
// }

// // --- Main price calculation ---
// export async function calculateDeliveryPrice(
//   distanceKm: number,
//   vehicle: Vehicle,
//   deliveryType: DeliveryType,
//   zone: DeliveryZone,
// ): Promise<number> {
//   // --- 1. Base price calculation ---
//   let price = Number(vehicle.base_price) + Number(vehicle.per_km_price) * distanceKm;
//   price += (price * Number(deliveryType.percentage)) / 100;

//   // if (vehicle.peak_pricing) {
//   //   price *= 1.2; // peak hour multiplier
//   // }

//   // --- 2. Apply dynamic user/raider fees ---
//   function mapDeliveryTypeToFeeApplies(
//   deliveryType: DeliveryTypeName
// ): FeeAppliesType {
//   switch (deliveryType) {
//     case 'STANDARD':
//       return FeeAppliesType.STANDARD_ORDERS;
//     case 'EXPRESS':
//       return FeeAppliesType.EXPRESS_ORDERS;
//     case 'SCHEDULED':
//       return FeeAppliesType.SCHEDULED_ORDERS;
//     case 'STACKED':
//       return FeeAppliesType.STACKED_ORDERS;
//     default:
//       throw new Error(`Unsupported delivery type: ${deliveryType}`);
//   }
// }

// const appliesToEnum = mapDeliveryTypeToFeeApplies(deliveryTypeEnum);

//   const userFees = await prisma.userFeeStructure.findMany({
//     where: {
//       service_area: zone.zoneName,
//       OR: [
//         { applies_to: FeeAppliesType.ALL_ORDERS },
//         {
//           applies_to: FeeAppliesType.ORDER_LESS,
//           condition_value: { gte: price },
//         },
//         { applies_to: appliesToEnum },
//       ],
//     },
//   });


//   userFees.forEach(fee => {
//     price += fee.amount;
//   });

//   // --- 3. Apply zone delivery fee based on priority ---
//   switch (zone.priority) {
//     case 1:
//       if (price < zone.minOrderAmmount) {
//         throw new BadRequestException(
//           `Minimum order amount for zone "${zone.zoneName}" is ${zone.minOrderAmmount}`
//         );
//       }
//       price += zone.deliveryFee;
//       break;

//     case 2:
//       if (price < zone.minOrderAmmount) {
//         price += zone.deliveryFee;
//       }
//       break;

//     case 3:
//     default:
//       break;
//   }

//   // --4 Apply dynamic surges (peak hour, holiday, late night, etc.) ---
//   const dynamicSurges = await prisma.userDynamicSurge.findMany({
//     where: {
//       applicable_user: 'USER', // or USER
//     },
//   });

//   dynamicSurges.forEach(surge => {
//     switch (surge.condition) {
//       case 'HIGH_DEMAND': {
//         const [startTime, endTime] = surge.time_range.split('-');
//         const start = parse(startTime, 'HH:mm', orderDate);
//         const end = parse(endTime, 'HH:mm', orderDate);
//         if (isWithinInterval(orderDate, { start, end })) {
//           price *= 1 + surge.price_multiplier / 100;
//         }
//         break;
//       }
//       case 'WEEKEND': {
//         const day = orderDate.getDay(); // 0=Sunday, 6=Saturday
//         if ((surge.time_range === 'WEEKEND' && (day === 0 || day === 6))
//           || (surge.time_range === 'HOLIDAY' && isHoliday(orderDate))) {
//           price *= 1 + surge.price_multiplier / 100;
//         }
//         break;
//       }
//       case 'VERY_HIGH_DEMAND': {
//         if (price < Number(surge.time_range)) {
//           price *= 1 + surge.price_multiplier / 100;
//         }
//         break;
//       }

//     }
//   });

//   return parseFloat(price.toFixed(2));
// }

// // --- Example holiday checker ---
// function isHoliday(date: Date): boolean {
//   const holidays = [
//     '2025-12-25',
//     '2025-01-01',
//   ];
//   return holidays.includes(date.toISOString().slice(0, 10));
// }


// // --- Main util: get receivers with pricing ---
// export async function getReceiversWithPrice(
//   senderLat: number,
//   senderLng: number,
//   receivers: Receiver[],
//   deliveryTypeName: string,
//   vehicleTypeId: number,
//   zone:DeliveryZone
// ): Promise<DistancePriceResult[]> {

//   // Validate delivery type
 
//   const deliveryTypeEnum = deliveryTypeName as DeliveryTypeName;

//   const deliveryTypeFromDb = await prisma.deliveryType.findFirst({
//     where: { name: deliveryTypeEnum, is_active: true },
//   });

//   if (!deliveryTypeFromDb) {
//     throw new NotFoundException(`Delivery type ${deliveryTypeEnum} not found`);
//   }

//   const deliveryType = {
//     percentage: Number(deliveryTypeFromDb.percentage ?? 0),
//   };

//   const vehicleFromDb = await prisma.vehicleType.findUnique({
//     where: { id: vehicleTypeId },
//   });

//   if (!vehicleFromDb) {
//     throw new NotFoundException(`Vehicle type ID ${vehicleTypeId} not found`);
//   }

//   const vehicle = {
//     base_price: Number(vehicleFromDb.base_price ?? 0),
//     per_km_price: Number(vehicleFromDb.per_km_price ?? 0),
//     peak_pricing: vehicleFromDb.peak_pricing ?? false,
//   };

//   const roadDistances = await getRoadDistancesGoogle(
//     senderLat,
//     senderLng,
//     receivers
//   );

//   // ✅ FIX HERE
//   const results: DistancePriceResult[] = await Promise.all(
//     receivers.map(async (r, idx) => {
//       const price = await calculateDeliveryPrice(
//         roadDistances[idx].distanceKm,
//         vehicle,
//         deliveryType,
//         zone
//       );

//       return {
//         ...r,
//         distanceKm: roadDistances[idx].distanceKm,
//         durationMin: roadDistances[idx].durationMin,
//         price,
//       };
//     })
//   );

//   return results;
// }
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeliveryTypeName, FeeAppliesType } from '@prisma/client';
import axios from 'axios';
import { isWithinInterval, parse } from 'date-fns';
import { PrismaService } from 'src/core/database/prisma.service';
import { DeliveryZone } from 'src/types';

/* -------------------- Types -------------------- */

export interface Receiver {
  lat: number;
  lng: number;
}

export interface DistancePriceResult extends Receiver {
  distanceKm: number;
  durationMin: number;
  price: number;
}

export interface Vehicle {
  base_price: number;
  per_km_price: number;
  peak_pricing?: boolean;
}

export interface DeliveryType {
  percentage: number;
}

/* -------------------- Distance Cache -------------------- */

const distanceCache = new Map<
  string,
  { distanceKm: number; durationMin: number }
>();

/* -------------------- Google Distance -------------------- */

export async function getRoadDistancesGoogle(
  senderLat: number,
  senderLng: number,
  receivers: Receiver[],
): Promise<{ distanceKm: number; durationMin: number }[]> {
  if (!receivers.length) return [];

  const uncached = receivers.filter(
    r =>
      !distanceCache.has(
        `${senderLat},${senderLng}-${r.lat},${r.lng}`,
      ),
  );

  for (let i = 0; i < uncached.length; i += 25) {
    const chunk = uncached.slice(i, i + 25);
    const destinations = chunk.map(r => `${r.lat},${r.lng}`).join('|');

    const res = await axios.get(
      'https://maps.googleapis.com/maps/api/distancematrix/json',
      {
        params: {
          origins: `${senderLat},${senderLng}`,
          destinations,
          mode: 'driving',
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    );

    res.data.rows[0].elements.forEach((el: any, idx: number) => {
      const r = chunk[idx];
      distanceCache.set(
        `${senderLat},${senderLng}-${r.lat},${r.lng}`,
        {
          distanceKm: el.distance.value / 1000,
          durationMin: el.duration.value / 60,
        },
      );
    });
  }

  return receivers.map(
    r =>
      distanceCache.get(
        `${senderLat},${senderLng}-${r.lat},${r.lng}`,
      )!,
  );
}

/* -------------------- Helpers -------------------- */

function mapDeliveryTypeToFeeApplies(
  type: DeliveryTypeName,
): FeeAppliesType {
  switch (type) {
    case 'STANDARD':
      return FeeAppliesType.STANDARD_ORDERS;
    case 'EXPRESS':
      return FeeAppliesType.EXPRESS_ORDERS;
    case 'SCHEDULED':
      return FeeAppliesType.SCHEDULED_ORDERS;
    case 'STACKED':
      return FeeAppliesType.STACKED_ORDERS;
    default:
      throw new Error(`Unsupported delivery type: ${type}`);
  }
}

/* -------------------- Price Calculator -------------------- */

export async function calculateDeliveryPrice(params: {
  distanceKm: number;
  vehicle: Vehicle;
  deliveryType: DeliveryType;
  deliveryTypeEnum: DeliveryTypeName;
  zone: DeliveryZone;
  orderDate: Date;
  prisma: PrismaService;
}): Promise<number> {
  const {
    distanceKm,
    vehicle,
    deliveryType,
    deliveryTypeEnum,
    zone,
    orderDate,
    prisma,
  } = params;

  let price =
    vehicle.base_price + vehicle.per_km_price * distanceKm;

  price += (price * deliveryType.percentage) / 100;

  const appliesTo = mapDeliveryTypeToFeeApplies(deliveryTypeEnum);

  const fees = await prisma.userFeeStructure.findMany({
    where: {
      service_area: zone.zoneName,
      OR: [
        { applies_to: FeeAppliesType.ALL_ORDERS },
        { applies_to: appliesTo },
      ],
    },
  });

  for (const fee of fees) {
    price += Number(fee.amount);
  }

  if (zone.priority === 1 && price < zone.minOrderAmmount) {
    throw new BadRequestException(
      `Minimum order for ${zone.zoneName} is ${zone.minOrderAmmount}`,
    );
  }

  if (zone.priority <= 2) {
    price += zone.deliveryFee;
  }

  const surges = await prisma.userDynamicSurge.findMany({
    where: { applicable_user: 'USER' },
  });

  for (const surge of surges) {
    if (surge.condition === 'HIGH_DEMAND') {
      const [start, end] = surge.time_range.split('-');
      if (
        isWithinInterval(orderDate, {
          start: parse(start, 'HH:mm', orderDate),
          end: parse(end, 'HH:mm', orderDate),
        })
      ) {
        price *= 1 + surge.price_multiplier / 100;
      }
    }
  }

  return Number(price.toFixed(2));
}

/* -------------------- Main Util -------------------- */

export async function getReceiversWithPrice(
  prisma: PrismaService,
  senderLat: number,
  senderLng: number,
  receivers: Receiver[],
  deliveryTypeName: DeliveryTypeName,
  vehicleTypeId: number,
  zone: DeliveryZone,
): Promise<DistancePriceResult[]> {
      const orderDate = new Date()
      const deliveryTypeFromDb = await prisma.deliveryType.findFirst({
        where: { name: deliveryTypeName, is_active: true },
      });

      if (!deliveryTypeFromDb) {
        throw new NotFoundException(
          `Delivery type ${deliveryTypeName} not found`,
        );
      }

      const deliveryType: DeliveryType = {
        percentage: Number(deliveryTypeFromDb.percentage ?? 0),
      };


    const vehicleFromDb = await prisma.vehicleType.findUnique({
      where: { id: vehicleTypeId },
    });

    if (!vehicleFromDb) {
      throw new NotFoundException(`Vehicle type ID ${vehicleTypeId} not found`);
    }

    const vehicle: Vehicle = {
      base_price: Number(vehicleFromDb.base_price ?? 0),
      per_km_price: Number(vehicleFromDb.per_km_price ?? 0),
      peak_pricing: vehicleFromDb.peak_pricing ?? false,
    };


  const distances = await getRoadDistancesGoogle(
    senderLat,
    senderLng,
    receivers,
  );

  return Promise.all(
    receivers.map(async (r, i) => ({
      ...r,
      ...distances[i],
      price: await calculateDeliveryPrice({
        distanceKm: distances[i].distanceKm,
        vehicle,
        deliveryType,
        deliveryTypeEnum: deliveryTypeName,
        zone,
        orderDate,
        prisma,
      }),
    })),
  );
}
