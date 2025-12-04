import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class CreateOptionDto {
  @ApiProperty({ example: '4' })
  @IsString()
  option_text: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  is_correct: boolean;
}
