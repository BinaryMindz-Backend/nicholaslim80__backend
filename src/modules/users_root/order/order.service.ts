import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { IUser } from 'src/types';
import { OrderStatus } from '@prisma/client';


@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto, user:IUser) {
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
  async findMine(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        vehicle: true,
        payment_method: true,
        destinations: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        user: true,
        vehicle: true,
        payment_method: true,
        destinations: true,
      },
      orderBy: { created_at: 'desc' },
    });
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



    // order status update
  async orderMarkAsPending(id:number, user:IUser){
          //  
      const record = await this.prisma.order.findUnique({
        where:{
          id
        }
      }) 
      // 
      if(!record){
           throw new NotFoundException("Record not found")
      }
      // 
     //  
      const isPending = await this.prisma.order.findFirst({
        where:{
          id,
          order_status:OrderStatus.PENDING
        }
      }) 

     if(isPending){
       throw new ConflictException("this order is already Pending")
     } 
       
    // 
      const updatedStatus = await this.prisma.order.update({
           where:{
             id,
             userId:user?.id
           },
           data:{
              order_status:OrderStatus.PENDING,
              is_placed:true,
           }
      })
      return updatedStatus;
  }


  // order status update
  async orderMarkAsCompleted(id:number, user:IUser){
         //  
         const record = await this.prisma.order.findUnique({
           where:{
             id
           }
         }) 
      // 
      if(!record){
           throw new NotFoundException("Record not found")
      }
      // 
     //  
      const isCompleted = await this.prisma.order.findFirst({
        where:{
          id,
          order_status:OrderStatus.COMPLETED
        }
      }) 

     if(isCompleted){
       throw new ConflictException("this order is already completed")
     } 

      // 
       const updatedStatus = await this.prisma.order.update({
           where:{
             id,
             userId:user?.id
           },
           data:{
              order_status:OrderStatus.COMPLETED,
           }
      })
      return updatedStatus;
  }


    // order status update
  async orderMarkAsCancled(id:number, user:IUser){
     
             //  
         const record = await this.prisma.order.findUnique({
           where:{
             id
           }
         }) 
      // 
      if(!record){
           throw new NotFoundException("Record not found")
      }
      // 
     //  
      const isCancled = await this.prisma.order.findFirst({
        where:{
          id,
          order_status:OrderStatus.CANCELLED
        }
      }) 

     if(isCancled){
       throw new ConflictException("this order is already cancled")
     } 
       

    // 
      const updatedStatus = await this.prisma.order.update({
           where:{
             id,
             userId:user?.id
           },
           data:{
              order_status:OrderStatus.CANCELLED,
              is_placed:false,
           }
      })
      return updatedStatus;
  }



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
}
