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

// refer count
async referCount(referCode?: string): Promise<number> {
  let totalCount: number;

  if (referCode) {
    totalCount = await this.prisma.refer.count({
      where: {
        refer_code: referCode,
      },
    });
  } else {
    totalCount = await this.prisma.refer.count();
  }

  return totalCount;
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
