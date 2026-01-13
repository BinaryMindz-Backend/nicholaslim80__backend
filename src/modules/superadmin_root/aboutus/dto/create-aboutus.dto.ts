import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { IsNotEmpty } from "class-validator";

export class CreateAboutusDto {
  @ApiProperty({ example: 'About Us Title', description: 'Title of the About Us section' })
  @IsNotEmpty()
  title: string;
  @ApiProperty({ example: 'This is the about us content', description: 'Content of the About Us section' })
  @IsNotEmpty()
  content: string

  @ApiProperty({ example: 'USER' })
  @IsNotEmpty()
  faq_for: UserRole;
}
