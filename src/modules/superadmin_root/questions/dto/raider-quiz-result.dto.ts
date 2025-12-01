import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class QuizResultdto {
  @ApiProperty({
    description: 'Total number of questions in the quiz',
    example: 10,
    default: 0,
  })
  @IsInt()
  @Min(0)
  total_questions: number;

  @ApiProperty({
    description: 'Number of correctly answered questions',
    example: 7,
    default: 0,
  })
  @IsInt()
  @Min(0)
  correct_answers: number;

  @ApiProperty({
    description: 'Score achieved by the user',
    example: 70,
    default: 0,
  })
  @IsInt()
  @Min(0)
  score: number;

}
