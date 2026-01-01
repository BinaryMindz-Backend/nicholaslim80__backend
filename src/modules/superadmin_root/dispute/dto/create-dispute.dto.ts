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
  
  @ApiProperty({ example: ['evidence1', 'evidence2', 'evidence3'] })
  @IsString({ each: true })
  evidenceids: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
