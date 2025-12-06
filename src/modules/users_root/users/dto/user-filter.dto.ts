import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum UserStatusFilter {
  ACTIVE = 'active',
  VERIFIED = 'verified',
  DELETED = 'deleted',
  ALL = 'all',
}

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
}
