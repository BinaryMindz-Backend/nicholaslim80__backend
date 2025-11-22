import { Injectable } from '@nestjs/common';
import { CreateRidersProfileDto } from './dto/create-riders_profile.dto';
import { UpdateRidersProfileDto } from './dto/update-riders_profile.dto';
import { PrismaService } from 'src/core/database/prisma.service';


@Injectable()
export class RidersProfileService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }
  async create(userId: number, createRidersProfileDto: CreateRidersProfileDto) {
    const riderExists = await this.prisma.raider.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!riderExists) {
      throw new Error('Rider not found for the given user ID');
    }

    const res = await this.prisma.raiderRegistration.create({
      data: {
        raiderId: riderExists.id,
        ...createRidersProfileDto,
      },
    });
    return res;
  }

  findAll() {
    return `This action returns all ridersProfile`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ridersProfile`;
  }

  update(id: number, updateRidersProfileDto: UpdateRidersProfileDto) {
    console.log(updateRidersProfileDto);
    return `This action updates a #${id} ridersProfile`;
  }

  remove(id: number) {
    return `This action removes a #${id} ridersProfile`;
  }
}
