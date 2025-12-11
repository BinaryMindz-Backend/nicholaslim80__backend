import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePolicyDto {
  @ApiProperty({ example: 'Return Policy' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Description text here...' })
  @IsString()
  desc: string;


}
