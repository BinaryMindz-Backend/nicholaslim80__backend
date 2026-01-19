import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FeeLogType, Prisma, UserDynamicSurge } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { StandardCommissionRateService } from './commision_rate.services';

@Injectable()
export class UserDynamicSurgeService {
  constructor(private readonly prisma: PrismaService,
      private readonly logServices :StandardCommissionRateService
  ) {}

  async create(data: Prisma.UserDynamicSurgeCreateInput,
        changedByRole:string,
        changedById:number,
  ): Promise<UserDynamicSurge> {
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
    const r = await this.prisma.userDynamicSurge.create({ data });
      // 
    await this.logServices.createFeeLog({
        logType: FeeLogType.USER_DYNAMIC_SURGE,
        referenceId: r.id,
        applicableUser: r.applicable_user,
        serviceArea: "",
        snapshot: r,
        changedByRole,
        changedById,
      });

    return r;
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

  async update(id: number, data: Prisma.UserDynamicSurgeUpdateInput,
        changedByRole:string,
        changedById:number,
  ): Promise<UserDynamicSurge> {
    await this.findOne(id);
    //  
    const updated = await this.prisma.userDynamicSurge.update({ where: { id }, data });
    // 
    await this.logServices.createFeeLog({
        logType: FeeLogType.USER_DYNAMIC_SURGE,
        referenceId: updated.id,
        applicableUser: updated.applicable_user,
        serviceArea: "",
        snapshot: updated,
        changedByRole,
        changedById,
      });
    
   
    return updated ;
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
