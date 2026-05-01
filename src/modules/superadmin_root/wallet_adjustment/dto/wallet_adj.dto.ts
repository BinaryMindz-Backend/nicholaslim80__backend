import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AdjustmentAction, AdjustmentReason, AdjustmentStatus, PenaltyType } from '@prisma/client';

// ================= ENUMS =================
// export enum AdjustmentAction {
//   ADD_CREDIT_FUNDS = 'ADD_CREDIT_FUNDS',
//   DEDUCT_MINUS_FUNDS = 'DEDUCT_MINUS_FUNDS',
// }

// export enum AdjustmentReason {
//   REFUND = 'REFUND',
//   ADMIN_CORRECTION = 'ADMIN_CORRECTION',
//   PENALTY = 'PENALTY',
//   LATE_ARRIVAL = 'LATE_ARRIVAL',
//   SAFETY_VIOLATION = 'SAFETY_VIOLATION',
//   CANCELED_TRIP = 'CANCELED_TRIP',
//   OTHER = 'OTHER',
// }

// export enum PenaltyType {
//   LATE_ARRIVAL = 'LATE_ARRIVAL',
//   SAFETY_VIOLATION = 'SAFETY_VIOLATION',
//   CANCELED_TRIP = 'CANCELED_TRIP',
//   OTHER = 'OTHER',
// }

// export enum AdjustmentStatus {
//   PENDING = 'PENDING',
//   COMPLETED = 'COMPLETED',
//   CANCELLED = 'CANCELLED',
// }

// ================= DTO =================
export class WalletAdjustmentDto {
  // ================= TARGET =================

  @ApiPropertyOptional({ example: 12 })
  @ValidateIf((o) => !o.userId)
  @IsOptional()
  @IsInt()
  raiderId?: number;

  @ApiPropertyOptional({ example: 5 })
  @ValidateIf((o) => !o.raiderId)
  @IsOptional()
  @IsInt()
  userId?: number;

  // ================= ACTION =================
  @ApiProperty({ enum: AdjustmentAction })
  @IsEnum(AdjustmentAction)
  adjustmentAction: AdjustmentAction;

  // ================= AMOUNT =================
  @ApiProperty({ example: 100 })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  amount: number;

  // ================= ORDER =================
  @ApiPropertyOptional({ example: 'ORD12345' })
  @IsOptional()
  @IsString()
  orderId?: string;

  // ================= REASON =================
  @ApiPropertyOptional({ enum: AdjustmentReason })
  @IsEnum(AdjustmentReason)
  @IsOptional()
  reason: AdjustmentReason;

  // ================= PENALTY =================
  @ApiPropertyOptional({ enum: PenaltyType })
  @IsOptional()
  @IsEnum(PenaltyType)
  penaltyType?: PenaltyType;

  // ================= NOTES =================
  @ApiPropertyOptional({ example: 'Manual admin correction' })
  @IsOptional()
  @IsString()
  additionalNotes?: string;

  // ================= FLAGS =================
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isConfirmedByAdmin?: boolean = false;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isNotify?: boolean = true;

  // ================= STATUS =================
  @ApiPropertyOptional({ enum: AdjustmentStatus })
  @IsOptional()
  @IsEnum(AdjustmentStatus)
  status?: AdjustmentStatus = AdjustmentStatus.PENDING;
}