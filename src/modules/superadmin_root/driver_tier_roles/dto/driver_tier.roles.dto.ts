import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

import { Type } from 'class-transformer';


// ================= ENUM =================
export enum DriverTierCode {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}


// ================= CREATE TIER DTO =================
export class CreateDriverTierDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: DriverTierCode })
  @IsEnum(DriverTierCode)
  code: DriverTierCode;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // RULES (ONLY WHAT SERVICE USES)

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minOrders?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minRating?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minCompletionRate?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  maxCancellationRate?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  requiresBranding?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isInvitationOnly?: boolean;
}


// ================= UPDATE DTO =================
export class UpdateDriverTierDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // RULES (ONLY WHAT SERVICE USES)
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minOrders?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minRating?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minCompletionRate?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  maxCancellationRate?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  requiresBranding?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isInvitationOnly?: boolean;
}


// ================= PROMOTE DTO =================
export class PromoteRaiderDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  tierId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;
}