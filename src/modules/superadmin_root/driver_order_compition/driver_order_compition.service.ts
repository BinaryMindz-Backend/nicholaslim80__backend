/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { UpdateDriverOrderCompitionDto } from './dto/update-driver_order_compition.dto';
import { CreateDriverCompetitionDto } from './dto/create-driver_order_compition.dto';




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
  async update(id: number, dto: UpdateDriverOrderCompitionDto) {
    const existing = await this.findOne(id);
    // 
    if(!existing){
         throw new NotFoundException('Competition config not found');
    }
    // 
    const totalWeights =
      (dto.rank_weight ?? existing.rank_weight) +
      (dto.rating_weight ?? existing.rating_weight) +
      (dto.followers_weight ?? existing.followers_weight);

    return await this.prisma.driver_order_competition.update({
      where: { id },
      data: {
        ...dto,
        total_weights: totalWeights,
      },
    });
  }
   
  // delete competition config
  async remove(id: number) {
    await this.findOne(id);

    return await this.prisma.driver_order_competition.delete({
      where: { id },
    });
  }
}
