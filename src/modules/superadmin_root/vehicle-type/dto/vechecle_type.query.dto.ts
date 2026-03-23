import { VehicleTypeEnum } from "@prisma/client";
import { IsBoolean, IsEnum, IsNumber, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class VehicleTypeQueryDto {
    
    @ApiPropertyOptional({ example: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page?: number = 1;

    @ApiPropertyOptional({ example: 10, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit?: number = 10;

    @ApiPropertyOptional({ example: true, description: 'Filter by active status' })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        enum: VehicleTypeEnum,
        description: 'Filter by vehicle type',
    })
    @IsOptional()
    @IsEnum(VehicleTypeEnum)
    vehicle_type?: VehicleTypeEnum;
}