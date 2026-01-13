import { ApiPropertyOptional } from "@nestjs/swagger";
import { CollectTime, DeliveryTypeName, RouteType } from "@prisma/client";
import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional } from "class-validator";

export class UpdateOrderDetailsDto {
  @ApiPropertyOptional({ enum: DeliveryTypeName })
  @IsEnum(DeliveryTypeName)
  @IsOptional()
  delivery_type?: DeliveryTypeName;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isFixed?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  vehicle_type_id?: number;

  @ApiPropertyOptional({ enum: RouteType })
  @IsEnum(RouteType)
  @IsOptional()
  route_type?: RouteType;

  @ApiPropertyOptional({ enum: CollectTime, default: CollectTime.ASAP })
  @IsOptional()
  @IsEnum(CollectTime)
  collect_time?: CollectTime;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  scheduled_time?: string;
}