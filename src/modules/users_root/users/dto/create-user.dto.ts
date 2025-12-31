import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {

  @ApiPropertyOptional({ example: 'john_doe' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+8801712345678' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: 'kl345678' })
  @IsOptional()
  @IsString()
  referral_code?: string;

  @ApiPropertyOptional({ example: 'custom name' })
  @IsOptional()
  @IsString()
  role_name?: string;

  @ApiPropertyOptional({ example: 'https://image.url' })
  @IsOptional()
  @IsString()
  image?: string;
   

}


