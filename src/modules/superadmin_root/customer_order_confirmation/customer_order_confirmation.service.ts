import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateCustomerOrderConfirmationDto } from './dto/create-customer_order_confirmation.dto';
import { UpdateCustomerOrderConfirmationDto } from './dto/update-customer_order_confirmation.dto';
import { OrderConfirmationRatioType } from '@prisma/client';




// customer order confirmation service 
@Injectable()
export class CustomerOrderConfirmationService {
  constructor(private prisma: PrismaService) {}
  
  // temporary create config  TODO remove later
  async create(dto: CreateCustomerOrderConfirmationDto) {
    const t = await this.prisma.customer_order_confirmation.create({
      data: dto,
    });

    return t;
  }
  
  // 
  async findAll() {

   const r = await this.prisma.customer_order_confirmation.findMany({
      orderBy: { created_at: 'desc' },
    });
    // Return the result
    return r;
  }

   //  for stats
  async findConfirmationRatioStats() {

      await this.prisma.customer_order_confirmation_ratio_logs.findMany({
      orderBy: { created_at: 'desc' },
    });
    // count
   const count = await this.prisma.customer_order_confirmation_ratio_logs.count({
   })
    // GENIUNE
   const geniune = await this.prisma.customer_order_confirmation_ratio_logs.count({
        where:{
            confirmation_ratio_type:OrderConfirmationRatioType.GENIUNE
        }
   })
   // MANUAL_CHECK
    const manual_check = await this.prisma.customer_order_confirmation_ratio_logs.count({
        where:{
            confirmation_ratio_type:OrderConfirmationRatioType.MANUAL_CHECK
        }
   })
   // SUSPICIOUS
    const suspicious = await this.prisma.customer_order_confirmation_ratio_logs.count({
        where:{
            confirmation_ratio_type:OrderConfirmationRatioType.SUSPICIOUS
        }
   })

      // SUSPICIOUS
   const autoConfirmation = await this.prisma.customer_order_confirmation_ratio_logs.count({
        where:{
            is_auto_confirm:true
        }
   })

    // Return the result
    return {
        geniune_count :geniune / count * 100 ,
        manual_check_count : manual_check / count * 100,
        suspicious_count : suspicious / count * 100,
        auto_confirmation_count : autoConfirmation
    };
  }
   
   

  // 
  async findOne(id: number) {
    const record = await this.prisma.customer_order_confirmation.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('Configuration not found');
    }

    return record;
  }

  async update(id: number, dto: UpdateCustomerOrderConfirmationDto) {
    await this.findOne(id);
    //  
    return await this.prisma.customer_order_confirmation.update({
      where: { id },
      data: dto,
    });
  }
  // 
}
