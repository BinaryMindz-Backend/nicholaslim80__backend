/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsEmail, IsEnum, IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiPropertyOptional({ description: 'Username of the user' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ description: 'Email address of the user' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Phone number of the user' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Password of the user' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ enum: UserRole, description: 'Role of the user' })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ description: 'Balance of the user', default: 0 })
  @IsOptional()
  @IsNumber()
  balance?: number;

  @ApiPropertyOptional({ description: 'Achive rewards point', default: 0 })
  @IsOptional()
  @IsNumber()
  achive_rewards_point?: number;

  @ApiPropertyOptional({ description: 'Status of the user', default: false })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({ description: 'Whether user is verified', default: false })
  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;
}
