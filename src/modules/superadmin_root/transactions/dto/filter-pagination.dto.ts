import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';


export enum DateFilter {
    TODAY = 'today',
    YESTERDAY = 'yesterday',
    LAST_7_DAYS = 'last_7_days',
    LAST_30_DAYS = 'last_30_days',
    LAST_MONTH = 'last_month'
}

export enum TransactionStatusFilter {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    ALL = 'all',
}


// 
export class transactionFilterDto {
    @ApiPropertyOptional({
        example: 'active',
        enum: TransactionStatusFilter,
        description: 'Filter transactions by status',
    })
    @IsOptional()
    @IsEnum(TransactionStatusFilter)
    status?: TransactionStatusFilter;

    @ApiPropertyOptional({
        example: 1,
        description: 'Page number for pagination',
        type: Number,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({
        example: 10,
        description: 'Number of items per page',
        type: Number,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number;

    @ApiPropertyOptional({
        example: 'today',
        enum: DateFilter,
        description: 'Date-based filtering for transactions'
    })
    @IsOptional()
    @IsEnum(DateFilter)
    dateFilter?: DateFilter;

}
