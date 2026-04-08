import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreatePromoCodeDto } from './dto/create-promo_code.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { UpdatePromoCodeDto } from './dto/update-promo_code.dto';


@Injectable()
export class PromoCodeService {
  constructor(private readonly prisma: PrismaService) {}

  /** CREATE promo code */
  async create(dto: CreatePromoCodeDto, userId: number) {
  try {
    return await this.prisma.$transaction(async (tx) => {
      const existing = await tx.promoCode.findUnique({
        where: { promoCode: dto.promoCode },
      });

      if (existing) {
        return ApiResponses.error(null, `Promo code '${dto.promoCode}' already exists`);
      }

      const expiresDate = new Date(dto.expires_at);

      const promo = await tx.promoCode.create({
        data: {
          title: dto.title,
          promoCode: dto.promoCode,
          discountType: dto.discountType,
          discountValue: dto.discountValue,
          isActive: dto.isActive ?? false,
          expires_at: expiresDate,
          discountDesc: dto.discountDesc,
          redirectLink: dto.redirectLink || null,
        },
      });

      // Activity Log
      await tx.activityLog.create({
        data: {
          action: 'CREATE',
          entity_type: 'PROMO_CODE',
          entity_id: promo.id,
          user_id: userId,
          meta: {
            newData: promo,
          },
        },
      });

      return ApiResponses.success(promo, 'Promo code created successfully');
    });
  } catch (error) {
    return ApiResponses.error(error, 'Failed to create promo code');
  }
}


  /** GET ALL promo codes */
  async findAll() {
    try {
      const promos = await this.prisma.promoCode.findMany();
      return ApiResponses.success(promos, 'Promo codes fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch promo codes');
    }
  }

  /** GET one promo code by id */
  async findOne(id: number) {
    try {
      const promo = await this.prisma.promoCode.findUnique({ where: { id } });
      if (!promo) return ApiResponses.error(null, 'Promo code not found');

      // Check if expired
      if (new Date(promo.expires_at) <= new Date()) {
        return ApiResponses.error(null, 'Promo code has expired');
      }

      // Check if active
      if (!promo.isActive) {
        return ApiResponses.error(null, 'Promo code is inactive');
      }

      return ApiResponses.success(promo, 'Promo code fetched successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to fetch promo code');
    }
  }

  /** UPDATE promo code */
   async update(id: number, dto: UpdatePromoCodeDto, userId: number) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.promoCode.findUnique({ where: { id } });
        if (!existing) return ApiResponses.error(null, 'Promo code not found');

        const updated = await tx.promoCode.update({
          where: { id },
          data: {
            title: dto.title,
            promoCode: dto.promoCode ?? existing.promoCode,
            discountType: dto.discountType ?? existing.discountType,
            discountValue: dto.discountValue ?? existing.discountValue,
            isActive: dto.isActive ?? existing.isActive,
            expires_at: dto.expires_at
              ? new Date(dto.expires_at)
              : existing.expires_at,
          },
        });

        // Log with old + new
        await tx.activityLog.create({
          data: {
            action: 'UPDATE',
            entity_type: 'PROMO_CODE',
            entity_id: id,
            user_id: userId,
            meta: {
              oldData: existing,
              newData: updated,
            },
          },
        });

        return ApiResponses.success(updated, 'Promo code updated successfully');
      });
    } catch (error) {
      return ApiResponses.error(error, 'Failed to update promo code');
    }
  }


  /** DELETE promo code */
    async remove(id: number, userId: number) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const existing = await tx.promoCode.findUnique({ where: { id } });
          if (!existing) return ApiResponses.error(null, 'Promo code not found');

          await tx.promoCode.delete({ where: { id } });

          await tx.activityLog.create({
            data: {
              action: 'DELETE',
              entity_type: 'PROMO_CODE',
              entity_id: id,
              user_id: userId,
              meta: {
                oldData: existing,
              },
            },
          });

          return ApiResponses.success(null, 'Promo code deleted successfully');
        });
      } catch (error) {
        return ApiResponses.error(error, 'Failed to delete promo code');
      }
    }


}
