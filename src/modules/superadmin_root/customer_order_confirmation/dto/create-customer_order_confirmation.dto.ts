import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateCustomerOrderConfirmationDto {
  @ApiProperty({ example: 10, description: 'Weight for new customer' })
  @IsInt()
  @Min(0)
  is_new_customer_weight: number;

  @ApiProperty({ example: 10, description: 'Weight for completed orders > threshold' })
  @IsInt()
  @Min(0)
  completed_orders_weight: number;

  @ApiProperty({ example: 80, description: 'Weight for customer rating by driver' })
  @IsInt()
  @Min(0)
  followers_weight: number;
}
