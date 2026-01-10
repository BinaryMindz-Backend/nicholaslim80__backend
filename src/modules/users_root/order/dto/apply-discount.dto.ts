import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class ApplyDiscountDto {
  @ApiPropertyOptional({ description: 'Use loyalty coins', example: true })
  @IsBoolean()
  @IsOptional()
  useCoins?: boolean;

  @ApiPropertyOptional({ description: 'Amount of coins to redeem', example: 100 })
  @IsNumber()
  @IsOptional()
  coinsAmount?: number;

  @ApiPropertyOptional({ description: 'Promo code', example: 'SAVE20' })
  @IsString()
  @IsOptional()
  promoCode?: string;
}