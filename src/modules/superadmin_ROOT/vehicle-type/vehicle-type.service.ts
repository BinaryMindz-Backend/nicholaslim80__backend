import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateVehicleTypeDto } from './dto/create-vehicle-type.dto';
import { UpdateVehicleTypeDto } from './dto/update-vehicle-type.dto';

@Injectable()
export class VehicleTypeService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE
  async create(dto: CreateVehicleTypeDto) {
    // 
    const exists = await this.prisma.vehicleType.findFirst({
      where: { vehicle_type:dto.vehicle_type, dimension:dto.dimension},
    });

    if (exists?.vehicle_type && exists?.dimension) {
      throw new ConflictException('Vehicle type by same dimention already exists');
    }

    return this.prisma.vehicleType.create({ data: dto });
  }

  // FIND ALL ACTIVE
  async findAll() {
    return this.prisma.vehicleType.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
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
    await this.findOne(id); // will throw if not found

    return this.prisma.vehicleType.update({
      where: { id },
      data: dto,
    });
  }

  // SOFT DELETE
  async Delete(id: number) {
    await this.findOne(id);

    return this.prisma.vehicleType.delete({
      where: { id },
    });
  }


}
