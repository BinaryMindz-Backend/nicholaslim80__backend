import {UserRole } from '@prisma/client';

export interface IUser {
  id: number;
  email: string;
  phone: string;
  role: UserRole;
}


export interface countType {
  success: boolean;
  message: string;
  data: number
}


