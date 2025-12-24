import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber } from 'class-validator';
import { DestinationType } from '@prisma/client';

export class CreateDestinationDto {

  @ApiProperty({ example: '123 Street, Dhaka' })
  @IsOptional()
  @IsString()
  address?: string;
   
  @ApiProperty({ example: 'paste address link' })
  @IsOptional()
  @IsString()
  addressLink?:string;

  @ApiProperty({ example: '5A' })
  @IsOptional()
  @IsString()
  floor_unit?: string;

  @ApiProperty({ example: 'Mehedi Hasan' })
  @IsOptional()
  @IsString()
  contact_name?: string;

  @ApiProperty({ example: '01700000000' })
  @IsOptional()
  @IsString()
  contact_number?: string;

  @ApiProperty({ example: 'Be careful with the parcel' })
  @IsOptional()
  @IsString()
  note_to_driver?: string;

  @ApiProperty({ example: false })
  @IsOptional()
  @IsBoolean()
  is_saved?: boolean;

  @ApiProperty({ enum: DestinationType, example: DestinationType.SENDER })
  @IsEnum(DestinationType)
  type: DestinationType;

  @ApiProperty({ example: 23.8200 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 90.4250 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: 12.2 })
  @IsOptional()
  @IsNumber()
  accuracy?: number;


  // @ApiProperty({example:1})
  // @IsNumber()
  // order_id:number;
}

