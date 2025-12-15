import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';





export enum UserRole {
  USER = "USER",
  SUPER_ADMIN = "SUPER_ADMIN",
  RAIDER = "RAIDER"

}

export class CreateUserDto {
  @ApiPropertyOptional({ example: 'john_doe', description: 'Optional username of the user' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: 'john@example.com', description: 'User email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+8801712345678', description: 'User phone number' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: '123456', description: 'User password' })
  @IsOptional()
  @IsString()
  password?: string;

  // @ApiPropertyOptional({ enum: UserRole, example: UserRole.USER, description: 'User role' })
  // @IsOptional()
  // @IsEnum(UserRole)
  // role?: UserRole;


  @ApiPropertyOptional({ example: 'kl345678', description: "Referrel code" })
  @IsOptional()
  @IsString()
  referral_code?: string;

  @ApiPropertyOptional({ example: 'custom name', description: "custom name" })
  @IsOptional()
  @IsString()
  role_name?: string;

}
