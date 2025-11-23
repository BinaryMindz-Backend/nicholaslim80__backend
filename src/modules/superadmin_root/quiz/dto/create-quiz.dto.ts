import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsJSON } from 'class-validator';

export class CreateQuizDto {
  @ApiProperty({ example: 'General Knowledge Quiz', description: 'Title of the quiz' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Quiz options in JSON format' })
  @IsJSON()
  @IsOptional()
  QuizOption?: any;

  @ApiPropertyOptional({ example: 'A fun quiz about general knowledge', description: 'Description of the quiz' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'General', description: 'Category of the quiz' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether the quiz is active' })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({ example: 1, description: 'ID of the admin who created the quiz' })
  @IsOptional()
  created_by_id?: number;
}
