import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class UpdateDashboardPopupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional( { description: 'Image link for the popup', example: 'https://example.com/popup-image.jpg' })
  @IsOptional()
  @IsString()
  image_link?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  desc?: string;

  @ApiPropertyOptional( { description: 'Redirect link for the popup', example: 'https://example.com/redirect' })
  @IsOptional()
  @IsString()
  redirect_link?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}