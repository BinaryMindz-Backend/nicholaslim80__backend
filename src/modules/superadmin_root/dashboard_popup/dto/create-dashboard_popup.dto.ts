import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean,IsOptional, IsString } from 'class-validator';

export class CreateDashboardPopupDto {
  @ApiPropertyOptional({ description: 'Title for the popup', example: 'Sample Popup' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Description for the popup', example: 'This is a sample popup description' })
  @IsString()
  @IsOptional()
  desc?: string;

  @ApiPropertyOptional( { description: 'Image link for the popup', example: 'https://example.com/popup-image.jpg' })
  @IsOptional()
  @IsString()
  image_link?: string;

  @ApiPropertyOptional({ description: 'Redirect link for the popup', example: 'https://example.com/popup' })
  @IsString()
  @IsOptional()
  redirect_link?: string;

  @ApiPropertyOptional({ description: 'Whether the popup is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


