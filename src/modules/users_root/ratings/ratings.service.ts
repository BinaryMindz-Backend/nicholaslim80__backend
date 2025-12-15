import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";
import { CreateRatingDto, RatingType } from "./dto/create-rating.dto";
import { UpdateRatingDto } from "./dto/update-rating.dto";



@Injectable()
export class RatingService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRatingDto) {
     
      // 
     const order = await this.prisma.order.findUnique({
            where:{
                id:dto.orderId
            }
     })

    if(!order){
        throw new NotFoundException("Order Not Found")
    }
          
    if (dto.type === RatingType.RAIDER) {
      return this.prisma.rateRaider.create({
        data: {
          orderId: dto.orderId,
          raiderId: dto.raiderId,
          user_id: dto.user_id,
          rating_star: dto.rating_star,
          notes: dto.notes,
          delivery_quality:dto.delivery_quality!,
          delivery_status:dto.delivery_status!,
        },
      });
    }

    if (dto.type === RatingType.CUSTOMER) {
      return this.prisma.rateCustomer.create({
        data: {
          orderId: dto.orderId,
          raiderId: dto.raiderId,
          user_id: dto.user_id,
          rating_star: dto.rating_star,
          notes:dto.notes
        },
      });
    }

    throw new BadRequestException('Invalid rating type');
  }

  async findAll(type: RatingType) {
    if (type === RatingType.RAIDER) {
      const [totalCount, stats, data] = await Promise.all([
        this.prisma.rateRaider.count(),
        this.prisma.rateRaider.aggregate({
          _avg: {
            rating_star: true,
          },
        }),
        this.prisma.rateRaider.findMany({
          include: {
            order: true,
            raider: true,
            user: true,
          },
          orderBy: {
            id: 'desc',
          },
        }),
      ]);

      return {
        type,
        totalCount,
        averageRating: stats._avg.rating_star ?? 0,
        data,
      };
    }

    if (type === RatingType.CUSTOMER) {
      const [totalCount, stats, data] = await Promise.all([
        this.prisma.rateCustomer.count(),
        this.prisma.rateCustomer.aggregate({
          _avg: {
            rating_star: true,
          },
        }),
        this.prisma.rateCustomer.findMany({
          include: {
            order: true,
            raider: true,
            user: true,
          },
          orderBy: {
            id: 'desc',
          },
        }),
      ]);

      return {
        type,
        totalCount,
        averageRating: stats._avg.rating_star ?? 0,
        data,
      };
    }

    throw new BadRequestException('Invalid rating type');
  }

  async findOne(type: RatingType, id: number) {
    const rating =
      type === RatingType.RAIDER
        ? await this.prisma.rateRaider.findUnique({
            where: { id },
            include: { order: true, raider: true, user: true },
          })
        : await this.prisma.rateCustomer.findUnique({
            where: { id },
            include: { order: true, raider: true, user: true },
          });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    return rating;
  }

  async update(type: RatingType, id: number, dto: UpdateRatingDto) {
    await this.findOne(type, id);

    if (type === RatingType.RAIDER) {
      return this.prisma.rateRaider.update({
        where: { id },
        data: {
          rating_star: dto.rating_star,
          notes: dto.notes,
        },
      });
    }

    if (type === RatingType.CUSTOMER) {
      return this.prisma.rateCustomer.update({
        where: { id },
        data: {
          rating_star: dto.rating_star,
          notes: dto.notes,
        },
      });
    }

    throw new BadRequestException('Invalid rating type');
  }

  async remove(type: RatingType, id: number) {
    await this.findOne(type, id);

    if (type === RatingType.RAIDER) {
      return this.prisma.rateRaider.delete({ where: { id } });
    }

    if (type === RatingType.CUSTOMER) {
      return this.prisma.rateCustomer.delete({ where: { id } });
    }

    throw new BadRequestException('Invalid rating type');
  }
}
