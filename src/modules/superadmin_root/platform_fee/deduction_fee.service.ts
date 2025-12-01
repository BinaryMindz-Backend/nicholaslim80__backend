import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RaiderDeductionFee } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class RaiderDeductionFeeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.RaiderDeductionFeeCreateInput): Promise<RaiderDeductionFee> {
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

    // 
    return this.prisma.raiderDeductionFee.create({ data });
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

  async update(id: number, data: Prisma.RaiderDeductionFeeUpdateInput): Promise<RaiderDeductionFee> {
    await this.findOne(id);
    return this.prisma.raiderDeductionFee.update({ where: { id }, data });
  }

  async remove(id: number): Promise<RaiderDeductionFee> {
    await this.findOne(id);
    return this.prisma.raiderDeductionFee.delete({ where: { id } });
  }
}
