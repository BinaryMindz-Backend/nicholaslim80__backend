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
  const zoneMultiplier = zone.deliveryFee;
  const priceBeforeZone = price;
  price *= zoneMultiplier;
  const zoneFeeAmount = price - priceBeforeZone;

  /* ---------------- Dynamic Surge (UserDynamicSurge) ---------------- */
  let dynamicSurgeAmount = 0;
  let dynamicSurgeMultiplier = 1.0;

  try {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const dynamicSurgeRules = await prisma.userDynamicSurge.findMany({
      where: {
        is_active: true,
        OR: [
          { serviceAreas: { some: { service_area_id: zone.id } } },
          { serviceAreas: { none: {} } },
        ],
      },
    });

    // Match rules where current time falls within time_range (format: "HH:MM AM/PM - HH:MM AM/PM")
    const matchedSurgeRule = dynamicSurgeRules.find(rule => {
      const [startStr, endStr] = rule.time_range.split('-').map(s => s.trim());
      const toMinutes = (str: string): number => {
        const [time, meridiem] = str.split(' ');
        let [h, m] = time.split(':').map(Number);
        if (meridiem === 'PM' && h !== 12) h += 12;
        if (meridiem === 'AM' && h === 12) h = 0;
        return h * 60 + m;
      };
      const start = toMinutes(startStr);
      const end = toMinutes(endStr);
      // Handle overnight ranges e.g. 10:00 PM - 02:00 AM
      return end < start
        ? nowMinutes >= start || nowMinutes <= end
        : nowMinutes >= start && nowMinutes <= end;
    });

    if (matchedSurgeRule) {
      // price_multiplier stored as integer e.g. 150 = 1.5x
      dynamicSurgeMultiplier = Number(matchedSurgeRule.price_multiplier) / 100;
      dynamicSurgeAmount = price * (dynamicSurgeMultiplier - 1);
      price += dynamicSurgeAmount;
    }
  } catch (error) {
    console.error('Dynamic surge calculation failed:', error);
  }

  /* ---------------- Surge Pricing (resolveSurge / demand-based) ---------------- */
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

  const totalFee = Number(userFeeTotal + zoneFeeAmount + dynamicSurgeAmount + surgeAmount + extraStopSurcharge);
  const totalPrice = Number(price + extraStopSurcharge);

  // console.log('basePrice', basePrice);
  // console.log('deliveryTypeCharge', deliveryTypeCharge);
  // console.log('deliveryType?.price_multiplier', deliveryType?.price_multiplier);
  // console.log('price', price);
  // console.log('extraStopSurcharge', extraStopSurcharge);
  // console.log('userFeeTotal', userFeeTotal);
  // console.log('zoneFee', zoneFeeAmount);
  // console.log('dynamicSurgeAmount', dynamicSurgeAmount);
  // console.log('dynamicSurgeMultiplier', dynamicSurgeMultiplier);
  // console.log('surgeAmount', surgeAmount);
  // console.log('surgeMultiplier', surgeMultiplier);
  // console.log('platformFee', platformFee);
  // console.log('raiderEarnings', raiderEarnings);
  // console.log('totalFee', totalFee);
  // console.log('totalPrice', totalPrice);
  // console.log("platform fee-->", platformFee)

  return {
    basePrice: Number(basePrice.toFixed(2)),
    deliveryTypeCharge: Number(deliveryTypeCharge.toFixed(2)),
    deliveryTypeSurge: Number(extraStopSurcharge.toFixed(2)),
    userFeeTotal: Number(userFeeTotal.toFixed(2)),
    zoneFee: Number(zoneFeeAmount.toFixed(2)),          // was: raw multiplier
    dynamicSurgeAmount: Number(dynamicSurgeAmount.toFixed(2)),
    dynamicSurgeMultiplier: Number(dynamicSurgeMultiplier.toFixed(4)),
    surgeAmount: Number(surgeAmount.toFixed(2)),
    surgeMultiplier: Number(surgeMultiplier.toFixed(4)),
    totalFee: Number(totalFee.toFixed(2)),              // was: included raw multiplier
    totalPrice: Number(totalPrice.toFixed(2)),          // was: totalFee + platformFee
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
  const [standardCommissions, compensationRoles, deductions] = await Promise.all([

    prisma.standardCommissionRate.findMany({
      where: {
        OR: [
          { serviceAreas: { some: { service_area_id: serviceZoneId } } },
          { serviceAreas: { none: {} } },
        ],
      },
    }),
    // Raider earns: compensation % on top of base
    prisma.raiderCompensationRole.findMany({
      where: {
        OR: [
          { serviceAreas: { some: { service_area_id: serviceZoneId } } },
          { serviceAreas: { none: {} } },
        ],
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

  const commissionTotal = standardCommissions.reduce(
    (sum, rate) =>
      sum + (orderPrice * Number(rate.commission_rate_delivery_fee ?? 0)) / 100,
    0,
  );

  const compensationTotal = compensationRoles.reduce(
    (sum, role) =>
      sum + (orderPrice * Number(role.commission_rate_delivery_fee ?? 0)) / 100,
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

  const deductionTotal = fixedTotal + percentageTotal;

  // platformFee = what platform keeps
  // commissionTotal  → platform earns
  // compensationTotal → platform pays out to raider (reduce platform fee)
  // deductionTotal   → platform keeps back from raider (increase platform fee)
  return commissionTotal - compensationTotal + deductionTotal;
}