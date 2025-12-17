import { 
  IsEnum, 
  IsOptional, 
  IsBoolean, 
  IsDateString 
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, NotificationSentRole } from '@prisma/client';

export class AdminCreateNotificationDto {
  
  @ApiProperty({
    description: "Type of notification to send",
    example: "PUSH_NOTIFICATION",
    enum: NotificationType,
  })
  @IsEnum(NotificationType)
  type: NotificationType;


  @ApiProperty({
    description: "Notification title",
    example: "Order Update",
    required: false,
  })
  @IsOptional()
  title?: string;


  @ApiProperty({
    description: "Notification message",
    example: "Your order has been shipped",
    required: false,
  })
  @IsOptional()
  message?: string;


  @ApiPropertyOptional({
    description: "Whether notification should be sent immediately",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  send_immediately: boolean;


  @ApiProperty({
    description: "Scheduled time to send notification (if not immediate)",
    example: "2025-01-15T10:00:00Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  schedule_to_send?: string;


  @ApiProperty({
    description: "Who will receive this notification",
    example: "USER",
    enum: NotificationSentRole, // USER / DRIVER / BOTH
  })
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(NotificationSentRole)
  target_role?: NotificationSentRole;
}
