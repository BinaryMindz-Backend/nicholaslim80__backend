import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsObject, ValidateNested } from 'class-validator';
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

  @ApiPropertyOptional({
    description: 'Raider related updates',
    type: UpdateRaiderDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateRaiderDto)
  raider?: UpdateRaiderDto;
}
