import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ example: 50.00, description: 'Amount in SGD' })
  @IsNumber()
  @Min(1.00, { message: 'Minimum top-up is $1.00 SGD' })
  amount: number;

  @ApiProperty({ example: 'sgd', default: 'sgd' })
  @IsString()
  @IsOptional()
  currency?: string = 'sgd';
}