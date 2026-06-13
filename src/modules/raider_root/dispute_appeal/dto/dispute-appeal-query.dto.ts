import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class DisputeAppealQueryDto {
    @ApiPropertyOptional({ default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number;

    @ApiPropertyOptional({ description: 'Filter by dispute ID' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    orderDisputeId?: number;

    @ApiPropertyOptional({ description: 'Filter by order ID' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    orderId?: number;
}