import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateAutoPopupDto {
  @ApiProperty({example: true})
  @IsBoolean()
  enabled: boolean;
}