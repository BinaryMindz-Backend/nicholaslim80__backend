import { VehicleTypeEnum } from "@prisma/client";
import { IsBoolean, IsEnum, IsNumber, IsOptional } from "class-validator";

export class VehicleTypeQueryDto {
    @IsOptional()
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    limit?: number = 10;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsEnum(VehicleTypeEnum)
    vehicle_type?: VehicleTypeEnum;
}