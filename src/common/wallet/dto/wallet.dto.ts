import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentType } from '@prisma/client';
import { IsNumber, IsOptional, IsString, IsBoolean, Min, IsEnum } from 'class-validator';




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

    @ApiProperty({ example: 'sgd', default: 'sgd' })
    @IsString()
    @IsOptional()
    currency?: string = 'sgd';

    @ApiProperty({ enum:PaymentType, default:PaymentType.PAYMENT })
    @IsEnum(PaymentType)
    payType?:PaymentType
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

 //
    export class PayWithSavedCardDto {
    @ApiProperty({ example: 12, description: 'payment methood id' })
    @IsString()
    paymentMethodId: string; // id of the saved Stripe card

    @ApiProperty({ example: 12, description: 'amount' })
    @IsNumber()
    amount: number;          // amount to pay
     
    @ApiProperty({ enum:PaymentType, default:PaymentType.PAYMENT })
    @IsEnum(PaymentType)
    payType?:PaymentType
    }





// ---------------- Withdraw Money ----------------
export class WithdrawDto {
    @ApiProperty({ example: 50, description: 'Amount to withdraw from wallet' })
    @IsNumber()
    @Min(1)
    amount: number;
}
