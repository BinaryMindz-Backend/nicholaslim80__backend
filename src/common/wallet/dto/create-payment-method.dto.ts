import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max } from 'class-validator';

export class CreatePaymentMethodDto {
    @ApiProperty({ example: '4242424242424242' })
    @IsString()
    cardNumber: string;

    @ApiProperty({ example: 12 })
    @IsInt()
    @Min(1)
    @Max(12)
    expMonth: number;

    @ApiProperty({ example: 2025 })
    @IsInt()
    expYear: number;

    @ApiProperty({ example: '123' })
    @IsString()
    cvc: string;
}
