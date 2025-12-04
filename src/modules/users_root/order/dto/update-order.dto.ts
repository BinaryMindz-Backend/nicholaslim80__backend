import { PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiProperty({
    enum: OrderStatus,
    required: false,
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  order_status?: OrderStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  is_placed?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  is_pickup?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  is_out_for_delivery?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  raider_confirmation?: boolean;

  @ApiProperty({ example: 10, required: false })
  @IsOptional() 
  @IsInt()
  assign_rider_id?: number;
}
