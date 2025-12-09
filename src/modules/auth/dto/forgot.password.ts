import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";

export class ForgotPasswordDto {
  @ApiPropertyOptional({ example: 'user@exmaple.com' })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty({ example: '+990-98298824' })
  @IsString()
  phone: string;
}