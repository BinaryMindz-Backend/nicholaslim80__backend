import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  Min,
  IsDateString,
} from 'class-validator';

export enum UserRole {
  USER = 'USER',
  RAIDER = 'RAIDER',
  ADMIN = 'ADMIN',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class UserWalletQueryDto {

  @ApiProperty({
    description: 'Role of the user',
    enum: UserRole,
    example: 'USER',
  })
  @IsEnum(UserRole)
  role: UserRole;


  @ApiPropertyOptional({
    description: 'Search by username, email, or phone',
    example: 'John',
  })
  @IsOptional()
  search?: string;


  @ApiPropertyOptional({
    description: 'Sort by current wallet balance',
    enum: SortOrder,
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(SortOrder)
  balanceSort?: SortOrder;


  @ApiPropertyOptional({
    description: 'Filter from created date',
    example: '2026-02-01',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;


  @ApiPropertyOptional({
    description: 'Filter until created date',
    example: '2026-02-27',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;


  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;


  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  limit?: number = 10;
}
