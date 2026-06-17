import { PrismaService } from 'src/core/database/prisma.service';
import { BadRequestException } from '@nestjs/common';
import {
  Receiver,
  ReceiverWithPricing,
  DeliveryZone,
  RouteOptions,
} from './types';
import { getRoadDistance } from './distance.service';
import { calculatePriceWithFee } from './pricing.service';
import { SurgePricingRuleService } from '../superadmin_root/surge_pricing_rule/surge_pricing_rule.service';

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
    const { km: distanceKm, min, min_text } = await getRoadDistance(sender, receiver);

    // Round trip: add return leg factor
    let finalDistanceKm = distanceKm;
    if (options?.isRoundTrip) {
      const returnFactor = options.returnFactor ?? 0.5;
      finalDistanceKm = distanceKm + distanceKm * returnFactor;
    }

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
      distanceKm,
      pricing: {
        basePrice: pricing.basePrice,
        deliveryTypeCharge: pricing.deliveryTypeCharge,
        deliveryTypeSurge: pricing.deliveryTypeSurge,
        userFeeTotal: pricing.userFeeTotal,
        zoneFee: pricing.zoneFee,
        surgeAmount: pricing.surgeAmount,
        surgeMultiplier: pricing.surgeMultiplier,
        totalFee: pricing.totalFee,
        totalPrice: pricing.totalPrice,
        raiderEarnings: pricing.raiderEarnings,
        platformFee: pricing.platformFee,
        distance: distanceKm,
        distanceKm,
        min,
        min_text,
        isRoundTrip: options?.isRoundTrip ?? false,
        returnFactor: options?.returnFactor ?? 0,
      },
    });
  }

  return receiversWithPricing;
}