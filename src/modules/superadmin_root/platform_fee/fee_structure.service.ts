import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FeeLogType, Prisma, UserFeeStructure } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { StandardCommissionRateService } from './commision_rate.services';

@Injectable()
export class UserFeeStructureService {
  constructor(private readonly prisma: PrismaService,
      private readonly logServices :StandardCommissionRateService
  ) {}

  async create(data: Prisma.UserFeeStructureCreateInput,
        changedByRole:string,
        changedById:number,
  ): Promise<UserFeeStructure> {
      // 
     const record = await this.prisma.userFeeStructure.findFirst({
         where:{
          fee_name:data.fee_name
         }
    })
      // 
      if(record){
           throw new ConflictException("Record all ready exist")
      }
      // 
    const r = await this.prisma.userFeeStructure.create({ data });
      // 
      await this.logServices.createFeeLog({
        logType: FeeLogType.USER_FEE_STRUCTURE,
        referenceId: r.id,
        applicableUser: r.applicable_user,
        serviceArea: r.service_area,
        snapshot: r,
        changedByRole,
        changedById,
      });

      return r;
  }

  async findAll(): Promise<UserFeeStructure[]> {
    return this.prisma.userFeeStructure.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number): Promise<UserFeeStructure> {
    const record = await this.prisma.userFeeStructure.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('User fee structure not found');
    return record;
  }

  async update(id: number, data: Prisma.UserFeeStructureUpdateInput,
        changedByRole:string,
        changedById:number,
  ): Promise<UserFeeStructure> {
     await this.findOne(id);
     const updated = await this.prisma.userFeeStructure.update({ where: { id }, data });
      // 
      await this.logServices.createFeeLog({
        logType: FeeLogType.USER_FEE_STRUCTURE,
        referenceId: updated.id,
        applicableUser: updated.applicable_user,
        serviceArea: updated.service_area,
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
