/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaService } from 'src/core/database/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { parse, isWithinInterval } from 'date-fns';
import {
  Condition,
  Prisma,
} from '@prisma/client';
import { DeliveryZone, PricingBreakdown } from './types';
import { evaluateRule } from './fee.helper';
import { isHoliday } from './holiday.helper';

export async function calculatePriceWithFee(params: {
  prisma: PrismaService;
  distanceKm: number;
  vehicle: Prisma.VehicleTypeUncheckedCreateInput;
  deliveryType: Prisma.DeliveryTypeUncheckedCreateInput;
  zone: DeliveryZone;
  orderDate: Date;
}): Promise<PricingBreakdown> {
  const {
    prisma,
    distanceKm,
    vehicle,
    deliveryType,
    zone,
    orderDate,
  } = params;

  /* ---------------- base ---------------- */
  const distance = distanceKm - Number(vehicle.base_distance)
  const base =
    Number(vehicle.base_price ?? 0) +
    Number(vehicle.per_km_price ?? 0) * distance;

  const deliveryTypeCharge =
    (base * Number(deliveryType.price_multiplier ?? 1));

  let price = base + deliveryTypeCharge;

  /* ---------------- user fees ---------------- */
      const context = {
      delivery_type: deliveryType.name,
      order_amount: price,
      distance: distance,
    };

    const fees = await prisma.userFeeStructure.findMany({
      where: {
        is_active: true,
        service_area_id: zone.id,
      },
    });

    const matchedFees = fees.filter((fee) => {
      // Basic rules like ALL_ORDERS
      if (fee.applies_to === 'ALL_ORDERS') return true;

      // Evaluate dynamic rules
      return evaluateRule(fee, context);
    });

    const userFeeTotal = matchedFees.reduce(
      (sum, fee) => sum + Number(fee.amount),
      0,
    );

    price += userFeeTotal;

  /* ---------------- zone fee ---------------- */
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

  /* ---------------- surges ---------------- */
  let surgeAmount = 0;

  const surges = await prisma.userDynamicSurge.findMany({
    where: { applicable_user: 'USER' },
  });

  for (const s of surges) {
    if (!s.time_range || typeof s.time_range !== 'string') continue; // skip if invalid

    if (s.condition === 'HIGH_DEMAND') {
      const [start, end] = s.time_range.split('-');
      if (!start || !end) continue; // skip if split failed

      try {
        const startTime = parse(start, 'HH:mm', orderDate);
        const endTime = parse(end, 'HH:mm', orderDate);

        if (isWithinInterval(orderDate, { start: startTime, end: endTime })) {
          surgeAmount += price * (s.price_multiplier / 100);
        }
      } catch (err) {
        console.warn('Invalid time_range format for surge:', s.time_range);
        continue;
      }
    }

    if (s.condition === Condition.WEEKEND && isHoliday(orderDate)) {
      surgeAmount += price * (s.price_multiplier / 100);
    }
  }

  price += surgeAmount;

  return {
    basePrice: base,
    deliveryTypeCharge,
    userFeeTotal,
    zoneFee,
    surgeAmount,
    totalFee: userFeeTotal + zoneFee + surgeAmount,
    totalPrice: Number(price.toFixed(2)),
  };
}
