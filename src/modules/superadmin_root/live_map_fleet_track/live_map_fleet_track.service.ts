import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from 'src/core/database/prisma.service';

// 
@Injectable()
export class LiveMapFleetTrackService {
  constructor(private readonly prisma: PrismaService) { }

  // 
  async findAll() {
    // 
    const order = await this.prisma.order.findMany({
         where:{
            order_status:OrderStatus.ONGOING
         },
         include:{
             assign_rider:{
                 include:{
                    locations:true
                 }
             },
             vehicle:true,
         }
    })
    // 
    return order
  }

  // 
   async findOne(orderId: number) {
    // 
    const order = await this.prisma.order.findFirst({
         where:{
            id:orderId,
            order_status:OrderStatus.ONGOING
         },
         include:{
             assign_rider:{
                include:{
                    locations:true
                }
             },
             vehicle:true,
             user:true,
             transactions:true,
         }
    })
    // 
    return order
  }


}
