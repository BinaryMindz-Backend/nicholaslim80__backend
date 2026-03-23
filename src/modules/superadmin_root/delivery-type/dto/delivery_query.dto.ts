import { IsBoolean, IsNumber, IsOptional, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class DeliveryTypeQueryDto {

    @ApiPropertyOptional({ example: 1, default: 1, description: 'Page number for pagination' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 10, default: 10, description: 'Number of items per page' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 10;

    @ApiPropertyOptional({ example: true, description: 'Filter by active status' })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    is_active?: boolean;

    @ApiPropertyOptional({ example: 5, description: 'Filter by priority (1-10)' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    priority?: number;
}