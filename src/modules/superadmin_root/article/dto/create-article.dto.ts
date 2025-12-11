import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class CreateArticleDto {
  @ApiProperty({ example: 'Sample Title' })
  @IsNotEmpty()
  title: string;
  @ApiProperty({ example: 'Sample content of the article.' })
  @IsNotEmpty()
  content: string
}
