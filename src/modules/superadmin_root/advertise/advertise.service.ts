/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateAdvertiseDto } from './dto/create-advertise.dto';
import { UpdateAdvertiseDto } from './dto/update-advertise.dto';


@Injectable()
export class AdvertiseService {
  constructor(private prisma: PrismaService) {}

  // CREATE
    async create(dto: CreateAdvertiseDto) {
      const currentDate = new Date();
      const startDate = new Date(dto.start_date);
      const endDate = new Date(dto.end_date);
      // Validate: start date must be in future
      if (startDate < currentDate) {
        throw new NotAcceptableException(
          'Start date must be equal or greater than the current date',
        );
      }

      // Validate: end date must be in future
      if (endDate < currentDate) {
        throw new NotAcceptableException(
          'End date must be greater than the current date',
        );
      }

      // Validate: end date must be after start date
      if (endDate <= startDate) {
        throw new NotAcceptableException(
          'End date must be greater than start date',
        );
      }

      const record = await this.prisma.advertise.findFirst({
           where:{
               ad_title:dto.ad_title
           }
      })

       if(record){
           throw new NotFoundException("Record exist")
       } 
      //  
      const res = await this.prisma.advertise.create({
        data: {
          ...dto,
          start_date: startDate,
          end_date: endDate,
        },
      });

      return res;
    }


  // FIND ALL FOR ADMIN
  async findAll( page: number = 1, limit: number = 20) {
    // 
    const skip  = (page -1) * limit
    // 

    const advertise = await this.prisma.advertise.findMany({
      include: {
        analytics: true,
      },
      take:limit,
      skip,
      orderBy:{
          created_at:"desc"
      }
    });

    const total = await this.prisma.advertise.count()
    return {
        data: advertise,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    }
  }

   
    // FIND ALL
   async findAllRoleBased( page: number = 1, limit: number = 20, role:string | undefined) {
      // 
      const skip  = (page -1) * limit
      // 

      const advertise = await this.prisma.advertise.findMany({
        where:{
          create_for:role,
          status:true,
        },
        include: {
          analytics: true,
        },
        orderBy:{
          created_at:"desc"
        },
        take:limit,
        skip
      });

      const total = await this.prisma.advertise.count()
      return {
          data: advertise,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
      }
  }

  // FIND ONE
  async findOne(id: number) {
    const ad = await this.prisma.advertise.findUnique({
      where: { id },
      include: { analytics: true },
    });

    if (!ad) throw new NotFoundException('Advertise not found');
    return ad;
  }


  // UPDATE
  async update(id: number, dto: UpdateAdvertiseDto) {
    // 
    await this.prisma.advertise.findFirst({
         where:{
          ad_title:dto.ad_title,
          id:{
             not:id
          }
         }
    });
    // 
    return this.prisma.advertise.update({
      where: { id },
      data: dto,
    });
  }

// UPDATE STATUS (toggle true/false)
async statusUpdate(id: number) {
  const ad = await this.findOne(id);
  if (!ad) throw new NotFoundException('Advertise not found');

  // Toggle status
  const newStatus = !ad.status;
  return this.prisma.advertise.update({
    where: { id },
    data: { status: newStatus },
  });
}


  // DELETE
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.advertise.delete({
      where: { id },
    });
  }

  // ANALYTICS STATS
  async getStats(id: number) {
    const stats = await this.prisma.advertiseAnalytics.aggregate({
      where: { advertiseId: id },
      _sum: {
        impression: true,
        click: true,
      },
    });

    const totalImpression = stats._sum.impression || 0;
    const totalClick = stats._sum.click || 0;
    const ctr = totalImpression > 0 ? (totalClick / totalImpression) * 100 : 0;

    return {
      advertiseId: id,
      totalImpression,
      totalClick,
      ctr: Number(ctr.toFixed(2)),
    };
  }

  // GLOBAL TOTAL STATS
    async getTotalStats() {
        // Count total ads
        const totalAds = await this.prisma.advertise.count();

        // Count active/expired/running
        const now = new Date();

        const activeAds = await this.prisma.advertise.count({
          where: {
            start_date: { lte: now },
            end_date: { gte: now },
          },
        });

        const expiredAds = await this.prisma.advertise.count({
          where: {
            end_date: { lt: now },
          },
        });

        const scheduledAds = await this.prisma.advertise.count({
          where: {
            start_date: { gt: now },
          },
        });

        // Aggregate total impressions & clicks
        const analytics = await this.prisma.advertiseAnalytics.aggregate({
          _sum: {
            impression: true,
            click: true,
          },
        });

        const totalImpression = analytics._sum.impression || 0;
        const totalClick = analytics._sum.click || 0;

        const avgCtr =
          totalImpression > 0 ? Number(((totalClick / totalImpression) * 100).toFixed(2)) : 0;

  return {
    totalAds,
    activeAds,
    expiredAds,
    scheduledAds,
    totalImpression,
    totalClick,
    avgCtr,
  };
}

  async addImpression(advertiseId: number) {
    return await this.prisma.advertiseAnalytics.create({
      data: { advertiseId, impression: 1 },
    });
  }

  async addClick(advertiseId: number) {
    return await this.prisma.advertiseAnalytics.create({
      data: { advertiseId, click: 1 },
    });
  }







}
