import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { IUser } from 'src/types';
import { CreateMyRaiderDto } from './dto/create-my_raider.dto';
import { UpdateMyRaiderDto } from './dto/update-my_raider.dto';
import { PaginationDto } from 'src/utils/dto/pagination.dto';



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
    if (record) throw new ConflictException("record already exist found")
    //  
    const added = await this.prisma.myRaider.create({
      data: {
        ...dto,
        user_id: user.id,
        raiderId:isRaiderExist.raiderId
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


// my raider
async findAll(userId: number, dto: PaginationDto) {
  const { page = 1, limit = 10 } = dto;

  const skip = (page - 1) * limit;
  const take = limit;

  // 1. Get favorites (with pagination)
  const fav_raiders = await this.prisma.myRaider.findMany({
    where: { user_id: userId },
    skip,
    take,
    orderBy: { created_at: 'desc' },
  });

  if (!fav_raiders.length) {
    return {
      page,
      limit,
      total: 0,
      data: [],
    };
  }

  // Extract IDs
  const raiderFindBy = fav_raiders.map(r => r.find_by);

  // 2. Fetch Raider details
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

  // 3. Merge myRaider + Raider data (FIXED MATCH LOGIC)
  const merged = fav_raiders.map(fav => {
    const raider = raiderDetails.find(
      r =>
        r.contact_number === fav.find_by ||
        r.email_address === fav.find_by
    );

    return {
      ...fav,
      raider: raider || null,
    };
  });

  // 4. Total Count for Pagination
  const total = await this.prisma.myRaider.count({
    where: { user_id: userId },
  });

  return {
    page,
    limit,
    total,
    data: merged,
  };
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

    if (!current) throw new NotFoundException("Not found");

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
