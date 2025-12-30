import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserDynamicSurge } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class UserDynamicSurgeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserDynamicSurgeCreateInput): Promise<UserDynamicSurge> {
      // 
     const record = await this.prisma.userDynamicSurge.findFirst({
         where:{
            role_name:data.role_name
         }
    })
      // 
      if(record){
           throw new ConflictException("Record all ready exist")
      }

    
    // 
    return this.prisma.userDynamicSurge.create({ data });
  }

  async findAll(): Promise<UserDynamicSurge[]> {
    return this.prisma.userDynamicSurge.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number): Promise<UserDynamicSurge> {
    const record = await this.prisma.userDynamicSurge.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Dynamic surge record not found');
    return record;
  }

  async update(id: number, data: Prisma.UserDynamicSurgeUpdateInput): Promise<UserDynamicSurge> {
    await this.findOne(id);
    return this.prisma.userDynamicSurge.update({ where: { id }, data });
  }
    //
    async updateStaus(id: number): Promise<UserDynamicSurge> {
     const r = await this.findOne(id);
    return this.prisma.userDynamicSurge.update({ 
      where: { id },
      data:{
         is_active:!r.is_active
      }
     });
  }
  async remove(id: number): Promise<UserDynamicSurge> {
    await this.findOne(id);
    return this.prisma.userDynamicSurge.delete({ where: { id } });
  }
}
