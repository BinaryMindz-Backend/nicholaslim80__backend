import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsDate,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RouteType,
  DeliveryTypeName,
  PayType,
  CollectTime,
} from '@prisma/client';
import { CreateDestinationDto } from '../../destination/dto/create-destination.dto';
import { Type } from 'class-transformer';

export class CreateIndiOrderDto {

  @ApiProperty({ enum: RouteType, default: RouteType.ONE_WAY })
  @IsEnum(RouteType)
  route_type: RouteType;

  @ApiProperty({example:false})
  @IsBoolean()
  @IsOptional()
  isFixed: boolean;

  @ApiProperty({ enum: DeliveryTypeName, default: DeliveryTypeName.EXPRESS })
  @IsEnum(DeliveryTypeName)
  delivery_type: DeliveryTypeName;

  @ApiProperty({ example: 3 })
  @IsInt()
  vehicle_type_id: number;

  @ApiProperty({enum:CollectTime, default: CollectTime.ASAP })
  @IsEnum(CollectTime)
  collect_time: CollectTime;

  @ApiProperty({ example: '2025-12-25T10:00:00.000Z' })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  scheduled_time?: Date;


  @ApiPropertyOptional({ example: 250.50 })
  @IsNumber()
  @IsOptional()
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

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  @IsOptional()
  payment_method_id?: number;
   
  @ApiPropertyOptional({ enum: PayType, default: PayType.COD })
  @IsEnum(PayType)
  @IsOptional()
  pay_type: PayType ;

  @ApiProperty({ example: ["link1", "link2"] })
  @IsOptional()
  pick_up_items?: string[];

  @ApiProperty({ type: [CreateDestinationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDestinationDto)
  destinations: CreateDestinationDto[];

}
