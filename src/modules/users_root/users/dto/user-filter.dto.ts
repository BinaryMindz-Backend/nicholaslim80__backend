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
    example: 'john',
    description: 'Search by username, email or phone',
  })
  @IsOptional()
  @IsString()
  search?: string;


  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;


  @ApiPropertyOptional({
    example: 10,
    description: 'Items per page',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;


  @ApiPropertyOptional({
    example: 'created_at',
    description: 'Field used for sorting',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;


  @ApiPropertyOptional({
    example: 'desc',
    enum: SortOrder,
    description: 'Sorting direction',
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;


  @ApiPropertyOptional({
    example: 'today',
    enum: DateFilter,
    description: 'Date filtering',
  })
  @IsOptional()
  @IsEnum(DateFilter)
  dateFilter?: DateFilter;
}

