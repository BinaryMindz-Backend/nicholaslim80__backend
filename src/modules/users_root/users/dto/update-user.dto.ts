import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEmail,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'john_doe' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+8801712345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://cdn.app/avatar.png' })
  @IsOptional()
  @IsString()
  image?: string;

  // ================= EXTRA PROFILE =================
  @ApiPropertyOptional({ example: '1995-12-30' })
  @IsOptional()
  @IsDateString()
  dob?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  bank_account_num?: string;

  @ApiPropertyOptional({ example: 'Chase Bank' })
  @IsOptional()
  @IsString()
  bank_name?: string;

  // ================= TIER (REPLACES RANK) =================
  @ApiPropertyOptional({
    example: 2,
    description: 'Driver Tier ID (Bronze=1, Silver=2, Gold=3, etc.)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  tier_id?: number;
}