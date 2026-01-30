// import {UserRole } from '@prisma/client';

import { CollectTime, DeliveryTypeName, Destination, DestinationType, FeeAppliesType, Order, PayType, RouteType, StopPayment, StopStatus, StopType, Transaction } from "@prisma/client";


export interface IUserRole {
  id: number;
  name: string;     // or string if you prefer
  isStatic: boolean;
  createdAt: Date;// ISO string
  updatedAt: Date; // ISO string
}

export interface IUser {
  id: number;
  email: string;
  phone: string;
  roles: IUserRole[];
}

   export type WeeklyStat = {
  week: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
};


export interface countType {
  success: boolean;
  message: string;
  data: number
}


// 
export interface WeeklyPerformanceStat {
  week: string;          // e.g. "Week 1"
  impression: number;
  click: number;
  ctr: number;           // percentage value
}
// 
export enum CoinEvent {
  FIRST_SIGNUP = "FIRST_SIGNUP",
  DAILY_LOGIN = "DAILY_LOGIN",
  SHARE_ON_SOCIAL = "SHARE_ON_SOCIAL",
  REFERRAL = "REFERRAL",
  COMPLETED_ORDER = "COMPLETED_ORDER"
}


// payload
export class CreateIndiOrderDto {
  route_type: RouteType;
  delivery_type: DeliveryTypeName;
  pay_type: PayType;
  collect_time: CollectTime;
  vehicle_type_id?: number;
  payment_method_id?: number;
  total_cost: number;
  isFixed: boolean;
  pick_up_items: string[];
  destinations: DestinationInput[];
}

// return type
export interface CreateOrderResult {
  order: Order;
  transaction: Transaction;
  destinations: Destination[];
}

export interface DestinationInput {
  service_zoneId?:number;
  address: string;
  addressFromApr?: string;
  floor_unit?: string;
  contact_name?: string;
  contact_number?: string;
  note_to_driver?: string;
  is_saved?: boolean;
  type?: DestinationType;
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export type performanceCountType = WeeklyPerformanceStat[];

export interface DeliveryZone {
  id: number;
  name: string;
  zoneName: string;

  coordinates: LatLng[];

  deliveryFee: number;
  priority: number;

  color: string; // Hex color code (e.g. #FF0000)

  minOrderAmmount: number;

  isActive: boolean;

  notes?: string;

  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/* =======================
   TYPES & INTERFACES
======================= */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Vehicle {
  base_price?: number;
  per_km_price?: number;
  peak_pricing?: boolean;
  id?:number,
  vehicle_type?:string,
}

export interface DeliveryType {
  percentage: number;
}

export interface DeliveryZone {
  zoneName: string;
  priority: number;
  minOrderAmmount: number;
  deliveryFee: number;
}

export interface AppliedFee {
  id: number;
  fee_name: string;
  applies_to: FeeAppliesType;
  amount: number;
}


/* ---------------------------------- types --------------------------------- */

export interface Receiver {
  lat: number;
  lng: number;
}

export interface PricingBreakdown {
  basePrice: number;
  deliveryTypeCharge: number;
  userFeeTotal: number;
  zoneFee: number;
  totalFee: number;
  totalPrice: number;
}

export interface ReceiverWithPricing extends Receiver {
  distanceKm: number;
  durationMin: number;
  pricing: PricingBreakdown;
}


// compitions
export interface OrderCompetitionData {
  orderId: number;
  serviceZoneId?: number | null;
  vehicleTypeId?: number | null;
  totalCost: number;
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  deliveryLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  competitionStartedAt: string;
  competitionEndsAt: string;
  timeRemaining: number; // in seconds (8-10)
  competitorIds: number[];
  competitorCount: number;
}



export interface UserRaiderMapping {
  id: number;
  userId: number;
  raider: Raider;
}

export interface Raider {
  id: number;
  userId: number;

  is_online: boolean;
  is_available: boolean;

  raider_status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  LoginType: 'DIRECT_SIGNIN' | 'SOCIAL_LOGIN';

  raider_verificationFromAdmin: 'PENDING' | 'APPROVED' | 'REJECTED';

  isSuspended: boolean;
  suspendedDuration: number | null;
  suspensionReason: string | null;

  hasBranding: boolean;
  hasAdDecal: boolean;
  isPremium: boolean;

  rank: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  rankScore: number;

  reviews_count: number;
  completed_orders: number;
  active_days: number;
  cancellation_rate: number;

  created_at: Date;
  updated_at: Date;
}
// 
export interface OrderData {
  orderId: number;
  totalOrderCost: string;
  totalFee: string;
  vehicleType: Vehicle;
  deliveryType: string;
  orderStop: OrderStop[];
}


// 
export interface OrderStop {
  id: number;

  // Relations (IDs only – safe for transport)
  orderId: number;
  destinationId: number;

  // Snapshot data
  address: string;
  latitude: number;
  longitude: number;
  additionalInfo?: string | null;

  // Stop details
  type: StopType;
  sequence: number;
  status: StopStatus;

  // Delivery proof
  proofs: string[];
  notes?: string | null;

  // Timestamps (ISO strings for API / Socket)
  arrivedAt?: Date | null;
  completedAt?: Date | null;
  failedAt?: Date | null;
  failureReason?: string | null;

  // Payment (optional)
  payment?: StopPayment | null;

  createdAt: Date;
  updatedAt: Date;
}
