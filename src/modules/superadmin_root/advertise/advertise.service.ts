import { Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateAdvertiseDto } from './dto/create-advertise.dto';
import { UpdateAdvertiseDto } from './dto/update-advertise.dto';
import { performanceCountType } from 'src/types';


@Injectable()
export class AdvertiseService {
  constructor(private prisma: PrismaService) { }

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
      where: {
        ad_title: dto.ad_title
      }
    })

    if (record) {
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
  async findAll(page: number = 1, limit: number = 20) {
    // 
    const skip = (page - 1) * limit
    // 

    const advertise = await this.prisma.advertise.findMany({
      include: {
        analytics: true,
      },
      take: limit,
      skip,
      orderBy: {
        created_at: "desc"
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

   
    // FIND ALL FOR ROLE BASED USER
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
      where: {
        ad_title: dto.ad_title,
        id: {
          not: id
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
    async getTotalStats(role:string) {
        // Count total ads
        const totalAds = await this.prisma.advertise.count({
            where:{
              create_for:role
            }
        });

        // Count active/expired/running
        const now = new Date();

        const activeAds = await this.prisma.advertise.count({
          where: {
            start_date: { lte: now },
            end_date: { gte: now },
            create_for:role
          },
        });

        const expiredAds = await this.prisma.advertise.count({
          where: {
            end_date: { lt: now },
            create_for:role
          },
        });

        const scheduledAds = await this.prisma.advertise.count({
          where: {
            start_date: { gt: now },
            create_for:role
          },
        });

        // Aggregate total impressions & clicks
          const where: any = {};

            // If role is provided, filter analytics by related advertisement role
            if (role) {
              where.advertise = {
                create_for: role,
              };
            }

            const analytics = await this.prisma.advertiseAnalytics.aggregate({
              where,
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

  // GLOBAL PERFORMANCE STATS
async getPerformanceTrands(role?: string, months = 1) {
  const { start, end } = this.getDateRange(months);
  const now = new Date();

  const advertiseWhere: any = {
    created_at: {
      gte: start,
      lte: end,
    },
  };

  if (role) advertiseWhere.create_for = role;

  // -----------------------------
  // AD COUNTS
  // -----------------------------
  const totalAds = await this.prisma.advertise.count({
    where: advertiseWhere,
  });

  const activeAds = await this.prisma.advertise.count({
    where: {
      ...advertiseWhere,
      start_date: { lte: now },
      end_date: { gte: now },
    },
  });

  const expiredAds = await this.prisma.advertise.count({
    where: {
      ...advertiseWhere,
      end_date: { lt: now },
    },
  });

  const scheduledAds = await this.prisma.advertise.count({
    where: {
      ...advertiseWhere,
      start_date: { gt: now },
    },
  });

  // -----------------------------
  // ANALYTICS (TOTAL)
  // -----------------------------
  const analyticsWhere: any = {
    createdAt: {
      gte: start,
      lte: end,
    },
  };

  if (role) {
    analyticsWhere.advertise = { create_for: role };
  }

  const analytics = await this.prisma.advertiseAnalytics.aggregate({
    where: analyticsWhere,
    _sum: {
      impression: true,
      click: true,
    },
  });

  const totalImpression = analytics._sum.impression ?? 0;
  const totalClick = analytics._sum.click ?? 0;
  const avgCtr = totalImpression > 0 ? +(totalClick / totalImpression * 100).toFixed(2) : 0;

  // -----------------------------
  // WEEKLY BREAKDOWN (ARRAY)
  // -----------------------------
  const weeklyStats:performanceCountType= [];

  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + i * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 10);// TODO: change 6 to 10 for testing

    const weekly = await this.prisma.advertiseAnalytics.aggregate({
      where: {
        createdAt: {
          gte: weekStart,
          lte: weekEnd,
        },
        ...(role && { advertise: { create_for: role } }),
      },
      _sum: {
        impression: true,
        click: true,
      },
    });
  console.log(weekly, weekEnd, "week start -->",weekStart);
    const impression = weekly._sum.impression ?? 0;
    const click = weekly._sum.click ?? 0;
    weeklyStats.push({
      week: `Week ${i + 1}`,
      impression,
      click,
      ctr: impression > 0 ? +(click / impression * 100).toFixed(2) : 0,
    });
  }

  // -----------------------------
  // RESPONSE
  // -----------------------------
  return {
    range: {
      from: start,
      to: end,
      months,
    },
    totalAds,
    activeAds,
    expiredAds,
    scheduledAds,
    totalImpression,
    totalClick,
    avgCtr,
    weeklyStats,
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



    private getDateRange(months = 1) {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - months);
      return { start, end };
    }




}
