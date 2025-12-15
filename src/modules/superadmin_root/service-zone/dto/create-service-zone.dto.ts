import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateServiceZoneDto {
  @ApiProperty({ description: 'Name of the service zone', example: 'Dhaka North' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Zone name', example: 'Zone A' })
  @IsString()
  @IsNotEmpty()
  zoneName: string;

  @ApiProperty({ description: 'Coordinates of the zone', type: Object, example: [{ lat: 23.8103, lng: 90.4125 }] })
  @IsNotEmpty()
  coordinates: any;

  @ApiProperty({ description: 'Delivery fee for the zone', example: 50.0 })
  @IsNumber()
  @IsNotEmpty()
  deliveryFee: number;

  @ApiProperty({ description: 'Priority of the zone', example: 1, required: false })
  @IsNumber()
  @IsOptional()
  priority?: number;

  @ApiProperty({ description: 'Color for zone map', example: '#FF0000', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ description: 'Minimum order amount for delivery', example: 200.0, required: false })
  @IsNumber()
  @IsOptional()
  minOrderAmmount?: number;

  @ApiProperty({ description: 'Is the zone active?', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Additional notes', example: 'No delivery on holidays', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
