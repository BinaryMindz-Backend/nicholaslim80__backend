import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({
    example: OrderStatus.PENDING,
    description: 'Order status (PENDING, COMPLETED, CANCELLED, ONGOING)',
  })
  @IsEnum(OrderStatus, { message: 'Invalid order status value' })
  status: OrderStatus;
}
