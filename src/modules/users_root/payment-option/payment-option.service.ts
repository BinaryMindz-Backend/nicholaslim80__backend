import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-option.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-option.dto';
import { IUser } from 'src/types';



@Injectable()
export class PaymentMethodService {
  constructor(private prisma: PrismaService) {}

  // create an pay-methood
  async create(dto: CreatePaymentMethodDto, user: IUser) {
     
    
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
    const record = await this.prisma.paymentMethod.findFirst({
        where:{
             OR:[
               {card_name:dto.card_name},
               {card_number:dto.card_number},
             ]
        }
    })
    //  
    if(record){
         throw new ConflictException("this payment method already exist by this card number or card name")
    }
   

    // 
    return await this.prisma.paymentMethod.create({
      data: {
        userId: user.id,
        card_number: dto.card_number,
        expiry_date: dto.expiry_date ? new Date(dto.expiry_date) : null,
        cvv: dto.cvv,
        card_name: dto.card_name,
      },
    });
  }
  
  // find all payment option
  async findAll(user: IUser) {
    return await this.prisma.paymentMethod.findMany({
      where: { userId: user.id },
      // include: { user: true },
    });
  }
   
  // find one 
  async findOne(id: number, user: IUser) {
    const record = await this.prisma.paymentMethod.findFirst({
      where: { id, userId: user.id },
      // include: { user: true, transactions: true, order: true },
    });

    if (!record) throw new NotFoundException('Payment method not found');
    return record;
  }
  
  // update pay methoods
  async update(id: number, dto: UpdatePaymentMethodDto, user: IUser) {
    await this.findOne(id, user);

    return this.prisma.paymentMethod.update({
      where: { id },
      data: dto,
    });
  }
   
  // delete pay methood
  async remove(id: number, user: IUser) {
    await this.findOne(id, user);

    return this.prisma.paymentMethod.delete({
      where: { id },
    });
  }
}

