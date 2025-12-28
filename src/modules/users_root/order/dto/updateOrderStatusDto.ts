import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { OrderStatus, PaymentType, PayType } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateOrderStatusDto {
  @ApiProperty({
    example: OrderStatus.PENDING,
    description: 'Order status (PENDING, COMPLETED, CANCELLED, ONGOING)',
  })
  @IsEnum(OrderStatus, { message: 'Invalid order status value' })
  status: OrderStatus;

  @ApiProperty({ enum:PaymentType, default:PaymentType.PAYMENT })
  @IsEnum(PaymentType)
  payType?:PaymentType;
  
  @ApiProperty({ enum:PayType, default:PayType.ONLINE_PAY })
  @IsEnum(PayType)
  paymentMethod?:PayType;
  
  @ApiPropertyOptional({ example: 'pm_1Nxxxxxx', description: 'Optional saved Stripe payment method ID' })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

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
