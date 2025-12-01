import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateStandardCommissionRateDto } from './dto/create-commission_rate.dto';
import { UpdateStandardCommissionRateDto } from './dto/update-platform_fee.dto';


// 
@Injectable()
export class StandardCommissionRateService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new record
  async create(data: CreateStandardCommissionRateDto) {
    //  
     const record = await this.prisma.standardCommissionRate.findFirst({
         where:{
            role_name:data.role_name
         }
    })
      // 
      if(record){
           throw new ConflictException("Record all ready exist")
      }

    return await this.prisma.standardCommissionRate.create({ data });
  }

  // Get all records
  async findAll(){
    return await this.prisma.standardCommissionRate.findMany({
      orderBy: { created_at: 'desc' }, // optional: latest first
    });
  }

  // Get a single record by ID
  async findOne(id: number) {
    const record = await this.prisma.standardCommissionRate.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Standard Commission Rate not found');
    return record;
  }

  // Update a record by ID
  async update(id: number, data:UpdateStandardCommissionRateDto) {
    await this.findOne(id); // ensure exists
    return this.prisma.standardCommissionRate.update({
      where: { id },
      data,
    });
  }

  // Delete a record by ID
  async remove(id: number){
    await this.findOne(id); // ensure exists
    return this.prisma.standardCommissionRate.delete({ where: { id } });
  }
}
