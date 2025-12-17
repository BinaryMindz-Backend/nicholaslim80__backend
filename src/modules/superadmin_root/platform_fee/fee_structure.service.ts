import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserFeeStructure } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class UserFeeStructureService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserFeeStructureCreateInput): Promise<UserFeeStructure> {
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


    return this.prisma.userFeeStructure.create({ data });
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

  async update(id: number, data: Prisma.UserFeeStructureUpdateInput): Promise<UserFeeStructure> {
    await this.findOne(id);
    return this.prisma.userFeeStructure.update({ where: { id }, data });
  }

  async remove(id: number): Promise<UserFeeStructure> {
    await this.findOne(id);
    return this.prisma.userFeeStructure.delete({ where: { id } });
  }
}
