// import {UserRole } from '@prisma/client';

import { CollectTime, DeliveryTypeName, Destination, DestinationType, Order, PayType, RouteType, Transaction } from "@prisma/client";


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
  role: IUserRole;
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

