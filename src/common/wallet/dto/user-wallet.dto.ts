import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive, Min } from 'class-validator';

export enum UserRole {
    USER = 'USER',
    RAIDER = 'RAIDER',
    ADMIN = 'ADMIN',
}

export class UserWalletQueryDto {
    @ApiProperty({ description: 'Role of the user', enum: UserRole, example: 'USER' })
    @IsEnum(UserRole)
    @Type(() => String)
    role: UserRole;

    @ApiPropertyOptional({ description: 'Search by username, email, or phone', example: 'John' })
    @IsOptional()
    @Type(() => String)
    search?: string;

    @ApiPropertyOptional({ description: 'Page number', example: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Number of results per page', example: 20 })
    @IsOptional()
    @IsInt()
    @IsPositive()
    @Type(() => Number)
    limit?: number = 20;
}
