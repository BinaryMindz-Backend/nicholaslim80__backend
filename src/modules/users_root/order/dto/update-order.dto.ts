import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { OrderStatus, PayType } from '@prisma/client';

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


export class NotifyRaider {
  @ApiProperty({ required: true })
  @IsBoolean()
  notify_rider: boolean;

}

export class PriorityOrder {

      @ApiPropertyOptional({
      description: 'Payment method',
      enum: PayType,
      example: PayType.ONLINE_PAY,
      })
      @IsEnum(PayType)
      @IsOptional()
      payType?: PayType;

      @ApiPropertyOptional({
      description: 'Stripe payment method ID (required for ONLINE_PAY)',
      example: 'pm_1234567890abcdef',
      })
      @IsString()
      @IsOptional()
      paymentMethodId?: string;


      @ApiProperty({example:10, required:true})
      @IsInt()
      amount : number
}