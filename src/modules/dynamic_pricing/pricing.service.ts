import { PricingBreakdown, CalculatePriceParams } from './types';
import { evaluateRule } from './fee.helper';
import { PrismaService } from 'src/core/database/prisma.service';

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
    demand = 0,
    availableDrivers = 0,
  } = params;

  /* ---------------- Base Cost ---------------- */
  const extraDistance = Math.max(0, distanceKm - Number(vehicle.base_distance ?? 0));
  const basePrice =
    Number(vehicle.base_price ?? 0) +
    Number(vehicle.per_km_price ?? 0) * extraDistance;

  const multiplier = Number(deliveryType.price_multiplier ?? 1);
  const deliveryTypeCharge = basePrice * multiplier;
  let price = deliveryTypeCharge;

  /* ---------------- User Fees ---------------- */
  const context = {
    delivery_type: deliveryType.name,
    order_amount: price,
    distance: extraDistance,
  };


  const fees = await prisma.userFeeStructure.findMany({
    where: {
      is_active: true,
      OR: [
        { serviceAreas: { some: { service_area_id: zone.id } } },
        { serviceAreas: { none: {} } },
      ],
    },
  });

  const matchedFees = fees.filter(
    fee => fee.applies_to === 'ALL_ORDERS' || evaluateRule(fee, context),
  );
  const userFeeTotal = matchedFees.reduce((sum, fee) => sum + Number(fee.amount), 0);
  price += userFeeTotal;

  /* ---------------- Zone Fee ---------------- */
  const zoneFee = zone.deliveryFee;
  price *= zoneFee;
  console.log('ZONE fee-->', zoneFee);

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

  /* ---------------- Platform Fee & Raider Earnings ---------------- */
  const platformFee = await calculateDriverFeeForOrder(prisma, zone.id, price);
  const raiderEarnings = price - platformFee;

  /* ---------------- Final Result ---------------- */
  const extraStopSurcharge = Number(deliveryType?.extra_stop_surcharge ?? 0);

  return {
    basePrice: Number(basePrice.toFixed(2)),
    deliveryTypeCharge: Number(deliveryTypeCharge.toFixed(2)),
    deliveryTypeSurge: Number(extraStopSurcharge.toFixed(2)),
    userFeeTotal: Number(userFeeTotal.toFixed(2)),
    zoneFee: Number(zoneFee.toFixed(2)),
    surgeAmount: Number(surgeAmount.toFixed(2)),
    surgeMultiplier: Number(surgeMultiplier.toFixed(4)),
    totalFee: Number(
      (userFeeTotal + zoneFee + surgeAmount + extraStopSurcharge).toFixed(2),
    ),
    totalPrice: Number((price + extraStopSurcharge).toFixed(2)),
    raiderEarnings: Number(Math.max(0, raiderEarnings).toFixed(2)),
    platformFee: Number(platformFee.toFixed(2)),
  };
}



// driver fee calculation
async function calculateDriverFeeForOrder(
  prisma: PrismaService,
  serviceZoneId: number,
  orderPrice: number,
): Promise<number> {
  const [standardCommissions, deductions] = await Promise.all([

    prisma.standardCommissionRate.findMany({
      where: {
        serviceAreas: {
          some: { service_area_id: serviceZoneId },
        },
      },
    }),

    prisma.raiderDeductionFee.findMany({
      where: {
        OR: [
          { serviceAreas: { some: { service_area_id: serviceZoneId } } },
          { serviceAreas: { none: {} } },
        ],
      },
    }),
  ]);

  // Commission: each rate is a % of orderPrice
  const commissionTotal = standardCommissions.reduce(
    (sum, rate) =>
      sum + (orderPrice * Number(rate.commission_rate_delivery_fee ?? 0)) / 100,
    0,
  );

  const fixedDeductions = deductions.filter(d => d.type === 'fixed_amount');
  const percentageDeductions = deductions.filter(d => d.type === 'percentage');

  const fixedTotal = fixedDeductions.reduce(
    (sum, fee) => sum + Number(fee.amount ?? 0),
    0,
  );

  const percentageTotal = percentageDeductions.reduce(
    (sum, fee) => sum + (orderPrice * Number(fee.amount ?? 0)) / 100,
    0,
  );

  return commissionTotal + fixedTotal + percentageTotal;
}