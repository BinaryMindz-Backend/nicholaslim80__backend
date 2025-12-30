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
    prisma.vehicleType.findUnique({
      where: { id: vehicleTypeId },
    }),
  ]);

  if (!deliveryType || !vehicle) {
    throw new BadRequestException('Invalid vehicle or delivery type');
  }

  const totalDistanceKm = await calculateRouteDistance(
    sender,
    receivers,
    options?.isRoundTrip ?? false,
    options?.returnFactor ?? 0.5,
  );

  const pricing = await calculatePriceWithFee({
    prisma,
    distanceKm: totalDistanceKm,
    vehicle,
    deliveryType,
    deliveryTypeEnum,
    zone,
    orderDate: new Date(),
  });

  return receivers.map(r => ({
    ...r,
    distanceKm: totalDistanceKm,
    pricing,
  }));
}
