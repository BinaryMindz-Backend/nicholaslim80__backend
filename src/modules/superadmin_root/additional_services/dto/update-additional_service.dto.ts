import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class UpdateAdditionalServiceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  service_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  desc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}