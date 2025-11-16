import { Role } from '@prisma/client';

export interface IUser {
  id: number;
  email: string;
  phone: string;
  role: Role;
}
