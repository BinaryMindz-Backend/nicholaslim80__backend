import { Injectable } from '@nestjs/common';
import { CreateServiceZoneDto } from './dto/create-service-zone.dto';
import { UpdateServiceZoneDto } from './dto/update-service-zone.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class ServiceZoneService {
  constructor(private readonly prisma: PrismaService) { }
  async create(createServiceZoneDto: CreateServiceZoneDto) {
    try {
      console.log(createServiceZoneDto);
      const res = await this.prisma.serviceZone.create({
        data: createServiceZoneDto,
      });
      return res;
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }

  async findAll() {
    return await this.prisma.serviceZone.findMany();
  }

  async updateActiveStatus(id: number) {
    try {
      const zone = await this.prisma.serviceZone.findUnique({
        where: { id },
      });
      if (!zone) {
        throw new Error('Service zone not found');
      }

      const updatedZone = await this.prisma.serviceZone.update({
        where: { id },
        data: { isActive: !zone.isActive },
      });

      return ApiResponses.success(updatedZone, 'Service zone status updated successfully');

    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }

  async update(id: number, updateServiceZoneDto: UpdateServiceZoneDto) {
    try {
      const zone = await this.prisma.serviceZone.findUnique({
        where: { id },
      });
      if (!zone) {
        throw new Error('Service zone not found');
      }

      const updatedZone = await this.prisma.serviceZone.update({
        where: { id },
        data: updateServiceZoneDto,
      });
      return ApiResponses.success(updatedZone, 'Service zone updated successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }

  async remove(id: number) {
    try {
      const zone = await this.prisma.serviceZone.findUnique({
        where: { id },
      });
      if (!zone) {
        throw new Error('Service zone not found');
      }
      await this.prisma.serviceZone.delete({
        where: { id },
      });
      return ApiResponses.success(null, 'Service zone deleted successfully');
    } catch (error) {
      return ApiResponses.error(error.message);
    }
  }
}
