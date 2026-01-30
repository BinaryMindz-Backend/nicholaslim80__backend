/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateAdditionalServiceDto } from './dto/create-additional_service.dto';
import { UpdateAdditionalServiceDto } from './dto/update-additional_service.dto';

@Injectable()
export class AdditionalServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAdditionalServiceDto) {
    return await this.prisma.additionalServices.create({ data: dto });
  }

  async findAll() {
    return await this.prisma.additionalServices.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number) {
    const service = await this.prisma.additionalServices.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Additional service not found');
    return service;
  }

  async update(id: number, dto: UpdateAdditionalServiceDto) {
    await this.findOne(id);
    return this.prisma.additionalServices.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.additionalServices.delete({ where: { id } });
  }
}
