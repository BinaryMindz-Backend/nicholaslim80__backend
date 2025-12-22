import { IsUrl, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkOrderDto {
  @ApiProperty({
    description: 'URL of the uploaded CSV file containing orders',
    example: 'http://127.0.0.1:3000/uploads/orders.csv',
  })
  @IsUrl()
  @IsNotEmpty()
  fileUrl: string;
}
