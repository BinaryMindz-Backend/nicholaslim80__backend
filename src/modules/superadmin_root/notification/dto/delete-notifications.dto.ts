import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class DeleteNotificationsDto {
  @ApiProperty({ example: [1, 2] })
  @IsArray()
  @IsNumber()
  ids: number[];
}
