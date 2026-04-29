import { PrismaService } from 'src/core/database/prisma.service';
import { BadRequestException } from '@nestjs/common';
import {
  Receiver,
  ReceiverWithPricing,
  DeliveryZone,
  RouteOptions,
} from './types';
// import { calculateRouteDistance } from './route-distance';
import { getRoadDistance } from './distance.service';
import { calculatePriceWithFee } from './pricing.service';
import { SurgePricingRuleService } from '../superadmin_root/surge_pricing_rule/surge_pricing_rule.service';


// export async function getReceiversWithPrice(
//   prisma: PrismaService,
//   sender: Receiver,
//   receivers: Receiver[],
//   deliveryTypeId: number,
//   vehicleTypeId: number,
//   zone: DeliveryZone,
//   options?: RouteOptions,
// ): Promise<ReceiverWithPricing[]> {

//   const [deliveryType, vehicle] = await Promise.all([
//     prisma.deliveryType.findFirst({
//       where: { id: deliveryTypeId, is_active: true },
//     }),
//     prisma.vehicleType.findUnique({ where: { id: vehicleTypeId } }),
//   ]);
//   if (!deliveryType || !vehicle) {
//     throw new BadRequestException('Invalid vehicle or delivery type');
//   }

//   if (!receivers.length) return [];

//   //  Calculate total distance for the whole route
//   const totalDistanceKm = await calculateRouteDistance(
//     sender,
//     receivers,
//     options?.isRoundTrip ?? false,
//     options?.returnFactor ?? 0.5,
//   );

//   // Calculate total price & total fee for the order once
//   const totalPricing = await calculatePriceWithFee({
//     prisma,
//     distanceKm: totalDistanceKm,
//     vehicle,
//     deliveryType,
//     zone,
//     orderDate: new Date(),
//   });

//   // Calculate per-leg distances for display only
//   const perLegDistances: number[] = [];
//   let previousPoint = sender;
//   for (const r of receivers) {
//     const { km } = await getRoadDistance(previousPoint, r);
//     perLegDistances.push(km);
//     previousPoint = r;
//   }
//   // Return receivers with per-leg distance but same total price/fee
//   return receivers.map((r, idx) => ({
//     ...r,
//     distanceKm: perLegDistances[idx],
//     pricing: totalPricing, // same totalPrice / totalFee for the order
//   }));
// }


//** NEW











// TODO:NEED TO REMOVE (OLD)
// export async function getReceiversWithIndividualPrice(
//   prisma: PrismaService,
//   sender: Receiver,
//   receivers: Receiver[],
//   deliveryTypeId: number,
//   vehicleTypeId: number,
//   zone: DeliveryZone,
//   options?: RouteOptions,
// ): Promise<ReceiverWithPricing[]> {
//   const [deliveryType, vehicle] = await Promise.all([
//     prisma.deliveryType.findFirst({
//       where: { id: deliveryTypeId, is_active: true },
//     }),
//     prisma.vehicleType.findUnique({ where: { id: vehicleTypeId } }),
//   ]);

//   if (!deliveryType || !vehicle) {
//     throw new BadRequestException('Invalid vehicle or delivery type');
//   }

//   if (!receivers.length) return [];

//   // Calculate individual price for each drop
//   const receiversWithPricing: ReceiverWithPricing[] = [];

//   for (const receiver of receivers) {
//     // Distance from pickup to this specific drop
//     const { km: distanceKm } = await getRoadDistance(sender, receiver);

//     // Add return trip distance if round trip
//     let finalDistanceKm = distanceKm;
//     if (options?.isRoundTrip) {
//       const returnFactor = options.returnFactor ?? 0.5;
//       finalDistanceKm = distanceKm + (distanceKm * returnFactor);
//     }

//     // Calculate individual pricing for this drop
//     const pricing = await calculatePriceWithFee({
//       prisma,
//       distanceKm: finalDistanceKm,
//       vehicle,
//       deliveryType,
//       zone,
//       orderDate: new Date(),
//     });

//     receiversWithPricing.push({
//       ...receiver,
//       distanceKm: distanceKm,
//       pricing: {
//         basePrice: pricing.basePrice,
//         deliveryTypeCharge: pricing.deliveryTypeCharge,
//         userFeeTotal: pricing.userFeeTotal,
//         zoneFee: pricing.zoneFee,
//         surgeAmount: pricing.surgeAmount,
//         totalFee: pricing.totalFee,
//         totalPrice: pricing.totalPrice,
//         distance: distanceKm,
//         distanceKm: distanceKm,
//         isRoundTrip: options?.isRoundTrip ?? false,
//         returnFactor: options?.returnFactor ?? 0,
//       },
//     });
//   }
//   console.log("reciver with pricing-->",receiversWithPricing);
//   return receiversWithPricing;
// }


export async function getReceiversWithIndividualPrice(
  prisma: PrismaService,
  surgePricingRuleService: SurgePricingRuleService,
  sender: Receiver,
  receivers: Receiver[],
  deliveryTypeId: number,
  vehicleTypeId: number,
  zone: DeliveryZone,
  options?: RouteOptions,
  demand: number = 0,
  availableDrivers: number = 0,
): Promise<ReceiverWithPricing[]> {
  
  const [deliveryType, vehicle] = await Promise.all([
    prisma.deliveryType.findFirst({
      where: { id: deliveryTypeId, is_active: true },
    }),
    prisma.vehicleType.findUnique({ where: { id: vehicleTypeId } }),
  ]);

  if (!deliveryType || !vehicle) {
    throw new BadRequestException('Invalid vehicle or delivery type');
  }

  if (!receivers.length) return [];

  const receiversWithPricing: ReceiverWithPricing[] = [];

  for (const receiver of receivers) {
    // Calculate distance from sender to this specific receiver
    const { km: distanceKm } = await getRoadDistance(sender, receiver);

    // Add return trip distance if it's a round trip
    let finalDistanceKm = distanceKm;
    if (options?.isRoundTrip) {
      const returnFactor = options.returnFactor ?? 0.5;
      finalDistanceKm = distanceKm + (distanceKm * returnFactor);
    }

    // Calculate full pricing including surge and driver split
    const pricing = await calculatePriceWithFee({
      prisma,
      surgePricingRuleService,
      distanceKm: finalDistanceKm,
      vehicle,
      deliveryType,
      zone,
      orderDate: new Date(),
      demand,
      availableDrivers,
    });

    receiversWithPricing.push({
      ...receiver,
      distanceKm: distanceKm,
      pricing: {
        basePrice: pricing.basePrice,
        deliveryTypeCharge: pricing.deliveryTypeCharge,
        userFeeTotal: pricing.userFeeTotal,
        zoneFee: pricing.zoneFee,
        surgeAmount: pricing.surgeAmount,
        surgeMultiplier: pricing.surgeMultiplier,

        totalFee: pricing.totalFee,
        totalPrice: pricing.totalPrice,

        // Driver & Platform breakdown - Very Important
        raiderEarnings: pricing.raiderEarnings,
        platformFee: pricing.platformFee,

        // Extra metadata for this leg
        distance: distanceKm,
        distanceKm: distanceKm,
        isRoundTrip: options?.isRoundTrip ?? false,
        returnFactor: options?.returnFactor ?? 0,
      },
    });
  }

  return receiversWithPricing;
}