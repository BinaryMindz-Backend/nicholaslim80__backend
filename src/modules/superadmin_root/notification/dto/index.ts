// ─── dto/create-notification.dto.ts ───────────────────────────────────────────
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  ValidateIf,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  NotificationType,
  NotificationCategory,
  NotificationSentRole,
} from '@prisma/client';

// ── Shared base ──────────────────────────────────────────────────────────────
export class BaseNotificationDto {
  @ApiProperty({ example: 'Funds Credited' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Your wallet has been credited successfully.' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ enum: NotificationType, default: NotificationType.IN_APP })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType = NotificationType.IN_APP;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  send_immediately?: boolean = true;

  @ApiPropertyOptional({ example: '2026-03-15T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  @ValidateIf((o) => !o.send_immediately)
  schedule_to_send?: string;

  // Target: role-based broadcast
  @ApiPropertyOptional({ enum: NotificationSentRole })
  @IsOptional()
  @IsEnum(NotificationSentRole)
  target_role?: NotificationSentRole;

  // Target: specific user/driver IDs (overrides role if provided)
  @ApiPropertyOptional({ type: [Number], example: [1, 2, 3] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  target_user_ids?: number[];

  @ApiPropertyOptional({ example: 42 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  orderId?: number;
}

// ── Create Notification (system alert) ──────────────────────────────────────
export class AdminCreateNotificationDto extends BaseNotificationDto {
  @ApiProperty({ enum: NotificationCategory, default: NotificationCategory.NOTIFICATION })
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory = NotificationCategory.NOTIFICATION;
}

// ── Create Promotion ─────────────────────────────────────────────────────────
export class AdminCreatePromotionDto {
  @ApiProperty({ example: 'Weekend Promo' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Enjoy 15% off your next delivery!' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/promo.jpg' })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  push_notification?: boolean = false;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  send_immediately?: boolean = true;

  @ApiPropertyOptional({ example: '2026-03-15T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  schedule_to_send?: string;

  @ApiPropertyOptional({ example: '2026-03-22T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  // Optional target audience (empty = all users)
  @ApiPropertyOptional({ enum: NotificationSentRole })
  @IsOptional()
  @IsEnum(NotificationSentRole)
  target_role?: NotificationSentRole;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  target_user_ids?: number[];
}

// ── Update Notification ──────────────────────────────────────────────────────
export class UpdateNotificationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  send_immediately?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  schedule_to_send?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiry_date?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  is_active?: boolean;
}

// ── Find / Filter ─────────────────────────────────────────────────────────────
export class FindNotificationsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationCategory })
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

  @ApiPropertyOptional({ example: 'true' })
  @IsOptional()
  @IsString()
  isRead?: string;
}

export class FindAdminNotificationsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationCategory })
  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

  @ApiPropertyOptional({ description: 'Filter by admin user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  adminId?: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsString()
  dateTo?: string;
}

// ── Delete many ───────────────────────────────────────────────────────────────
export class DeleteNotificationsDto {
  @ApiProperty({ type: [Number], example: [1, 2, 3] })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Type(() => Number)
  ids: number[];
}

// ── FCM token ─────────────────────────────────────────────────────────────────
export class StoreFcmTokenDto {
  @ApiProperty({ example: 'fcm-token-string-here' })
  @IsString()
  fcmToken: string;
}

// ── Resend ────────────────────────────────────────────────────────────────────
export class ResendNotificationDto {
  @ApiPropertyOptional({ description: 'Override send type for resend' })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}