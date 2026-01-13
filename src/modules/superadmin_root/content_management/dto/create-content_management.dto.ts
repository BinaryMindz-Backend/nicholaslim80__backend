import { ContentManagementType, UserRole } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateContentManagementDto {
  @ApiProperty({
    example: 'ABOUT_US',
    enum: ContentManagementType,
    description: 'Type of content section',
  })
  @IsEnum(ContentManagementType)
  contenttype: ContentManagementType;

  @ApiProperty({ example: 'USER' })
  @IsNotEmpty()
  faq_for: UserRole;

  @ApiProperty({
    example: 'This is the About Us description.',
    description: 'Content description text',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: true,
    description: 'Publish status of the content',
  })
  @IsBoolean()
  isPublished: boolean;

  @ApiProperty({
    example: 1,
    description: 'Version number (optional)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  version?: number | null;
}
