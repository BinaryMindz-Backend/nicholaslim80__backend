import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsEnum } from 'class-validator';




export enum UserRole {
  USER="USER",
  SUPER_ADMIN="SUPER_ADMIN",
  RAIDER="RAIDER"
}

export class CreateUserDto {
  @ApiPropertyOptional({ example: 'john_doe', description: 'Optional username of the user' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+8801712345678', description: 'User phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'P@ssword123', description: 'User password' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.USER, description: 'User role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
  
}
