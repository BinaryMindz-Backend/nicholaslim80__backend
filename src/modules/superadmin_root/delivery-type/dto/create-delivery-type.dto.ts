import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsString,
  Min,
  Max,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { TimeUnit } from '@prisma/client';

export class CreateDeliveryTypeDto {
  @ApiProperty({ required: true })
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 0.75, description: 'Price multiplier (can be < 1.0)' })
  @IsNumber()
  price_multiplier: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  collection_time: number;

  @ApiProperty({ enum: TimeUnit, default: TimeUnit.MINUTES })
  @IsEnum(TimeUnit)
  collection_unit: TimeUnit;

  @ApiProperty({ example: 60 })
  @IsNumber()
  delivery_time: number;

  @ApiProperty({ enum: TimeUnit, default: TimeUnit.MINUTES })
  @IsEnum(TimeUnit)
  delivery_unit: TimeUnit;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  allow_stack?: boolean;

  @ApiProperty({ example: 5, minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  priority: number;

  @ApiProperty({
    example: [1, 2],
    description: 'Allowed vehicle type IDs',
  })
  @IsArray()
  @ArrayNotEmpty()
  vehicle_type_ids: number[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}