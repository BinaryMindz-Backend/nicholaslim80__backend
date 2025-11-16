import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
} from 'class-validator';

export class CreateVehicleTypeDto {
  @ApiProperty({ required: false, example: { seats: 4, category: 'SUV' } })
  @IsOptional()
  @IsObject()
  vehicle_type?: Record<string, any>;

  @ApiProperty({ required: false, example: 50.0 })
  @IsOptional()
  @IsNumber()
  base_price?: number;

  @ApiProperty({ required: false, example: 12.5 })
  @IsOptional()
  @IsNumber()
  per_km_price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  peak_pricing?: boolean;

  @ApiProperty({ required: false, example: '6ft x 4ft' })
  @IsOptional()
  @IsString()
  dimension?: string;

  @ApiProperty({ required: false, example: 300 })
  @IsOptional()
  @IsNumber()
  max_load?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVehicleTypeDto extends PartialType(CreateVehicleTypeDto) {}
