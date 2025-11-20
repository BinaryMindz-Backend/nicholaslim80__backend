import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class ReferloyalityService {
   constructor(private readonly prisma:PrismaService){}


  // for admin to find all referral
  async findAll() {
       const referral = await this.prisma.refer.findMany({
  
       });
       return referral
  }

  async findOne(id: number) {
      // 
     const record = await this.prisma.refer.findUnique({
          where:{
              id
          }
     })

    return record
  }

  
  // delete for testing
  async delete(id: number) {
      // 
     const record = await this.prisma.refer.delete({
          where:{
              id
          }
     })

    return record
  }

}
