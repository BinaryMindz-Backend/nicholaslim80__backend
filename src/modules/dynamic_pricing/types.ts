/* eslint-disable @typescript-eslint/no-empty-object-type */
import { PrismaService } from "src/core/database/prisma.service";
import { SurgePricingRuleService } from "../superadmin_root/surge_pricing_rule/surge_pricing_rule.service";
import { Prisma } from "@prisma/client";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Receiver extends LatLng {}

export interface ReceiverWithPricing extends Receiver {
  distanceKm: number;
  pricing: PricingBreakdown;
}

export interface PricingBreakdown {
  basePrice: number;
  deliveryTypeCharge: number;
  userFeeTotal: number;
  zoneFee: number;
  surgeAmount: number;
  surgeMultiplier: number;    
  totalFee: number;
  totalPrice: number;
  distance?: number;
  distanceKm?: number;
  min?:       number; 
  min_text?:   string;
  isRoundTrip?: boolean;
  returnFactor?: number;
    // Driver & Platform breakdown
  raiderEarnings: number;   
  platformFee: number; 
}

export interface RouteOptions {
  isRoundTrip?: boolean;
  returnFactor?: number;
}

export interface DeliveryZone {
  id: number;
  name: string;
  zoneName: string;
  coordinates: LatLng[];
  deliveryFee: number;
  priority: number;
  minOrderAmmount: number;
  isActive: boolean;
}

// Optional: For better type safety
export interface CalculatePriceParams {
  prisma: PrismaService;
  surgePricingRuleService: SurgePricingRuleService;
  distanceKm: number;
  vehicle: Prisma.VehicleTypeUncheckedCreateInput;
  deliveryType: Prisma.DeliveryTypeUncheckedCreateInput;
  zone: DeliveryZone;
  orderDate: Date;
  demand?: number;
  availableDrivers?: number;
}