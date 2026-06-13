import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateDisputeAppealDto {
    @ApiProperty({ description: 'The resolved dispute ID to appeal against' })
    @IsInt()
    orderDisputeId: number;

    @ApiProperty({ description: 'The order ID related to the dispute' })
    @IsInt()
    orderId: number;

    @ApiProperty({ description: 'Reason for the appeal' })
    @IsString()
    @IsNotEmpty()
    reason: string;

    @ApiPropertyOptional({ description: 'Supporting file URL (evidence)' })
    @IsOptional()
    @IsString()
    fileUrl?: string;
}