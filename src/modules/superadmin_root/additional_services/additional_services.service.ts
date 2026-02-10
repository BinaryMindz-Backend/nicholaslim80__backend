/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateAdditionalServiceDto } from './dto/create-additional_service.dto';
import { UpdateAdditionalServiceDto } from './dto/update-additional_service.dto';
import { ServiceEmailNumberDto } from './dto/service-email-number.dto';

@Injectable()
export class AdditionalServicesService {
  constructor(private readonly prisma: PrismaService) { }

  // 
  async onModuleInit() {
    // Seed default configs if they don't exist
    await this.prisma.serviceConfig.upsert({ where: { id: 1 }, create: { service_email: 'support@nicholaslim80.com', service_number: '1234567890' }, update: {} });
  }

  // 
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



  // service email and number
  async getServiceEmailNumber() {
    return this.prisma.serviceConfig.findUnique({ where: { id: 1 } });
  }

  async updateServiceEmailNumber(id: number, dto: ServiceEmailNumberDto) {
    return this.prisma.serviceConfig.update({
      where: { id: id },
      data: dto,
    });
  }

  async deleteServiceEmailNumber() {
    return this.prisma.serviceConfig.delete({ where: { id: 1 } });
  }

}
