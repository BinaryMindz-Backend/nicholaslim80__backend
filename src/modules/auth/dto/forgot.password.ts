import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty({ example: 'shatohmmm@gmail.com' })
  @IsNotEmpty()
  email: string;
}