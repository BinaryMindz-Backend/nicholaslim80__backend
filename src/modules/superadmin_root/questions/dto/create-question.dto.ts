import { ApiProperty } from '@nestjs/swagger';

export class CreateQuestionDto {
  @ApiProperty()
  quizId: number;

  @ApiProperty({ enum: ['TYPE1', 'TYPE2'], description: 'Your QuesType Enum' })
  quesType: any;

  @ApiProperty({ enum: ['CAT1', 'CAT2'], description: 'Your QuesCategory Enum' })
  quesCategory: any;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'], description: 'Your Difficulty Enum' })
  quesDeficulty: any;

  @ApiProperty({ example: 'What is 2 + 2?' })
  question_text: string;

  @ApiProperty({
    type: () => [CreateOptionDto],
    required: false,
  })
  options?: CreateOptionDto[];
}

export class CreateOptionDto {
  @ApiProperty({ example: '4' })
  option_text: string;

  @ApiProperty({ default: false })
  is_correct: boolean;
}
