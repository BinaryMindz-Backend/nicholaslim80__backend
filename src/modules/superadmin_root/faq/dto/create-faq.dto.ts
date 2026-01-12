import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { IsNotEmpty, } from "class-validator";

export class CreateFaqDto {
  @ApiProperty({ example: 'What is this application about?' })
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: 'USER' })
  @IsNotEmpty()
  faq_for: UserRole;

  @ApiProperty({ example: 'This application is designed to help users manage their tasks efficiently.' })
  @IsNotEmpty()
  answer: string;
}
