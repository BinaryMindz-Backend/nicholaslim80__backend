import {ApiPropertyOptional } from '@nestjs/swagger';
import { RaiderVerification } from '@prisma/client';
import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';


export enum loginTypeDto {
    DIRECT_SIGNIN = "DIRECT_SIGNIN"
}


export enum SortType {
  ASC = 'asc',
  DESC = 'desc',
}
;

import { Type } from 'class-transformer';

export class GetRidersQueryDto {

  @ApiPropertyOptional({
    description: 'Filter by raider name',
    example: 'Rahim',
  })
  @IsOptional()
  @IsString()
  raider_name?: string;


  @ApiPropertyOptional({
    description: 'Raider ID',
    example: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  raiderId?: number;


  @ApiPropertyOptional({
    enum: loginTypeDto,
    description: 'Login type filter',
  })
  @IsOptional()
  @IsEnum(loginTypeDto)
  loginType?: loginTypeDto;


  @ApiPropertyOptional({
    enum: RaiderVerification,
    description: 'Admin verification status',
  })
  @IsOptional()
  @IsEnum(RaiderVerification)
  raider_verificationFromAdmin?: RaiderVerification;


  @ApiPropertyOptional({
    enum: SortType,
    description: 'Sorting order',
    example: SortType.DESC,
  })
  @IsOptional()
  @IsEnum(SortType)
  type?: SortType = SortType.DESC;


  // ================= PAGINATION =================

  @ApiPropertyOptional({
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;


  @ApiPropertyOptional({
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;


  // ================= GLOBAL SEARCH =================

  @ApiPropertyOptional({
    description: 'Search by rider name or email',
    example: 'rahim',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
