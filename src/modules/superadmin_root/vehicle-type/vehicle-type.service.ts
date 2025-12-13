import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateVehicleTypeDto } from './dto/create-vehicle-type.dto';
import { UpdateVehicleTypeDto } from './dto/update-vehicle-type.dto';
import type { IUser } from 'src/types';

@Injectable()
export class VehicleTypeService {
  constructor(private readonly prisma: PrismaService) { }

  // CREATE
  async create(dto: CreateVehicleTypeDto, user: IUser) {
    // 
    const exists = await this.prisma.vehicleType.findFirst({
      where: { vehicle_type: dto.vehicle_type, dimension: dto.dimension },
    });

    if (exists?.vehicle_type && exists?.dimension) {
      throw new ConflictException('Vehicle type by same dimention already exists');
    }


    return this.prisma.vehicleType.create({
      data: {
        vehicle_type: dto.vehicle_type,
        base_price: dto.base_price,
        per_km_price: dto.per_km_price,
        peak_pricing: dto.peak_pricing,
        dimension: dto.dimension,
        max_load: dto.max_load,
        isActive: dto.isActive,
        admin: {
          connect: { id: user.id },
        },
      },
    });

  }

  // FIND ALL ACTIVE
  async findAll() {
    return this.prisma.vehicleType.findMany({
      orderBy: { id: 'desc' },
    });
  }

  // FIND ONE ACTIVE
  async findOne(id: number) {
    const vehicle = await this.prisma.vehicleType.findUnique({ where: { id } });
    if (!vehicle || vehicle.isActive === false) {
      throw new NotFoundException('Vehicle type not found');
    }
    return vehicle;
  }

  // UPDATE
  async update(id: number, dto: UpdateVehicleTypeDto) {

    const data = await this.prisma.vehicleType.findUnique({ where: { id } });
    if (!data || data === null) {
      throw new NotFoundException('Vehicle type not found');
    }
    return await this.prisma.vehicleType.update({
      where: { id },
      data: dto,
    });
  }

  // SOFT DELETE
  async Delete(id: number) {

    return await this.prisma.vehicleType.delete({
      where: { id },
    });
  }


}
