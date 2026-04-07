import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateCustomerOrderConfirmationDto } from './dto/create-customer_order_confirmation.dto';
import { UpdateCustomerOrderConfirmationDto } from './dto/update-customer_order_confirmation.dto';
import { OrderConfirmationRatioType } from '@prisma/client';
import { DateByFilterDto } from './dto/date-filter.dto';




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

  async update(
    id: number,
    dto: UpdateCustomerOrderConfirmationDto,
    changedByRole: string,
    changedByUserId?: number,
  ) {
    const existing = await this.findOne(id);
    if(!existing){
        throw new NotFoundException("Confirmation data not found")
    }

    const updated = await this.prisma.customer_order_confirmation.update({
      where: { id },
      data: dto,
    });

    await this.prisma.customerOrderConfirmationLog.create({
      data: {
        customerOrderConfirmationId: id,
        isNewCustomerWeight: updated.is_new_customer_weight,
        completedOrdersWeight: updated.completed_orders_weight,
        followersWeight: updated.followers_weight,
        changedByRole,
        changedByUserId,
      },
    });

    return updated;
  }
  
  // find all logs
  async findAllLogs(filterDto: DateByFilterDto) {
    const { fromDate, toDate, page = 1, limit = 10, search } = filterDto;

    const skip = (page - 1) * limit;

    const where: any = {
      createdAt: {
        gte: fromDate ? new Date(fromDate) : undefined,
        lte: toDate ? new Date(toDate) : undefined,
      },
    };

    // Optional: search implementation (adjust fields as needed)
    if (search) {
      where.OR = [
        {
          // example field
          action: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          // example field
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.customerOrderConfirmationLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.customerOrderConfirmationLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }




  // 
}
