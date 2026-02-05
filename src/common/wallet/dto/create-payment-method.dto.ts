import { ApiProperty } from '@nestjs/swagger';
import { PaymentType, PayType } from '@prisma/client';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SaveCardDto {
  @ApiProperty({
    description: 'Stripe Payment Method ID obtained from frontend',
    example: 'pm_1Nxxxxxxxxxxxx',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}



// for create payment intent
export class CreatePaymentIntentDto {
  @ApiProperty({ example: 50.0, description: 'Amount in SGD' })
  @IsNumber()
  @Min(1.0, { message: 'Minimum top-up is $1.00 SGD' })
  amount: number;

  @ApiProperty({ example: 'sgd', default: 'sgd' })
  @IsString()
  @IsOptional()
  currency?: string = 'sgd';

  @ApiProperty({
    example: 123,
    description: 'Related order ID (if payment is for an order)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  orderId?: number;

  @ApiProperty({
    example: PayType.ONLINE_PAY,
    description: 'Payment method or type (e.g. ONLINE_PAY, COD, WALLET)',
    required: false,
  })
  @IsString()
  @IsOptional()
  payType?: string;

  @ApiProperty({
    example: PaymentType.ADD_MONEY,
    description: 'Payment intent type (e.g. ADD_MONEY, PAYMENT)',
    required: false,
  })
  @IsString()
  @IsOptional()
  type?: string;
}
