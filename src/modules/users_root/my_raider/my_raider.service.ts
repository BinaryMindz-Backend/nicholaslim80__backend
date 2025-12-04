// my-raider.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateMyRaiderDto } from './dto/create-my_raider.dto';
import { IUser } from 'src/types';
import { UpdateMyRaiderDto } from './dto/update-my_raider.dto';


@Injectable()
export class MyRaiderService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateMyRaiderDto, user: IUser) {

    if (!dto.find_by || !user) {
      throw new NotFoundException("input not found")
    }

    const isRaiderExist = await this.prisma.raiderRegistration.findFirst({
      where: {
        OR: [
          { contact_number: dto.find_by },
          { email_address: dto.find_by }
        ]
      }
    })

    if (!isRaiderExist) {
      throw new NotFoundException("Raider not found")
    }
    //  
    const record = await this.prisma.myRaider.findFirst({
      where: {
        user_id: user.id
      }
    })
    if (record) throw new ConflictException("record not found")
    //  
    const added = await this.prisma.myRaider.create({
      data: {
        ...dto,
        user_id: user.id
      },
    });


    return added
  }


  // 
  async findAllforAdmin(userId: number) {
    // 1. Get all favorite raider records for this user
    const fav_raiders = await this.prisma.myRaider.findMany({
      where: { user_id: userId, is_fav: true },
      include: {
        user: true
      }
    });

    if (!fav_raiders.length) return [];

    // Extract all raider IDs
    const raiderFindBy = fav_raiders.map(r => r.find_by);

    // 2. Fetch all matching raider details
    const raiderDetails = await this.prisma.raiderRegistration.findMany({
      where: {
        OR: [
          { contact_number: { in: raiderFindBy }, },
          { email_address: { in: raiderFindBy }, }
        ]
      }
    });
    // 3. Merge myRaider + Raider Data
    const merged = fav_raiders.map(fav => ({
      ...fav,
      raider: raiderDetails.find(r => r.contact_number || r.email_address === fav.find_by) || null,
    }));
    return merged;
  }


  // 
  async findAll(userId: number) {
    // 1. Get all favorite raider records for this user
    const fav_raiders = await this.prisma.myRaider.findMany({
      where: { user_id: userId }
    });

    if (!fav_raiders.length) return [];

    // Extract all raider IDs
    const raiderFindBy = fav_raiders.map(r => r.find_by);

    // 2. Fetch raider details — SELECT ONLY REQUIRED FIELDS
    const raiderDetails = await this.prisma.raiderRegistration.findMany({
      where: {
        OR: [
          { contact_number: { in: raiderFindBy } },
          { email_address: { in: raiderFindBy } },
        ],
      },
      select: {
        id: true,
        raiderId: true,
        raider_name: true,
        contact_number: true,
        email_address: true,
      },
    });
    // 3. Merge myRaider + Raider Data
    const merged = fav_raiders.map(fav => ({
      ...fav,
      raider: raiderDetails.find(r => r.contact_number || r.email_address === fav.find_by) || null,
    }));
    return merged;
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

  // make it is fav
  async isFavourite(id: number) {
    // get current value
    const current = await this.prisma.myRaider.findUnique({
      where: { id },
      select: { is_fav: true },
    });

    if (!current) throw new Error("Not found");

    // toggle the value
    return await this.prisma.myRaider.update({
      where: { id },
      data: {
        is_fav: !current.is_fav,
      },
    });
  }


  // 
  async remove(id: number) {
    return await this.prisma.myRaider.delete({
      where: { id },
    });
  }
}
