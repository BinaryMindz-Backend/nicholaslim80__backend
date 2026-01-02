import { PrismaService } from 'src/core/database/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { DeliveryTypeName } from '@prisma/client';
import {
  Receiver,
  ReceiverWithPricing,
  DeliveryZone,
  RouteOptions,
} from './types';
import { calculateRouteDistance } from './route-distance';
import { calculatePriceWithFee } from './pricing.service';
import { getRoadDistance } from './distance.service';


export async function getReceiversWithPrice(
  prisma: PrismaService,
  sender: Receiver,
  receivers: Receiver[],
  deliveryTypeEnum: DeliveryTypeName,
  vehicleTypeId: number,
  zone: DeliveryZone,
  options?: RouteOptions,
): Promise<ReceiverWithPricing[]> {
    
  const [deliveryType, vehicle] = await Promise.all([
    prisma.deliveryType.findFirst({
      where: { name: deliveryTypeEnum, is_active: true },
    }),
    prisma.vehicleType.findUnique({ where: { id: vehicleTypeId } }),
  ]);
  if (!deliveryType || !vehicle) {
    throw new BadRequestException('Invalid vehicle or delivery type');
  }

  if (!receivers.length) return [];

  //  Calculate total distance for the whole route
  const totalDistanceKm = await calculateRouteDistance(
    sender,
    receivers,
    options?.isRoundTrip ?? false,
    options?.returnFactor ?? 0.5,
  );

  // Calculate total price & total fee for the order once
  const totalPricing = await calculatePriceWithFee({
    prisma,
    distanceKm: totalDistanceKm,
    vehicle,
    deliveryType,
    deliveryTypeEnum,
    zone,
    orderDate: new Date(),
  });

  // Calculate per-leg distances for display only
  const perLegDistances: number[] = [];
  let previousPoint = sender;
  for (const r of receivers) {
    const { km } = await getRoadDistance(previousPoint, r);
    perLegDistances.push(km);
    previousPoint = r;
  }
  // Return receivers with per-leg distance but same total price/fee
  return receivers.map((r, idx) => ({
    ...r,
    distanceKm: perLegDistances[idx],
    pricing: totalPricing, // same totalPrice / totalFee for the order
  }));
}




export async function getReceiversWithIndividualPrice(
  prisma: PrismaService,
  sender: Receiver,
  receivers: Receiver[],
  deliveryTypeEnum: DeliveryTypeName,
  vehicleTypeId: number,
  zone: DeliveryZone,
  options?: RouteOptions,
): Promise<ReceiverWithPricing[]> {
  const [deliveryType, vehicle] = await Promise.all([
    prisma.deliveryType.findFirst({
      where: { name: deliveryTypeEnum, is_active: true },
    }),
    prisma.vehicleType.findUnique({ where: { id: vehicleTypeId } }),
  ]);

  if (!deliveryType || !vehicle) {
    throw new BadRequestException('Invalid vehicle or delivery type');
  }

  if (!receivers.length) return [];

  // Calculate individual price for each drop
  const receiversWithPricing: ReceiverWithPricing[] = [];

  for (const receiver of receivers) {
    // Distance from pickup to this specific drop
    const { km: distanceKm } = await getRoadDistance(sender, receiver);

    // Add return trip distance if round trip
    let finalDistanceKm = distanceKm;
    if (options?.isRoundTrip) {
      const returnFactor = options.returnFactor ?? 0.5;
      finalDistanceKm = distanceKm + (distanceKm * returnFactor);
    }

    // Calculate individual pricing for this drop
    const pricing = await calculatePriceWithFee({
      prisma,
      distanceKm: finalDistanceKm,
      vehicle,
      deliveryType,
      deliveryTypeEnum,
      zone,
      orderDate: new Date(),
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
        totalFee: pricing.totalFee,
        totalPrice: pricing.totalPrice,
        distance: distanceKm,
        distanceKm: distanceKm,
        isRoundTrip: options?.isRoundTrip ?? false,
        returnFactor: options?.returnFactor ?? 0,
      },
    });
  }

  return receiversWithPricing;
}