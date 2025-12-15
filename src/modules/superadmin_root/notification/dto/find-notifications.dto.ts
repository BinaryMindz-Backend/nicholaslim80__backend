import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBooleanString, IsNumberString } from 'class-validator';

export class FindNotificationsDto {
  @ApiPropertyOptional({ example: 'RAIDER' })
  @IsOptional()
  @IsString()
  target_role?: string;

  @ApiPropertyOptional({ example: 'SMS' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBooleanString()
  isRead?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}
