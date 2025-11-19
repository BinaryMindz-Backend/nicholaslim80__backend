import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  RouteType,
  DeliveryTypeName,
} from '@prisma/client';

export class CreateOrderDto {

  @ApiProperty({ enum: RouteType, default: RouteType.ONE_WAY })
  @IsEnum(RouteType)
  route_type: RouteType;

  @ApiProperty({ enum: DeliveryTypeName, default: DeliveryTypeName.EXPRESS })
  @IsEnum(DeliveryTypeName)
  delivery_type: DeliveryTypeName;

  @ApiProperty({ example: 3 })
  @IsInt()
  vehicle_type_id: number;

  @ApiProperty({ example: 250.50 })
  @IsNumber()
  total_cost: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  has_additional_services?: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  is_promo_used?: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  notify_favorite_raider?: boolean;

  @ApiProperty({ example: 2 })
  @IsInt()
  payment_method_id: number;


  @ApiProperty({ example: 5 })
  @IsOptional()
  @IsInt()
  destination_id?: number;

  @ApiProperty({ example: ["link1", "link2"] })
  @IsOptional()
  pick_up_items?: string[];
}
