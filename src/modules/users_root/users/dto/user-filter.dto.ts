import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum UserStatusFilter {
  ACTIVE = 'active',
  VERIFIED = 'verified',
  DELETED = 'deleted',
  ALL = 'all',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum DateFilter {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_MONTH = 'last_month'
}




// 
export class UserFilterDto {
  @ApiPropertyOptional({
    example: 'active',
    enum: UserStatusFilter,
    description: 'Filter users by status',
  })
  @IsOptional()
  @IsEnum(UserStatusFilter)
  status?: UserStatusFilter;

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
    example: 'createdAt',
    description: 'Which field to sort by',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    example: 'asc',
    enum: SortOrder,
    description: 'Sort order (asc or desc)',
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

  @ApiPropertyOptional({
    example: 'today',
    enum: DateFilter,
    description: 'Date-based filtering for users'
  })
  @IsOptional()
  @IsEnum(DateFilter)
  dateFilter?: DateFilter;

}
