import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsBoolean, IsOptional, IsNumber } from 'class-validator';
import { DeliveryTypeName } from '@prisma/client';

export class CreateDeliveryTypeDto {
  @ApiProperty({ enum: DeliveryTypeName, description: 'Type of delivery' })
  @IsEnum(DeliveryTypeName)
  name: DeliveryTypeName;

  @ApiProperty({ required: false, description: 'Percentage charge for this delivery type' })
  @IsOptional()
  @IsNumber()
  percentage?: number;

  @ApiProperty({ example: 75, description: 'Pickup duration in minutes' })
  @IsOptional()
  @IsNumber()
  pickup_duration?: number;

  @ApiProperty({ example: 90, description: 'Delivery duration in minutes' })
  @IsOptional()
  @IsNumber()
  delivery_duration?: number;

  @ApiProperty({ required: false, description: 'Is this delivery type active?' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}