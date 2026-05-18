import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, ValidateNested } from 'class-validator';

export class ReorderStopItemDto {
  @ApiProperty({ example: 8 })
  @IsInt()
  orderStopId!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  sequence!: number;
}

export class ReorderStopsDto {
  @ApiProperty({
    type: [ReorderStopItemDto],
    example: [
      { orderStopId: 8, sequence: 1 },
      { orderStopId: 7, sequence: 2 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderStopItemDto)
  stops: ReorderStopItemDto[];
}