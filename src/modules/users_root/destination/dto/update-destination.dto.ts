import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber } from 'class-validator';
import { DestinationType } from '@prisma/client';
import { CreateDestinationDto } from './create-destination.dto';

export class UpsertDestinationDto extends PartialType(CreateDestinationDto) {
  @ApiProperty({ example: '123 Street, Dhaka', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'addressFromApr', required: false })
  @IsOptional()
  @IsString()
  addressFromApr?: string;

  @ApiProperty({ example: '5A', required: false })
  @IsOptional()
  @IsString()
  floor_unit?: string;

  @ApiProperty({ example: 'Mehedi Hasan', required: false })
  @IsOptional()
  @IsString()
  contact_name?: string;

  @ApiProperty({ example: '01700000000', required: false })
  @IsOptional()
  @IsString()
  contact_number?: string;

  @ApiProperty({ example: 'Be careful with the parcel', required: false })
  @IsOptional()
  @IsString()
  note_to_driver?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  is_saved?: boolean;

  @ApiProperty({ enum: DestinationType, example: DestinationType.SENDER, required: false })
  @IsOptional()
  @IsEnum(DestinationType)
  type?: DestinationType;

  @ApiProperty({ example: 23.8200, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 90.4250, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: 12.2, required: false })
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiProperty({ example: 'Gate code: 1234', required: false })
  @IsOptional()
  @IsString()
  additionalInfo?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  service_zoneId?: number;
}
