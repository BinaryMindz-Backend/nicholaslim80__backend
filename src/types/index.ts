import {UserRole } from '@prisma/client';


export interface IUserRole {
  id: number;
  name: UserRole;     // or string if you prefer
  isStatic: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface IUser {
  id: number;
  email: string;
  phone: string;
  role: IUserRole;
}




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
export type performanceCountType = WeeklyPerformanceStat[];

