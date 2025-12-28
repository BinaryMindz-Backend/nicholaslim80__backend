import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DisputeStatus } from '@prisma/client';

export class UpdateDisputeStatusDto {
  @ApiProperty({ enum: DisputeStatus })
  @IsEnum(DisputeStatus)
  status: DisputeStatus;
}
