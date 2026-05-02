/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException } from '@nestjs/common';
import {PricingBreakdown, CalculatePriceParams } from './types';
import { evaluateRule } from './fee.helper';
import { PrismaService } from 'src/core/database/prisma.service';




// order fee
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

  /* ---------------- Base Cost ---------------- */
  const distance = distanceKm - Number(vehicle.base_distance ?? 0);
  const basePrice = Number(vehicle.base_price ?? 0) +
                    Number(vehicle.per_km_price ?? 0) * distance;

  const deliveryTypeCharge = basePrice * Number(deliveryType.price_multiplier ?? 1);

  let price = basePrice + deliveryTypeCharge;

  /* ---------------- User Fees ---------------- */
  const context = { delivery_type: deliveryType.name, order_amount: price, distance };
  const fees = await prisma.userFeeStructure.findMany({
    where: { is_active: true, service_area_id: zone.id },
  });

  const matchedFees = fees.filter(fee => 
    fee.applies_to === 'ALL_ORDERS' || evaluateRule(fee, context)
  );

  const userFeeTotal = matchedFees.reduce((sum, fee) => sum + Number(fee.amount), 0);
  price += userFeeTotal;

  /* ---------------- Zone Fee ---------------- */
  let zoneFee = 0;
  if ((zone.priority === 1 || zone.priority === 2) && price < zone.minOrderAmmount) {
    zoneFee = zone.deliveryFee;
    price += zoneFee;
  }

  /* ---------------- Surge Pricing ---------------- */
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
    price += surgeAmount;
  } catch (error) {
    console.error('Surge calculation failed:', error);
  }

  /* ---------------- Calculate Driver & Platform Split ---------------- */
  // Get platform commission + deductions for this order
  const platformFee = await calculateDriverFeeForOrder(prisma, zone.id);   
  // Raider Earnings = Total Customer Payment - Platform Fee
  const raiderEarnings = price - platformFee;

  /* ---------------- Final Result ---------------- */
  return {
    basePrice: Number(basePrice.toFixed(2)),
    deliveryTypeCharge: Number(deliveryTypeCharge.toFixed(2)),
    userFeeTotal: Number(userFeeTotal.toFixed(2)),
    zoneFee: Number(zoneFee.toFixed(2)),
    surgeAmount: Number(surgeAmount.toFixed(2)),
    surgeMultiplier: Number(surgeMultiplier.toFixed(4)),

    totalFee: Number((userFeeTotal + zoneFee + surgeAmount).toFixed(2)),
    totalPrice: Number(price.toFixed(2)),           // Customer pays

    raiderEarnings: Number(Math.max(0, raiderEarnings).toFixed(2)), // Driver earns
    platformFee: Number(platformFee.toFixed(2)),    // Platform earns
  };
    }

// driver fee
async function calculateDriverFeeForOrder(
    prisma: PrismaService, 
    serviceZoneId: number
    ): Promise<number> {
  
    const [standardCommissions, deductions] = await Promise.all([
        prisma.standardCommissionRate.findMany({
        where: { 
            service_area_id: serviceZoneId,
        }
        }),
        prisma.raiderDeductionFee.findMany({
        })
    ]);
    const commissionTotal = standardCommissions.reduce(
        (sum, rate) => sum + Number(rate.commission_rate_delivery_fee ?? 0), 
        0
    );

    const deductionTotal = deductions.reduce(
        (sum, fee) => sum + Number(fee.amount ?? 0), 
        0
    );

    return commissionTotal + deductionTotal;
  }