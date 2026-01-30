import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class UpdateDashboardPopupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  desc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  redirect_link?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}