import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';


export class CreateVehicleTypeDto {

  @ApiProperty({
    required: true,
    example: 'SUV',
  })
  @IsString()
  vehicle_type: string;

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
