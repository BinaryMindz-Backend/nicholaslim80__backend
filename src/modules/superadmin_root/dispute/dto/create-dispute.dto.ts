import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { DisputeCreatedBy, DisputeIssueType } from '@prisma/client';

export class CreateDisputeDto {
  @ApiProperty({ example: 101 })
  @IsInt()
  orderId: number;

  @ApiProperty({ enum: DisputeCreatedBy })
  @IsEnum(DisputeCreatedBy)
  createdByType: DisputeCreatedBy;

  @ApiProperty({ example: 55 })
  @IsInt()
  createdById: number;

  @ApiProperty({ enum: DisputeIssueType })
  @IsEnum(DisputeIssueType)
  issueType: DisputeIssueType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
