import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import type { IUser } from 'src/types';

@Injectable()
export class DestinationService {
  constructor(private prisma: PrismaService) {}
   

  // 
  async create(dto: CreateDestinationDto, user:IUser){

     if(!user){
         throw new NotFoundException("Verified User Not found")
     }

     const isUserExist = this.prisma.user.findUnique({
       where:{
          id:user?.id,
       }
     })
     if(isUserExist === null) throw new UnauthorizedException("You Are Not Authorize")

    const isExist = await this.prisma.destination.findFirst({
      where: {
           OR:[
            {latitude: dto.latitude},
            {longitude: dto.longitude},
           ],
           user_id:user?.id
      }
    })
     if(isExist){
          throw new ConflictException("Destination is already exists")
     }

   
    return this.prisma.destination.create({ data:{
          address:dto.address,
          floor_unit:dto.floor_unit,
          contact_name:dto.contact_name,
          contact_number:dto.contact_number,
          note_to_driver:dto.note_to_driver,
          is_saved:dto.is_saved,
          type:dto.type,
          latitude:dto.latitude,
          longitude:dto.longitude,
          accuracy:dto.accuracy,
          user_id:user.id,
          order_id:dto.order_id
    } });
  }
  
  //
  async findAll(user:IUser) {
    return this.prisma.destination.findMany({
       where:{
          user_id:user.id
       }
    });
  }
  
  // 
  async findOne(id: number) {

    return this.prisma.destination.findUnique({ where: { id }});
  }
  
  // 
  async update(id: number, dto: UpdateDestinationDto, user:IUser) {
    //  
    if(!id){
       throw new NotFoundException("destination id not found")
    }
    // 
    const isUserExist = this.prisma.user.findUnique({
      where:{
        id:user?.id,
      }
    })
    if(isUserExist === null) throw new UnauthorizedException("You Are Not Authorize")

    // 
    const isExist = await this.prisma.destination.findUnique({
      where: {
          id
      }
    })
    // 
     if(!isExist){
          throw new ConflictException("Destination is already exists")
     }

    // 
    return this.prisma.destination.update({
      where: { id },
      data:dto,
    });
  }
  
  // 
 async remove(id: number, user:IUser) {
        //  
        if(!id){
           throw new NotFoundException("destination id not found")
        }
        
          const isUserExist = this.prisma.user.findUnique({
            where:{
                id:user?.id,
            }
          })
          if(isUserExist === null) throw new UnauthorizedException("You Are Not Authorize")

        // 
        const isExist = await this.prisma.destination.findFirst({
            where: {
              id,
              user_id:user?.id
            }
        })
        // 
        if(!isExist){
          throw new ConflictException("destination not found by this id")
        }
        // 

      return this.prisma.destination.delete({ where: { id } });
  }
}
