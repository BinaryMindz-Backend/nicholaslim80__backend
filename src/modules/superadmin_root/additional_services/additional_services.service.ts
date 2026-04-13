import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateAdditionalServiceDto } from './dto/create-additional_service.dto';
import { UpdateAdditionalServiceDto } from './dto/update-additional_service.dto';
import { ServiceEmailNumberDto } from './dto/service-email-number.dto';
import { ActivityLogService } from './activity_logs.services';

@Injectable()
export class AdditionalServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService

  ) { }

  // 
  async onModuleInit() {
    // Seed default configs if they don't exist
    await this.prisma.serviceConfig.upsert({ where: { id: 1 }, create: { service_email: 'support@nicholaslim80.com', service_number: '1234567890' }, update: {} });
  }

    // 
    async create(dto: CreateAdditionalServiceDto, userId: number) {
      const created = await this.prisma.additionalServices.create({
        data: dto,
      });

      await this.activityLogService.log({
        action: 'CREATE',
        entityType: 'AdditionalService',
        entityId: created.id,
        userId,
        meta: {
          new: created,
        },
      });

      return created;
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

    async update(id: number, dto: UpdateAdditionalServiceDto, userId: number) {
      const existing = await this.findOne(id);

      const updated = await this.prisma.additionalServices.update({
        where: { id },
        data: dto,
      });

      await this.activityLogService.log({
        action: 'UPDATE',
        entityType: 'AdditionalService',
        entityId: id,
        userId,
        meta: {
          before: existing,
          after: updated,
          changes: dto,
        },
      });

      return updated;
    }


    async remove(id: number, userId: number) {
      const existing = await this.findOne(id);

      await this.prisma.additionalServices.delete({
        where: { id },
      });

      await this.activityLogService.log({
        action: 'DELETE',
        entityType: 'AdditionalService',
        entityId: id,
        userId,
        meta: {
          deleted: existing,
        },
      });

      return { message: 'Deleted successfully' };
    }




  // service email and number
  async getServiceEmailNumber() {
    return this.prisma.serviceConfig.findUnique({ where: { id: 1 } });
  }

  async updateServiceEmailNumber(id: number, dto: ServiceEmailNumberDto, userId: number) {
    const existing = await this.prisma.serviceConfig.findUnique({
      where: { id },
    });

    const updated = await this.prisma.serviceConfig.update({
      where: { id },
      data: dto,
    });

    await this.activityLogService.log({
      action: 'UPDATE',
      entityType: 'ServiceConfig',
      entityId: id,
      userId,
      meta: {
        before: existing,
        after: updated,
        changes: dto,
      },
    });

    return updated;
  }


  async deleteServiceEmailNumber(id: number, userId: number) {
    const existing = await this.prisma.serviceConfig.findUnique({
      where: { id },
    });

    await this.prisma.serviceConfig.delete({
      where: { id },
    });

    await this.activityLogService.log({
      action: 'DELETE',
      entityType: 'ServiceConfig',
      entityId: id,
      userId,
      meta: {
        deleted: existing,
      },
    });

    return { message: 'Deleted successfully' };
  }


}
