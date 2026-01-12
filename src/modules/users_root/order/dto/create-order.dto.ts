import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  RouteType,
  DeliveryTypeName,
  CollectTime,
} from '@prisma/client';


export class CreateOrderDto {

  @ApiProperty({ enum: RouteType, default: RouteType.ONE_WAY })
  @IsEnum(RouteType)
  route_type: RouteType;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  isFixed: boolean;

  @ApiProperty({ enum: DeliveryTypeName, default: DeliveryTypeName.EXPRESS })
  @IsEnum(DeliveryTypeName)
  delivery_type: DeliveryTypeName;

  @ApiProperty({ example: 3 })
  @IsInt()
  vehicle_type_id: number;

  @ApiProperty({ enum: CollectTime, default: CollectTime.ASAP })
  @IsEnum(CollectTime)
  collect_time: CollectTime;

  // @ApiProperty({ example: '2025-12-25T10:00:00.000Z' })
  // @Type(() => Date)
  // @IsOptional()
  // @IsDate()
  // scheduled_time?: Date;

  // @ApiProperty({ example: 250.50 })
  // @IsNumber()
  // total_cost: number;

  // @ApiProperty({ example: false })
  // @IsBoolean()
  // @IsOptional()
  // has_additional_services?: boolean;

  // @ApiProperty({ example: false })
  // @IsBoolean()
  // @IsOptional()
  // is_promo_used?: boolean;

  // @ApiProperty({ example: false })
  // @IsBoolean()
  // @IsOptional()
  // notify_favorite_raider?: boolean;

  // @ApiPropertyOptional({ example: 2 })
  // @IsInt()
  // @IsOptional()
  // payment_method_id?: number;

}
