import { IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ActivityLogQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @ApiProperty({ required: false, default: 1 })
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @ApiProperty({ required: false, default: 10 })
    limit?: number = 10;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    entity_type?: string; // e.g., 'DeliveryType' or 'VehicleType'

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    action?: string; // CREATE, UPDATE, DELETE

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @ApiProperty({ required: false })
    user_id?: number; // filter by user

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    search?: string; // text search inside meta fields
}