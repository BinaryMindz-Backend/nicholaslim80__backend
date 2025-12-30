/* eslint-disable @typescript-eslint/no-unsafe-return */
import axios from 'axios';
import { parse, isWithinInterval } from 'date-fns';
import {
  DeliveryTypeName,
  FeeAppliesType,
  Prisma,
} from '@prisma/client';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { DeliveryZone, PricingBreakdown, Receiver, ReceiverWithPricing } from 'src/types';


/* ---------------------------- distance caching ----------------------------- */

const distanceCache = new Map<string, { km: number; min: number }>();

export async function getRoadDistancesGoogle(
     senderLat: number,
     senderLng: number,
     receivers: Receiver[],
): Promise<{ km: number; min: number }[]> {
  if (!receivers.length) return [];

  const result: { km: number; min: number }[] = [];
  const uncached: Receiver[] = [];

  receivers.forEach(r => {
    const key = `${senderLat},${senderLng}-${r.lat},${r.lng}`;
    const cached = distanceCache.get(key);
    if (cached) {
      result.push(cached);
    } else {
      uncached.push(r);
    }
  });

  for (let i = 0; i < uncached.length; i += 25) {
    const chunk = uncached.slice(i, i + 25);
    const destinations = chunk.map(r => `${r.lat},${r.lng}`).join('|');

    const res = await axios.get(
      'https://maps.googleapis.com/maps/api/distancematrix/json',
      {
        params: {
          origins: `${senderLat},${senderLng}`,
          destinations,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    );

    res.data.rows[0].elements.forEach((el: any, idx: number) => {
      const km = el.distance.value / 1000;
      const min = el.duration.value / 60;
      const r = chunk[idx];
      const key = `${senderLat},${senderLng}-${r.lat},${r.lng}`;
      distanceCache.set(key, { km, min });
      result.push({ km, min });
    });
  }

  return receivers.map(r =>
    distanceCache.get(`${senderLat},${senderLng}-${r.lat},${r.lng}`)!,
  );
}

/* ------------------------------ fee helpers -------------------------------- */

function mapDeliveryType(
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
      throw new Error(`Unsupported delivery type`);
  }
}

/* ---------------------------- pricing function ----------------------------- */

export async function calculatePriceWithFee(params: {
        prisma: PrismaService;
        distanceKm: number;
        vehicle: Prisma.VehicleTypeUncheckedCreateInput;
        deliveryType: Prisma.DeliveryTypeUncheckedCreateInput;
        deliveryTypeEnum: DeliveryTypeName;
        zone: DeliveryZone;
        orderDate: Date;
}): Promise<PricingBreakdown> {
      const {
        prisma,
        distanceKm,
        vehicle,
        deliveryType,
        deliveryTypeEnum,
        zone,
        orderDate,
      } = params;

  const base =
      Number(vehicle.base_price ?? 0) +
      Number(vehicle.per_km_price ?? 0) * distanceKm;

  const deliveryTypeCharge =
    (base * Number(deliveryType.percentage ?? 0)) / 100;

   let price = base + deliveryTypeCharge;

  /* -------------------------- user fee structures -------------------------- */

  const fees = await prisma.userFeeStructure.findMany({
    where: {
      is_active: true,
      service_area: zone.zoneName,
      OR: [
        { applies_to: FeeAppliesType.ALL_ORDERS },
        {
          applies_to: FeeAppliesType.ORDER_LESS,
          condition_value: { gt: price },
        },
        { applies_to: mapDeliveryType(deliveryTypeEnum) },
      ],
    },
  });

  const userFeeTotal = fees.reduce(
    (sum, f) => sum + Number(f.amount),
    0,
  );

  price += userFeeTotal;

  /* ----------------------------- zone pricing ------------------------------ */

  let zoneFee = 0;

  if (zone.priority === 1 && price < zone.minOrderAmmount) {
    throw new BadRequestException(
      `Minimum order amount for ${zone.zoneName} is ${zone.minOrderAmmount}`,
    );
  }

  if (
    zone.priority === 1 ||
    (zone.priority === 2 && price < zone.minOrderAmmount)
  ) {
    zoneFee = zone.deliveryFee;
    price += zoneFee;
  }

  /* --------------------------- dynamic surges ------------------------------ */

  const surges = await prisma.userDynamicSurge.findMany({
    where: { applicable_user: 'USER' },
  });

  for (const s of surges) {
    if (s.condition === 'HIGH_DEMAND') {
      const [start, end] = s.time_range.split('-');
      if (
        isWithinInterval(orderDate, {
          start: parse(start, 'HH:mm', orderDate),
          end: parse(end, 'HH:mm', orderDate),
        })
      ) {
        price *= 1 + s.price_multiplier / 100;
      }
    }
  }

  const totalFee = userFeeTotal + zoneFee;

  return {
    basePrice: base,
    deliveryTypeCharge,
    userFeeTotal,
    zoneFee,
    totalFee,
    totalPrice: Number(price.toFixed(2)),
  };
}

/* ----------------------- main functional entry ----------------------------- */

export async function getReceiversWithPrice(
  prisma: PrismaService,
  senderLat: number,
  senderLng: number,
  receivers: Receiver[],
  deliveryTypeEnum: DeliveryTypeName,
  vehicleTypeId: number,
  zone: DeliveryZone,
): Promise<ReceiverWithPricing[]> {
  const [deliveryType, vehicle] = await Promise.all([
    prisma.deliveryType.findFirst({
      where: { name: deliveryTypeEnum, is_active: true },
    }),
    prisma.vehicleType.findUnique({
      where: { id: vehicleTypeId },
    }),
  ]);

  if (!deliveryType || !vehicle) {
    throw new BadRequestException('Invalid delivery or vehicle type');
  }

  const distances = await getRoadDistancesGoogle(
    senderLat,
    senderLng,
    receivers,
  );

  return Promise.all(
    receivers.map(async (r, idx) => ({
      ...r,
      distanceKm: distances[idx].km,
      durationMin: distances[idx].min,
      pricing: await calculatePriceWithFee({
        prisma,
        distanceKm: distances[idx].km,
        vehicle,
        deliveryType,
        deliveryTypeEnum,
        zone,
        orderDate: new Date(),
      }),
    })),
  );
}
