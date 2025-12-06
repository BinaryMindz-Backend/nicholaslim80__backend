import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@exmaple.com' })
  @IsNotEmpty()
  email: string;
}