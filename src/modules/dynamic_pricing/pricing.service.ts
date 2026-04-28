/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException } from '@nestjs/common';
import {PricingBreakdown, CalculatePriceParams } from './types';
import { evaluateRule } from './fee.helper';

export async function calculatePriceWithFee(
  params: CalculatePriceParams
): Promise<PricingBreakdown> {
  
  const {
    prisma,
    surgePricingRuleService,
    distanceKm,
    vehicle,
    deliveryType,
    zone,
    orderDate,
    demand = 0,
    availableDrivers = 0,
  } = params;

  /* ---------------- base ---------------- */
  const distance = distanceKm - Number(vehicle.base_distance ?? 0);
  
  const base =
    Number(vehicle.base_price ?? 0) +
    Number(vehicle.per_km_price ?? 0) * distance;

  const deliveryTypeCharge = base * Number(deliveryType.price_multiplier ?? 1);
  
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
    if (fee.applies_to === 'ALL_ORDERS') return true;
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

  /* ---------------- NEW SURGE PRICING RULES (Demand / Drivers) ---------------- */
  let surgeAmount = 0;
  let surgeMultiplier = 1.0;

  try {
    const demandRatio = availableDrivers > 0 ? demand / availableDrivers : 0;

    const surgeResult = await surgePricingRuleService.resolveSurge({
      ratio: Number(demandRatio.toFixed(4)),
      serviceZoneId: zone.id,
      deliveryTypeId: Number(deliveryType.id),
    });

    surgeMultiplier = surgeResult.multiplier;
    surgeAmount = price * (surgeMultiplier - 1);

  } catch (error) {
    console.error('Surge calculation failed, applying no surge:', error);
    surgeMultiplier = 1.0;
    surgeAmount = 0;
  }

  price += surgeAmount;

  /* ---------------- Final Return ---------------- */
  return {
    basePrice: Number(base.toFixed(2)),
    deliveryTypeCharge: Number(deliveryTypeCharge.toFixed(2)),
    userFeeTotal: Number(userFeeTotal.toFixed(2)),
    zoneFee: Number(zoneFee.toFixed(2)),
    surgeAmount: Number(surgeAmount.toFixed(2)),
    surgeMultiplier: Number(surgeMultiplier.toFixed(4)),
    totalFee: Number((userFeeTotal + zoneFee + surgeAmount).toFixed(2)),
    totalPrice: Number(price.toFixed(2)),
    distanceKm: distanceKm,
  };
}