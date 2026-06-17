import { PricingBreakdown, CalculatePriceParams } from './types';
import { evaluateRule } from './fee.helper';
import { PrismaService } from 'src/core/database/prisma.service';


/**
 * 
 * @param params 
    client requirements: 
    Delivery Fee = 
    (BaseVehicle + DistanceRate x  Distance) 
    x DeliveryTypeMultiplier (e.g. SAVER, STANDARD, PRIORITY)
    x ServiceAreaMultiplier (e.g. SubUrban, City)
    x SurgePricingRules (e.g. This is the complex one where formula needs to be applied)
 * @returns 
 */


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
    // orderDate,
    demand = 0,
    availableDrivers = 0,
  } = params;


  /* ---------------- Base Cost ---------------- */
  const extraDistance = Math.max(0, distanceKm - Number(vehicle.base_distance ?? 0));
  const basePrice = Number(vehicle.base_price ?? 0) +
    Number(vehicle.per_km_price ?? 0) * extraDistance;

  // deliveryTypeCharge is the delta, price = basePrice × multiplier
  const multiplier = Number(deliveryType.price_multiplier ?? 1);
  const deliveryTypeCharge = basePrice * multiplier;   // final scaled price
  let price = deliveryTypeCharge;

  /* ---------------- User Fees ---------------- */
  const context = {
    delivery_type: deliveryType.name,
    order_amount: price,
    distance: extraDistance,
  };

  const fees = await prisma.userFeeStructure.findMany({
    where: { is_active: true, service_area_id: zone.id },
  });
  const matchedFees = fees.filter(
    (fee) => fee.applies_to === 'ALL_ORDERS' || evaluateRule(fee, context)
  );
  const userFeeTotal = matchedFees.reduce((sum, fee) => sum + Number(fee.amount), 0);
  price += userFeeTotal;

  /* ---------------- Zone Fee ---------------- */
  let zoneFee = 0;
  zoneFee = zone.deliveryFee;  // this is a multiplier, e.g. 1.0 for no change, 1.2 for +20% fee, etc.
  price *= zoneFee;

  console.log("ZONE fee-->", zoneFee);
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
  // Pass final price so commission % is applied correctly
  const platformFee = await calculateDriverFeeForOrder(prisma, zone.id, price);
  const raiderEarnings = price - platformFee;

  /* ---------------- Final Result ---------------- */
  return {
    basePrice: Number(basePrice.toFixed(2)),
    deliveryTypeCharge: Number(deliveryTypeCharge.toFixed(2)),
    deliveryTypeSurge: Number(deliveryType?.extra_stop_surcharge ?? 0.0),
    userFeeTotal: Number(userFeeTotal.toFixed(2)),
    zoneFee: Number(zoneFee.toFixed(2)),
    surgeAmount: Number(surgeAmount.toFixed(2)),
    surgeMultiplier: Number(surgeMultiplier.toFixed(4)),
    totalFee: Number((userFeeTotal + zoneFee + surgeAmount + Number(deliveryType?.extra_stop_surcharge ?? 0.0)).toFixed(2)),
    totalPrice: Number((price + Number(deliveryType?.extra_stop_surcharge ?? 0.0)).toFixed(2)),
    raiderEarnings: Number(Math.max(0, raiderEarnings).toFixed(2)),
    platformFee: Number(platformFee.toFixed(2)),
  };
}

// Filter deductions by zone | Apply commission as % of order price
async function calculateDriverFeeForOrder(
  prisma: PrismaService,
  serviceZoneId: number,
  orderPrice: number,
): Promise<number> {

  const [standardCommissions, deductions] = await Promise.all([
    prisma.standardCommissionRate.findMany({
      where: { service_area_id: serviceZoneId },
    }),
    // Filter deductions by zone to prevent applying irrelevant fees
    prisma.raiderDeductionFee.findMany({
    }),
  ]);
  // commission_rate_delivery_fee is a %, apply against orderPrice
  const commissionTotal = standardCommissions.reduce(
    (sum, rate) =>
      sum + (orderPrice * Number(rate.commission_rate_delivery_fee ?? 0)) / 100,
    0,
  );
  //
  let deductionTotal = 0;
  const fixedAmount = deductions.find(d => d.type === "fixed_amount");
  const percentage = deductions.find(d => d.type === "percentage");

  if (fixedAmount) {
    deductionTotal = deductions.reduce(
      (sum, fee) => sum + Number(fee.amount ?? 0),
      0,
    );
  } else if (percentage) {
    deductionTotal = deductions.reduce(
      (sum, rate) =>
        sum + (orderPrice * Number(rate.amount ?? 0)) / 100,
      0,
    );
  }

  return commissionTotal + deductionTotal;
}
