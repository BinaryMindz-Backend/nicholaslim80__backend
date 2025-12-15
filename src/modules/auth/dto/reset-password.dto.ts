import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Email of the user requesting password reset',
  })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiPropertyOptional({
    example: '+88032424487',
    description: 'phone of the user requesting password reset',
  })
  @IsString()
  @IsOptional()
  phone: string;

  @ApiProperty({
    example: 'newSecurePassword123',
    minLength: 6,
    description: 'The new password (must be at least 6 characters)',
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}