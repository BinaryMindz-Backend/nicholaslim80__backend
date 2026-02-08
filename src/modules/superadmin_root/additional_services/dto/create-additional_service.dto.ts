import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAdditionalServiceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  service_name: string;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  value: number;

  @ApiProperty()
  @IsString()
  desc: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

}

