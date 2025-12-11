
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+8801712345678', required:false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: "Give me your password", example: '123456' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
