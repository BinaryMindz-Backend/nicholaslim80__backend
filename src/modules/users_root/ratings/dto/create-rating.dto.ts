import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeliveryQuality, DeliveryStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum RatingType {
  RAIDER = 'raider',
  CUSTOMER = 'customer',
}

// 

export class CreateRatingDto {
  @ApiProperty({ enum: RatingType })
  @IsEnum(RatingType)
  type: RatingType;

  @ApiProperty({ example: 101 })
  @IsInt()
  orderId: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  raiderId?: number;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsInt()
  user_id?: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating_star: number;

  @ApiPropertyOptional({ example: 'Very polite and fast delivery' })
  @IsOptional()
  @IsString()
  notes?: string;

  // 🔹 Only required when type === RAIDER
  @ApiPropertyOptional({
    enum: DeliveryQuality,
    description: 'Required for raider rating',
  })
  @IsOptional()
  @IsEnum(DeliveryQuality)
  delivery_quality?: DeliveryQuality;

  @ApiPropertyOptional({
    enum: DeliveryStatus,
    description: 'Required for raider rating',
  })
  @IsOptional()
  @IsEnum(DeliveryStatus)
  delivery_status?: DeliveryStatus;
}
