import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, IsString } from 'class-validator';

export class AddMoneyTestDto {
    @ApiProperty({ example: 500 }) // in dollars
    @IsNumber()
    @Min(1)
    amount: number;

    @ApiProperty({ example: 'tok_visa' })
    @IsString()
    testToken: string; // Stripe test token
}
