import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateDisputeDto {
  @ApiProperty({
    example: 101,
    description: 'Order ID related to dispute',
  })
  @IsInt()
  orderId: number;

  @ApiProperty({
    example: 'clx123abc456',
    description: 'Dispute Type ID from admin panel',
  })
  @IsString()
  disputeTypeId: string;

  @ApiProperty({
    example: ['img1.png', 'img2.png'],
    description: 'Evidence file IDs or URLs',
    type: [String],
  })
  @IsString({ each: true })
  evidenceids: string[];

  @ApiProperty({
    example: 'Food was damaged and not edible',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
