import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PayType } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class PlaceOrderDto {
  @ApiPropertyOptional({
    description: 'Payment method',
    enum: PayType,
    example: PayType.COD,
  })
  @IsEnum(PayType)
  @IsOptional()
  paymentMethod?: PayType;

  @ApiPropertyOptional({
    description: 'Stripe payment method ID (required for ONLINE_PAY)',
    example: 'pm_1234567890abcdef',
  })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    description: 'Who pays COD (only for COD payment)',
    enum: ['SENDER', 'RECEIVER'],
    example: 'RECEIVER',
  })
  @IsEnum(['SENDER', 'RECEIVER'])
  @IsOptional()
  codCollectFrom?: 'SENDER' | 'RECEIVER';
}

export class CancelOrderDto {
  @ApiPropertyOptional({
    description: 'Cancellation reason',
    example: 'Changed my mind',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

// RAIDER DTOs
export class CompleteStopDto {
  @ApiPropertyOptional({
    description: 'Amount of COD collected (required if stop has payment due)',
    example: 250.50,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  codCollected?: number;

  @ApiPropertyOptional({
    description: 'Delivery notes from raider',
    example: 'Package delivered to receptionist',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: ["link1", "link2"] })
  @IsOptional()
  proofUrls?: string[];
}

export class FailStopDto {
  @ApiProperty({
    description: 'Reason for stop failure',
    example: 'Receiver not available after 3 attempts. Phone switched off.',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
