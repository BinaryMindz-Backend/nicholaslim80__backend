import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsBoolean, Min } from 'class-validator';

// ---------------- Add Money ----------------
export class AddMoneyDto {
    @ApiProperty({ example: 100, description: 'Amount to add to wallet' })
    @IsNumber()
    @Min(1)
    amount: number;

    @ApiPropertyOptional({ example: 'pm_1Nxxxxxx', description: 'Optional saved Stripe payment method ID' })
    @IsOptional()
    @IsString()
    paymentMethodId?: string;
}

// ---------------- Save Payment Method ----------------
export class SavePaymentMethodDto {
    @ApiProperty({ example: 'pm_1Nxxxxxx', description: 'Stripe payment method ID' })
    @IsString()
    paymentMethodId: string;

    @ApiProperty({ example: 'card', description: 'Payment method type (card, apple_pay, etc.)' })
    @IsString()
    type: string;

    @ApiProperty({ example: '4242', description: 'Last 4 digits of card' })
    @IsString()
    last4: string;

    @ApiProperty({ example: 12, description: 'Expiration month' })
    @IsNumber()
    expMonth: number;

    @ApiProperty({ example: 2030, description: 'Expiration year' })
    @IsNumber()
    expYear: number;

    @ApiPropertyOptional({ example: true, description: 'Set as default payment method' })
    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}

// ---------------- Withdraw Money ----------------
export class WithdrawDto {
    @ApiProperty({ example: 50, description: 'Amount to withdraw from wallet' })
    @IsNumber()
    @Min(1)
    amount: number;
}
