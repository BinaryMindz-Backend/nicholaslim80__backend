import { ApiPropertyOptional } from "@nestjs/swagger";
import { PayType } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateTipDto {
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
        description: 'Amount of tip',
        example: 250.50,
        minimum: 0,
    })
    @IsNumber()
    @Min(0)
    @IsOptional()
    amount?: number;
}