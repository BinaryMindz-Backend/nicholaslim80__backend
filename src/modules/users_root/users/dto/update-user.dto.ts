import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { Rank } from '@prisma/client';

class UpdateRaiderDto {
  @ApiPropertyOptional({
    example: Rank.PREMIUM,
    description: 'Raider rank',
  })
  @IsOptional()
  @IsString()
  rank?: Rank;
}

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

  // --- New Fields ---

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

  @ApiPropertyOptional({ type: UpdateRaiderDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateRaiderDto)
  raider?: UpdateRaiderDto;
}