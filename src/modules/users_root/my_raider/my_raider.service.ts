/* eslint-disable @typescript-eslint/no-unsafe-return */
// my-raider.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateMyRaiderDto } from './dto/create-my_raider.dto';
import { IUser } from 'src/types';
import { UpdateMyRaiderDto } from './dto/update-my_raider.dto';


@Injectable()
export class MyRaiderService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMyRaiderDto, user:IUser) {

     if(!dto.find_by || !user){
         throw new NotFoundException("input not found")
     }

     const isRaiderExist = await this.prisma.raiderRegistration.findFirst({
          where:{
              OR:[
                  {contact_number:dto.find_by},
                  {email_address:dto.find_by}
              ]
          }
     })

     if(!isRaiderExist){
         throw new NotFoundException("Raider not found")
     }
    //  
    const record = await this.prisma.myRaider.findFirst({
          where:{
              user_id:user.id
          }
    })
     if(record) throw new ConflictException("record not found")
    //  
     const added = await this.prisma.myRaider.create({
      data: {
         ...dto,
         raider_id:isRaiderExist.id,
         user_id:user.id
      },
    });


    return added
  }


  // 
  async findAll(id:number) {

   const fav_raider = await this.prisma.myRaider.findMany({
    where:{
       user_id:id  
    },
      include: {
        user: true,
      },
    });

    return fav_raider
  }
  
  // 
  async findOne(id: number) {
    return await this.prisma.myRaider.findUnique({
      where: { id },
      include: {
        user: true
      },
    });
  }

  async update(id: number, dto: UpdateMyRaiderDto) {
    return await this.prisma.myRaider.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    return await this.prisma.myRaider.delete({
      where: { id },
    });
  }
}
