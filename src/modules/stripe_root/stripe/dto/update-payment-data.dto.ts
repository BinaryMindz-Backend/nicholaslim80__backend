import { ApiProperty, } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class UpdatePaymentDataDto {

  @ApiProperty({ description: 'Customer ID in Stripe', example: 'cus_1N1xxxxxxxtXXXXXXxXxXXXXXXxXx' })
  @IsNotEmpty()
  customerId: string;


  @ApiProperty({ description: 'Payment Method ID in Stripe', example: 'pm_1N1xxxxxxxtXXXXXXxXxXXXXXXxXx' })
  @IsNotEmpty()
  paymentMethodId: string;
}