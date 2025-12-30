/* eslint-disable @typescript-eslint/no-empty-object-type */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Receiver extends LatLng {}

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

export interface PricingBreakdown {
  basePrice: number;
  deliveryTypeCharge: number;
  userFeeTotal: number;
  zoneFee: number;
  surgeAmount: number;
  totalFee: number;
  totalPrice: number;
}

export interface ReceiverWithPricing extends Receiver {
  distanceKm: number;
  pricing: PricingBreakdown;
}

export interface RouteOptions {
  isRoundTrip?: boolean;
  returnFactor?: number; // default 0.5
}
