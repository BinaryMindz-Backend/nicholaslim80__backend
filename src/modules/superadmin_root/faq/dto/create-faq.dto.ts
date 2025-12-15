import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, } from "class-validator";

export class CreateFaqDto {
  @ApiProperty({ example: 'What is this application about?' })
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: 'This application is designed to help users manage their tasks efficiently.' })
  @IsNotEmpty()
  answer: string;
}
