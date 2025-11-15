
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({  description:"Give me your password",example: 'P@ssword123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
