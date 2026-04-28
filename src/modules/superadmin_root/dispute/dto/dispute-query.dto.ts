import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsEnum, IsDateString, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum DisputeStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  AWAITING_INFO = 'AWAITING_INFO',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}
export enum ParticipantType {
  USER = 'user',
  RIDER = 'rider',
  ALL = 'all',
}
export class DisputeQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;

  @ApiPropertyOptional({ example: 101 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  orderId?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({ example: 9 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  riderId?: number;

  @ApiPropertyOptional({ enum: DisputeStatus })
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;


  @ApiPropertyOptional({ example: '2026-04-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-04-30' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ example: "cmo7prm7q0007n401dt41etog" })
  @IsOptional()
  @Type(() => String)
  @IsString()
  disputeTypeId?: string;

  @ApiPropertyOptional({ enum: ParticipantType, example: 'user' })
  @IsOptional()
  @IsEnum(ParticipantType)
  participantType?: ParticipantType;
}
