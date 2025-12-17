import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateOptionDto } from './create-option.dto';
import { QuesCategory, QuesDeficulty, QuesType } from '@prisma/client/edge';

export class CreateQuestionDto {
  @ApiProperty()
  @IsNumber()
  quizId: number;

  @ApiProperty({ enum:QuesType })
  @IsEnum(QuesType)
  quesType: QuesType;

  @ApiProperty({ enum: QuesCategory })
  @IsEnum(QuesCategory)
  quesCategory: QuesCategory;

  @ApiProperty({ enum: QuesDeficulty })
  @IsEnum(QuesDeficulty)
  quesDeficulty: QuesDeficulty;

  @ApiProperty({ example: 'What is 2 + 2?' })
  @IsString()
  question_text: string;

  @ApiProperty({ type: [CreateOptionDto], required: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options: CreateOptionDto[];
}
