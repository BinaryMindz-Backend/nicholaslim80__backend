import {
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResolveDisputeAppealDto {
    @ApiProperty({
        example: 1,
        description: 'Appeal ID to be resolved',
    })
    @IsInt()
    appealId: number;

    @ApiProperty({
        example: 10,
        description: 'Admin ID resolving the appeal',
    })
    @IsInt()
    adminId: number;

    @ApiProperty({
        enum: ['ACCEPTED', 'REJECTED'],
        example: 'ACCEPTED',
        description: 'Appeal resolution status',
    })
    @IsEnum(['ACCEPTED', 'REJECTED'])
    status: 'ACCEPTED' | 'REJECTED';

    @ApiPropertyOptional({
        example: 'Evidence reviewed and appeal approved.',
        description: 'Optional note from admin',
    })
    @IsString()
    @IsOptional()
    adminNote?: string;

    @ApiPropertyOptional({
        enum: ['FULL', 'PARTIAL'],
        example: 'PARTIAL',
        description:
            'Refund type. Required when status is ACCEPTED and financial adjustment is needed.',
    })
    @IsOptional()
    @IsEnum(['FULL', 'PARTIAL'])
    refundType?: string;

    @ApiPropertyOptional({
        example: 150,
        description: 'Total refund amount',
    })
    @IsOptional()
    @IsNumber()
    totalAmount?: number;

    @ApiPropertyOptional({
        example: 20,
        description: 'Company percentage of the refund',
    })
    @IsOptional()
    @IsNumber()
    companyPercent?: number;

    @ApiPropertyOptional({
        example: 80,
        description: 'Rider percentage of the refund',
    })
    @IsOptional()
    @IsNumber()
    riderPercent?: number;
}