import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FeeLogType, Prisma, UserFeeStructure } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { StandardCommissionRateService } from './commision_rate.services';

@Injectable()
export class UserFeeStructureService {
  constructor(private readonly prisma: PrismaService,
    private readonly logServices: StandardCommissionRateService
  ) { }

  async create(data: Prisma.UserFeeStructureCreateInput,
    changedByRole: string,
    changedById: number,
  ): Promise<UserFeeStructure> {
    // 
    const record = await this.prisma.userFeeStructure.findFirst({
      where: {
        fee_name: data.fee_name
      }
    })
    // 
    if (record) {
      throw new ConflictException("Record all ready exist")
    }
    // 
    const r = await this.prisma.userFeeStructure.create({ data });
    if (!r.service_area_id) {
      throw new NotFoundException('Service area not found');
    }
    const zone = await this.prisma.serviceZone.findUnique({ where: { id: r.service_area_id } });
    // 
    await this.logServices.createFeeLog({
      logType: FeeLogType.USER_FEE_STRUCTURE,
      referenceId: r.id,
      applicableUser: r.applicable_user,
      serviceArea: zone?.name,
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

  async update(id: number, data: Prisma.UserFeeStructureUpdateInput,
    changedByRole: string,
    changedById: number,
  ): Promise<UserFeeStructure> {
    await this.findOne(id);
    const updated = await this.prisma.userFeeStructure.update({ where: { id }, data });
    if (!updated.service_area_id) {
      throw new NotFoundException('Service area not found');
    }
    const zone = await this.prisma.serviceZone.findUnique({ where: { id: updated.service_area_id } });
    // 
    await this.logServices.createFeeLog({
      logType: FeeLogType.USER_FEE_STRUCTURE,
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
