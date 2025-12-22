import { ApiProperty } from '@nestjs/swagger';
import { IsString, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDestinationDto } from '../../destination/dto/create-destination.dto';


export class BulkOrderWithDestinationsDto {
  @ApiProperty({
    description: 'CSV file URL containing orders',
    example: 'http://127.0.0.1:3000/uploads/orders.csv',
  })
  @IsString()
  fileUrl: string;

  @ApiProperty({
    type: [CreateDestinationDto],
    description: 'Optional default destinations for all orders',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateDestinationDto)
  destinations?: CreateDestinationDto[];
}
