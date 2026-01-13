import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { IsNotEmpty } from "class-validator";

export class CreateArticleDto {
  @ApiProperty({ example: 'Sample Title' })
  @IsNotEmpty()
  title: string;
  @ApiProperty({ example: 'Sample content of the article.' })
  @IsNotEmpty()
  content: string

  @ApiProperty({ example: 'USER' })
  @IsNotEmpty()
  faq_for: UserRole;
}
