import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";

export class ForgotPasswordDto {
  @ApiPropertyOptional({ example: 'user@exmaple.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+990-98298824' })
  @IsString()
  @IsOptional()
  phone: string;
}