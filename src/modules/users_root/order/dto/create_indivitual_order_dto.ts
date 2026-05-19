import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsDate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  RouteType,
  CollectTime,
} from '@prisma/client';
import { CreateDestinationDto } from '../../destination/dto/create-destination.dto';
import { Type } from 'class-transformer';

export class CreateIndiOrderDto {

  @ApiProperty({ enum: RouteType, default: RouteType.ONE_WAY })
  @IsEnum(RouteType)
  route_type: RouteType;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  isFixed: boolean;

  @ApiProperty({ example: 1 })
  @IsInt()
  delivery_type_id: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  vehicle_type_id: number;

  @ApiProperty({ enum: CollectTime, default: CollectTime.ASAP })
  @IsEnum(CollectTime)
  collect_time: CollectTime;

  @ApiProperty({ example: '2025-12-25T10:00:00.000Z' })
  @Type(() => Date)
  @IsOptional()
  @IsDate()
  scheduled_time?: Date;


  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  has_additional_services?: boolean;

  @ApiProperty({ type: [CreateDestinationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDestinationDto)
  destinations: CreateDestinationDto[];

}
