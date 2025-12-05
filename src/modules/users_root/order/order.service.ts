import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { IUser } from 'src/types';
import { OrderStatus, PayType } from '@prisma/client';
import { OrderFilterDto } from './dto/order-filter.dto';
import { UpdateOrderStatusDto } from './dto/updateOrderStatusDto';


@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto, user:IUser) {

     //
     if(dto.pay_type === PayType.ONLINE_PAY && dto.payment_method_id === undefined){
        // 
       const paymethodRecord = await this.prisma.paymentMethod.findFirst({
          where:{
              OR:[
              { id:dto.payment_method_id},
              { userId:user?.id}
              ]
          }
        })
        if(!paymethodRecord){
        throw new NotFoundException("pay method not found")
        }

       throw new  NotFoundException("For the External pay method must need an payment method id")

     }

    //  
     if(!user){
         throw new NotFoundException("Authenticed user not found")
     }

     const isUserExist = await this.prisma.user.findUnique({
         where:{
            id:user?.id
         }
     })
    //  
    if(!isUserExist){
        throw new UnauthorizedException("Unauthorize exception")
    }
       

    // 
    return this.prisma.order.create({
      data:{
         ...dto,
         userId:user.id
      }
    });

  }

  // 
  async findMine(
      userId: number,
      page: number = 1,
      limit: number = 20,
  ) {
    // 
    const skip = (page - 1) * limit;
    // 
   const [orders, total] = await this.prisma.$transaction([
        this.prisma.order.findMany({
          where: { userId },
          orderBy: { created_at: 'desc' },
          include: { user: true },
          skip,
          take: limit,
        }),
        
        this.prisma.order.count({
          where: { userId },
        }),
      ]);

      return {
        data: orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
  }

  // admin only
      async findUserOrder(
        userId: number,
        page: number = 1,
        limit: number = 20,
      ) {
        const skip = (page - 1) * limit;

        const [orders, total] = await this.prisma.$transaction([
          this.prisma.order.findMany({
            where: { userId },
            orderBy: { created_at: 'desc' },
            include: { user: true },
            skip,
            take: limit,
          }),
          
          this.prisma.order.count({
            where: { userId },
          }),
        ]);

        return {
          data: orders,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        };
      }
  

      // ** for system use user(admin only)
    async findAll(filters: OrderFilterDto) {
      const {
        page = 1,
        limit = 20,
        startDate,
        endDate,
        status,
        category,
        search,
      } = filters;

      const skip = (page - 1) * limit;

      const where: any = {};
      //  
        if (search) {
          // Remove non-digit characters to get integer id
          const orderId = parseInt(search.replace(/\D/g, ''), 10); 
          if (!isNaN(orderId)) {
            where.id = orderId;
          }
        }
      if (status) where.order_status = status;
      if (category) where.delivery_type = category;

      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) where.created_at.gte = new Date(startDate);
        if (endDate) where.created_at.lte = new Date(endDate);
      }

      const [orders, total] = await this.prisma.$transaction([
        this.prisma.order.findMany({
          where,
          select: {
            id: true,
            userId: true,
            route_type: true,
            delivery_type: true,
            pay_type: true,
            vehicle_type_id: true,
            total_cost: true,
            has_additional_services: true,
            is_promo_used: true,
            notify_favorite_raider: true,
            payment_method_id: true,
            assign_rider_id: true,
            raider_confirmation: true,
            is_reviewed: true,
            is_placed: true,
            is_pickup: true,
            order_status: true,
            is_out_for_delivery: true,
            created_at: true,

            // If you want some relations, add them:
            user: {
              select: {
                id: true,
                username: true,
                phone: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
        }),

        this.prisma.order.count({ where }),
      ]);

      return {
        data: orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }


  // 
  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        vehicle: true,
        payment_method: true,
        destinations: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    return order;
  }


  //** update // used place
 async destinationUpdateByUser(orderId:number,id:number, user:IUser){
        // 
       if(!id) throw new NotFoundException("Destination id not found")
       if(!orderId) throw new NotFoundException("Order id Not found")
       const record = await this.prisma.order.findFirst({
            where:{
               id:orderId,
               userId:user.id
            }
      }) 
      if(!record) throw new NotFoundException("Order record not found")
        //
      await this.prisma.destination.update({
           where:{
              id,
           },
           data:{
               order_id:orderId
           }
      }) 
    
 }



  //TODO:(nodeNINJAr) confirm order need to handle promoCode uses and reedom code
   async updateOrderStatus(id: number, userId: number, dto: UpdateOrderStatusDto) {
      const { status } = dto;
      // 1. Check order exists
      const record = await this.prisma.order.findUnique({ where: { id } });
      if (!record) {
        throw new NotFoundException('Record not found');
      }
      
      // 2. Check if already same status
      const already = await this.prisma.order.findFirst({
        where: { id, order_status: status },
      });

      if (already) {
        throw new ConflictException(`This order is already ${status}`);
      }
      // 3. Extra rules
      let extraData = {};

      if (status === OrderStatus.PENDING) {
        extraData = { is_placed: true };
      }

      if (status === OrderStatus.CANCELLED) {
        extraData = { is_placed: false };
      }
      // 4. Update status
      return this.prisma.order.update({
        where: {
          id,
          userId
        },
        data: {
          order_status: status,
          ...extraData,
        },
      });}


  // order update for admin
  async update(id: number, dto: UpdateOrderDto) {
    await this.findOne(id); // ensures existence

    return this.prisma.order.update({
      where: { id },
      data: dto,
    });
  }
   


  // its permanently deleted by admin
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.order.delete({
      where: { id },
    });
  }

  
  // order update for admin
    async assignDriver(id: number, riderId: number) {
      // 1. Check order exists
      const order = await this.prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // 2. Check if order already has assigned rider
      if (order.assign_rider_id) {
        throw new ConflictException('This order already has an assigned rider');
      }

      // 3. OPTIONAL: Check if this rider is already assigned to another active order
      const riderAlreadyAssigned = await this.prisma.order.findFirst({
        where: {
          assign_rider_id: riderId,
          order_status: {
            in: ['PENDING', 'ONGOING'],
          },
        },
      });

      if (riderAlreadyAssigned) {
        throw new ConflictException('This rider is already assigned to another active order');
      }

      //  Save rider to order
      return this.prisma.order.update({
        where: { id },
        data: {
          assign_rider_id: riderId
        },
      });
    }


    
  //  stats dashboard
  async getOrderStats() {
  const [totalOrders, ongoing, scheduled, pending] = await this.prisma.$transaction([
    // Total Orders
    this.prisma.order.count(),

    // Ongoing Orders (progressing states)
    this.prisma.order.count({
      where: {
        order_status: {
          in: [OrderStatus.ONGOING],
        },
      },
    }),

    // Scheduled Orders
    this.prisma.order.count({
      where: { order_status: OrderStatus.SCHEDULED },
    }),

    // Pending Orders
    this.prisma.order.count({
      where: { order_status: OrderStatus.PENDING },
    }),
  ]);

  return {
    totalOrders,
    ongoing,
    scheduled,
    pending,
  };
}



  }
   

