import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserFeeStructure } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { StandardCommissionRateService } from './commision_rate.services';
import { CreateUserFeeStructureDto } from './dto/create_ user_fee_structure.dto';
import { UpdateUserFeeStructureDto } from './dto/update-platform_fee.dto';

@Injectable()
export class UserFeeStructureService {
  constructor(private readonly prisma: PrismaService,
    private readonly logServices: StandardCommissionRateService
  ) { }

  async create(data: CreateUserFeeStructureDto,
    changedByRole: string,
    changedById: number,
  ): Promise<UserFeeStructure> {
    // 
    const record = await this.prisma.userFeeStructure.findFirst({
      where: {
        fee_name: data.fee_name
      }
    })
    const serviceArea = await this.prisma.serviceZone.findFirst({
       where:{
         id:data.service_area_id
       }
    })
    // 
    if (record) {
      throw new ConflictException("Record all ready exist")
    }

    if (!serviceArea) {
      throw new NotFoundException('Service area not found');
    }
    // 
    const r = await this.prisma.userFeeStructure.create({ data });
    // 
    await this.logServices.createFeeLog({
      logType: r.applies_to,
      referenceId: r.id,
      applicableUser: r.applicable_user,
      serviceArea: serviceArea.name,
      snapshot: r,
      changedByRole,
      changedById,
    });

    return r;
  }

  async findAll(): Promise<UserFeeStructure[]> {
    return this.prisma.userFeeStructure.findMany({
      include: {
        serviceArea: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number): Promise<UserFeeStructure> {
    const record = await this.prisma.userFeeStructure.findUnique({
      where: { id },
      include: {
        serviceArea: true,
      },
    });
    if (!record) throw new NotFoundException('User fee structure not found');
    return record;
  }

  async update(id: number, data: UpdateUserFeeStructureDto,
    changedByRole: string,
    changedById: number,
  ): Promise<UserFeeStructure> {
    await this.findOne(id);
    const zone = await this.prisma.serviceZone.findUnique({ where: { id: data.service_area_id } });
    // 
    if (!zone) {
      throw new NotFoundException('Service area not found');
    }

    const updated = await this.prisma.userFeeStructure.update({ where: { id }, data });
    // 
    await this.logServices.createFeeLog({
      logType: updated.applies_to,
      referenceId: updated.id,
      applicableUser: updated.applicable_user,
      serviceArea: zone?.name,
      snapshot: updated,
      changedByRole,
      changedById,
    });


    return updated;
  }

  async remove(id: number): Promise<UserFeeStructure> {
    await this.findOne(id);
    return this.prisma.userFeeStructure.delete({ where: { id } });
  }
}
