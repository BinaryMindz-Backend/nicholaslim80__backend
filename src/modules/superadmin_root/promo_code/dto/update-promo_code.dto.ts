import { ApiPropertyOptional } from "@nestjs/swagger";
import { DiscountType } from "@prisma/client";
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUrl } from "class-validator";

export class UpdatePromoCodeDto {
  @ApiPropertyOptional({ description: 'Unique promo code string', example: 'NEWYEAR2026' })
  @IsString()
  promoCode: string;

  @ApiPropertyOptional({ description: 'Type of discount', enum: DiscountType, example: DiscountType.PERCENTAGE })
  @IsEnum(DiscountType)
  @IsOptional()
  discountType: DiscountType;

  @ApiPropertyOptional({ description: 'Desc of promo code', example: "Promo code desc" })
  @IsString()
  @IsOptional()
  discountDesc: string;


  @ApiPropertyOptional({ description: 'redirect link', example: "promo code reditect link" })
  @IsUrl()
  @IsOptional()
  redirectLink?: string;


  @ApiPropertyOptional({ description: 'Discount value', example: 20 })
  @IsInt()
  discountValue: number;

  @ApiPropertyOptional({ description: 'Whether promo code is active', required: false, example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Expiration date of the promo code', example: '2026-12-31T23:59:59Z' })
  @IsDateString()
  expires_at: string;
}
