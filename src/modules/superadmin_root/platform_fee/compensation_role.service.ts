import { CreateRaiderCompensationRoleDto } from './dto/create_compensation_role.dto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { RaiderCompensationRole } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';
import { UpdateRaiderCompensationRoleDto } from './dto/update-platform_fee.dto';



@Injectable()
export class RaiderCompensationRoleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRaiderCompensationRoleDto){
      
        //  
        const record = await this.prisma.raiderCompensationRole.findFirst({
             where:{
                 scenario:data.scenario
             }
        })
          // 
          if(record){
               throw new ConflictException("Record all ready exist")
          }
    
      
    return await this.prisma.raiderCompensationRole.create({ data });
  }

  async findAll() {
    return await this.prisma.raiderCompensationRole.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number){
    const record = await this.prisma.raiderCompensationRole.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Raider Compensation Role not found');
    return record;
  }

  async update(id: number, data: UpdateRaiderCompensationRoleDto) {
    await this.findOne(id);
    return this.prisma.raiderCompensationRole.update({ where: { id }, data });
  }

  async remove(id: number): Promise<RaiderCompensationRole> {
    await this.findOne(id);
    return this.prisma.raiderCompensationRole.delete({ where: { id } });
  }
}
