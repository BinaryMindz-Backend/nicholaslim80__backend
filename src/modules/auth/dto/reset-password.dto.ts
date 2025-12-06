import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email of the user requesting password reset',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'newSecurePassword123',
    minLength: 6,
    description: 'The new password (must be at least 6 characters)',
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}