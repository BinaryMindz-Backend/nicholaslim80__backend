import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FeeLogType, Prisma, RaiderDeductionFee } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { StandardCommissionRateService } from './commision_rate.services';

@Injectable()
export class RaiderDeductionFeeService {
  constructor(private readonly prisma: PrismaService,
       private readonly logServices :StandardCommissionRateService
  ) {}

  async create(data: Prisma.RaiderDeductionFeeCreateInput,
         changedByRole:string,
         changedById:number,

  ): Promise<RaiderDeductionFee> {
      //  
     const record = await this.prisma.raiderDeductionFee.findFirst({
         where:{
            deduction_name:data.deduction_name
         }
    })
      // 
      if(record){
           throw new ConflictException("Record all-ready exist")
      }
     const r = await this.prisma.raiderDeductionFee.create({ data });
      
       await this.logServices.createFeeLog({
        logType: FeeLogType.RAIDER_DEDUCTION_FEE,
        referenceId: r.id,
        applicableUser: r.applicable_user,
        serviceArea: r.service_area,
        snapshot: r,
        changedByRole,
        changedById,
      });

      // 
    return r 
  }

  async findAll(): Promise<RaiderDeductionFee[]> {
    return this.prisma.raiderDeductionFee.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number): Promise<RaiderDeductionFee> {
    const record = await this.prisma.raiderDeductionFee.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Raider Deduction Fee not found');
    return record;
  }

  async update(id: number, data: Prisma.RaiderDeductionFeeUpdateInput,
        changedByRole:string,
        changedById:number,

  ): Promise<RaiderDeductionFee> {
    await this.findOne(id);
   const updated = await this.prisma.raiderDeductionFee.update({ where: { id }, data });
    
     await this.logServices.createFeeLog({
        logType: FeeLogType.RAIDER_COMPENSATION_ROLE,
        referenceId: updated.id,
        applicableUser: updated.applicable_user,
        serviceArea: updated.service_area,
        snapshot: updated,
        changedByRole,
        changedById,
      });
      
      // 
    return updated 
  }

  async remove(id: number): Promise<RaiderDeductionFee> {
    await this.findOne(id);
    return this.prisma.raiderDeductionFee.delete({ where: { id } });
  }
}
