import { IsString, IsDateString, IsEnum } from 'class-validator';
import { Advertisementfor } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdvertiseDto {
  @ApiProperty({
    example: Advertisementfor.USER,
    enum: Advertisementfor,
    description: 'Where this advertisement will be displayed',
  })
  @IsEnum(Advertisementfor)
  create_for: Advertisementfor;

  @ApiProperty({
    example: 'Super Discount Offer',
    description: 'Title of the advertisement',
  })
  @IsString()
  ad_title: string;

  @ApiProperty({
    example: 'https://example.com/banner.png',
    description: 'Image URL for the advertisement',
  })
  @IsString()
  ad_image: string;

    @ApiProperty({
    example: '2025-01-10T00:00:00.000Z',
    description: 'Advertisement visibility start date (ISO 8601 format)',
    })
    @IsDateString()
    start_date: string;

    @ApiProperty({
    example: '2026-01-10T00:00:00.000Z',
    description: 'Advertisement visibility end date (ISO 8601 format)',
    })
    @IsDateString()
    end_date: string;

}
