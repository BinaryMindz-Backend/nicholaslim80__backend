import { IsBoolean, IsNumber, IsOptional } from "class-validator";

export class DeliveryTypeQueryDto {
    @IsOptional()
    @IsNumber()
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    limit?: number = 10;

    @IsOptional()
    @IsBoolean()
    is_active?: boolean;

    @IsOptional()
    @IsNumber()
    priority?: number;
}