import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SaveCardDto {
  @ApiProperty({
    description: 'Stripe Payment Method ID obtained from frontend',
    example: 'pm_1Nxxxxxxxxxxxx',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;
}
