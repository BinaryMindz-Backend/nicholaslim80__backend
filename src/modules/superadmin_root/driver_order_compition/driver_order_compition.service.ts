import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { UpdateDriverOrderCompitionDto } from './dto/update-driver_order_compition.dto';
import { CreateDriverCompetitionDto } from './dto/create-driver_order_compition.dto';
import { IUser } from 'src/types';




@Injectable()
export class DriverCompetitionService {
  constructor(private prisma: PrismaService) {}
  // CREATE competition config
  async create(dto:CreateDriverCompetitionDto) {

    const totalWeights =
      dto.rank_weight +
      dto.rating_weight +
      dto.followers_weight;

    return await this.prisma.driver_order_competition.create({
      data: {
        ...dto,
        total_weights: totalWeights,
      },
    });
  }
 
  
  // find all competition configs
  async findAll() {
    //  
   const res = await this.prisma.driver_order_competition.findMany({
      orderBy: { created_at: 'desc' },
    });
    // 
    return res; 
  }
  
    // find all competition change logs
  async findAllLogs(date:string) {
    //  
   const res = await this.prisma.driver_order_competition_change_logs.findMany({
      where:{
          created_at:{
              gte:new Date(date)
          }
      },
      orderBy: { created_at: 'desc' },
    });
    // 
    return res; 
  }
  
  // find one competition config
  async findOne(id: number) {
    const config = await this.prisma.driver_order_competition.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException('Competition config not found');
    }

    return config;
  }
  
  // UPDATE competition config
  async update(id: number, dto: UpdateDriverOrderCompitionDto, user:IUser) {
    const existing = await this.findOne(id);
    // 
    if(!existing){
         throw new NotFoundException('Competition config not found');
    }
    // 
    const admin = await this.prisma.admin.findFirst({
        where:{
            userId:user.id
        }
    });
    if(!admin){
         throw new NotFoundException('Admin not found for the user');
    }

    // 
    const totalWeights =
      (dto.rank_weight ?? existing.rank_weight) +
      (dto.rating_weight ?? existing.rating_weight) +
      (dto.followers_weight ?? existing.followers_weight);
    
    const res = await this.prisma.$transaction(async (tx) => {
         await tx.driver_order_competition.update({
            where: { id },
            data: {
              ...dto,
              total_weights: totalWeights,
            },
      });
        await tx.driver_order_competition_change_logs.create({
           data:{
               rank:dto.rank_weight ?? existing.rank_weight,
               rating:dto.rating_weight ?? existing.rating_weight,
               created_by:admin.id,
               max_users_to_join:dto.max_users_to_join ?? existing.max_users_to_join,
               challenges_timeout:dto.challenges_timeout ?? existing.challenges_timeout,
               followers_weight:dto.followers_weight ?? existing.followers_weight,
           }
      })
       
      return {
         massage: 'Update successful and log created', 
      }
    
    } );  

    return res;
  }
   
}
