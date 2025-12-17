import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentMethodDto {
  
  @ApiPropertyOptional({
    description: 'Card number for payment method',
    example: '4242424242424242',
  })
  @IsOptional()
  @IsString()
  card_number?: string;

  @ApiPropertyOptional({
    description: 'Card expiry date (YYYY-MM-DD)',
    example: '2027-12-31',
  })
  @IsOptional()
  @IsDateString()
  expiry_date?: Date;

  @ApiPropertyOptional({
    description: 'CVV code of the card',
    example: '123',
  })
  @IsOptional()
  @IsString()
  cvv?: string;

  @ApiPropertyOptional({
    description: 'Name printed on the card',
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  card_name?: string;
}
