import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

import { CreateDeliveryTypeDto } from './dto/create-delivery-type.dto';
import { UpdateDeliveryTypeDto } from './dto/update-delivery-type.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { UserRole } from 'src/modules/users/dto/create-user.dto';


@Injectable()
export class DeliveryTypeService {
  constructor(private prisma: PrismaService) {}
  
  // ** check role
  private verifyAdmin(user: any) {
    if (![UserRole.SUPER_ADMIN].includes(user.role)) {
      throw new ForbiddenException('Admin access only');
    }
  }
  
  // create an delivery type
    async create(data: CreateDeliveryTypeDto, user: any) {
      // Verify admin
      this.verifyAdmin(user);

      // Check if delivery type already exists
      const isExist = await this.prisma.deliveryType.findFirst({
        where: {
          name: data.name, 
        },
      });

      if (isExist) {
        throw new ConflictException('Delivery type already exists');
      }

      // Create delivery type
      return this.prisma.deliveryType.create({ data });
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
