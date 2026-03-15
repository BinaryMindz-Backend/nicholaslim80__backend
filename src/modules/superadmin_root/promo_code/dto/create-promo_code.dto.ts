import { ApiProperty } from "@nestjs/swagger";
import { DiscountType } from "@prisma/client";
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUrl } from "class-validator";

export class CreatePromoCodeDto {
  @ApiProperty({ description: 'Unique promo code string', example: 'NEWYEAR2026' })
  @IsString()
  promoCode: string;
  
  @ApiProperty({ description: 'Desc of promo code', example:"Promo code desc" })
  @IsString()
  discountDesc: string;
  

  @ApiProperty({ description: 'redirect link', example:"promo code reditect link" })
  @IsUrl()
  redirectLink: string;



  @ApiProperty({ description: 'Type of discount', enum: DiscountType, example: DiscountType.PERCENTAGE })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ description: 'Discount value', example: 20 })
  @IsInt()
  discountValue: number;

  @ApiProperty({ description: 'Whether promo code is active', required: false, example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Expiration date of the promo code', example: '2026-12-31T23:59:59Z' })
  @IsDateString()
  expires_at: string;
}
