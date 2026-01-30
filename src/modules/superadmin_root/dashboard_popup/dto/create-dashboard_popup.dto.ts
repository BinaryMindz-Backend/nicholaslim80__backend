import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDashboardPopupDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  desc: string;

  @ApiProperty()
  @IsString()
  redirect_link: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


