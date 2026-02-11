import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreatePromoCodeDto } from './dto/create-promo_code.dto';
import { ApiResponses } from 'src/common/apiResponse';
import { DiscountType } from '@prisma/client';
import { UpdatePromoCodeDto } from './dto/update-promo_code.dto';


@Injectable()
export class PromoCodeService {
  constructor(private readonly prisma: PrismaService) {}

  /** CREATE promo code */
  async create(dto: CreatePromoCodeDto) {
    try {
      // Check if promo code already exists
      const existing = await this.prisma.promoCode.findUnique({
        where: { promoCode: dto.promoCode },
      });

      if (existing) {
        return ApiResponses.error(null, `Promo code '${dto.promoCode}' already exists`);
      }

      // Validate discount
      if (dto.discountValue <= 0) {
        return ApiResponses.error(null, 'Discount value must be greater than 0');
      }

      if (dto.discountType === DiscountType.PERCENTAGE && dto.discountValue > 100) {
        return ApiResponses.error(null, 'Percentage discount cannot exceed 100');
      }

      // Validate expiration
      const expiresDate = new Date(dto.expires_at);
      if (expiresDate <= new Date()) {
        return ApiResponses.error(null, 'Expiration date must be in the future');
      }

      // Create promo code
      const promo = await this.prisma.promoCode.create({
        data: {
          promoCode: dto.promoCode,
          discountType: dto.discountType,
          discountValue: dto.discountValue,
          isActive: dto.isActive ?? false,
          expires_at: expiresDate,
        },
      });

      return ApiResponses.success(promo, 'Promo code created successfully');
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
  async update(id: number, dto: UpdatePromoCodeDto) {
    try {
      // Check if promo code exists
      const existing = await this.prisma.promoCode.findUnique({ where: { id } });
      if (!existing) return ApiResponses.error(null, 'Promo code not found');

      // Prevent duplicate promoCode
      if (dto.promoCode && dto.promoCode !== existing.promoCode) {
        const duplicate = await this.prisma.promoCode.findUnique({ where: { promoCode: dto.promoCode } });
        if (duplicate) return ApiResponses.error(null, `Promo code '${dto.promoCode}' already exists`);
      }

      // Validate discount
      if (dto.discountValue !== undefined) {
        if (dto.discountValue <= 0) return ApiResponses.error(null, 'Discount value must be greater than 0');
        if (dto.discountType === DiscountType.PERCENTAGE && dto.discountValue > 100)
          return ApiResponses.error(null, 'Percentage discount cannot exceed 100');
      }

      // Validate expiration
      let expiresDate: Date | undefined;
      if (dto.expires_at) {
        expiresDate = new Date(dto.expires_at);
        if (expiresDate <= new Date()) return ApiResponses.error(null, 'Expiration date must be in the future');
      }

      const updated = await this.prisma.promoCode.update({
        where: { id },
        data: {
          promoCode: dto.promoCode ?? existing.promoCode,
          discountType: dto.discountType ?? existing.discountType,
          discountValue: dto.discountValue ?? existing.discountValue,
          isActive: dto.isActive ?? existing.isActive,
          expires_at: expiresDate ?? existing.expires_at,
        },
      });

      return ApiResponses.success(updated, 'Promo code updated successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to update promo code');
    }
  }

  /** DELETE promo code */
  async remove(id: number) {
    try {
      const existing = await this.prisma.promoCode.findUnique({ where: { id } });
      if (!existing) return ApiResponses.error(null, 'Promo code not found');

      await this.prisma.promoCode.delete({ where: { id } });
      return ApiResponses.success(null, 'Promo code deleted successfully');
    } catch (error) {
      return ApiResponses.error(error, 'Failed to delete promo code');
    }
  }
}
