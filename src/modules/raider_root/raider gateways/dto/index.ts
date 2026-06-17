import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber } from 'class-validator';

export class UpdateAutoPopupDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;
}
export class UpdateRaiderRadiusDto {
  @ApiProperty({ example: 5, type: 'number', description: 'Radius in kilometers' })
  @IsNumber()
  radius: number;
}