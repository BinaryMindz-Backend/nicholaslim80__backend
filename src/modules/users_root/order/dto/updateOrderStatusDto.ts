import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsEnum, IsInt } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateOrderStatusDto {
  @ApiProperty({
    example: OrderStatus.PENDING,
    description: 'Order status (PENDING, COMPLETED, CANCELLED, ONGOING)',
  })
  @IsEnum(OrderStatus, { message: 'Invalid order status value' })
  status: OrderStatus;
}


export class UpdatePendingOrdersDto {
  @ApiProperty({
    description: 'List of order IDs to mark as PENDING',
    example: [101, 102, 103],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Type(() => Number)
  orderIds: number[];
}
