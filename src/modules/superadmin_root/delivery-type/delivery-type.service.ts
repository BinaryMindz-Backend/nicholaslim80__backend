import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

import { CreateDeliveryTypeDto } from './dto/create-delivery-type.dto';
import { UpdateDeliveryTypeDto } from './dto/update-delivery-type.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { UserRole } from '@prisma/client';
import type { IUser } from 'src/types';



@Injectable()
export class DeliveryTypeService {
  constructor(private prisma: PrismaService) { }

  // ** check role
    private verifyAdmin(user: IUser) {
      if (user.role.name !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Admin access only');
      }
    }

  
  // create an delivery type
    async create(dto: CreateDeliveryTypeDto, user: IUser) {
      // Verify admin
      this.verifyAdmin(user);

      // Check if delivery type already exists
      const isExist = await this.prisma.deliveryType.findFirst({
        where: {
          name: dto.name, 
        },
      });

      if (isExist) {
        throw new ConflictException('Delivery type already exists');
      }

      // Create delivery type
      return await this.prisma.deliveryType.create({  
          data: {
          name: dto.name,
          percentage: dto.percentage,
          pickup_duration: dto.pickup_duration,
          delivery_duration: dto.delivery_duration,
          is_active: dto.is_active,
          // map admin_id into nested relation
          admin: {
            connect: { id: user.id }
          },
          }, 
      });
    }

    // Create delivery type
    return await this.prisma.deliveryType.create({
      data: {
        name: dto.name,
        percentage: dto.percentage,
        pickup_duration: dto.pickup_duration,
        delivery_duration: dto.delivery_duration,
        is_active: dto.is_active,
        // map admin_id into nested relation
      },
    });
  }


  // find all delivery type
  async findAll() {
    return this.prisma.deliveryType.findMany();
  }

  // find one delivery type
  async findOne(id: number) {
    const item = await this.prisma.deliveryType.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Delivery type not found');
    return item;
  }

  // update one delivery type
  async update(id: number, data: UpdateDeliveryTypeDto, user: any) {
    this.verifyAdmin(user);
    await this.findOne(id);

    return this.prisma.deliveryType.update({
      where: { id },
      data,
    });
  }

  async remove(id: number, user: any) {
    this.verifyAdmin(user);
    await this.findOne(id);

    return await this.prisma.deliveryType.delete({
      where: { id },
    });
  }
}
