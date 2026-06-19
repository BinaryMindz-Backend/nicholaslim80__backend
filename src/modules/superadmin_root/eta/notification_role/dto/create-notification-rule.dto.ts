import { IsString, IsOptional, IsInt, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationRuleDto {
    @ApiProperty({
        description: 'Display name for this rule, shown in the Active Rules list',
        example: 'Pickup Proximity Alert (SME Client)',
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Must match an existing TriggerEvent.backendTag',
        example: 'ETA_MINUTES',
    })
    @IsString()
    triggerTag: string;

    @ApiProperty({
        description: 'Comparison operator applied to the trigger metric',
        example: 'LTE',
        enum: ['LTE', 'GTE', 'EQ'],
    })
    @IsIn(['LTE', 'GTE', 'EQ'])
    operator: string;

    @ApiProperty({
        description:
            'Threshold to compare against. Numeric string for ETA metrics (e.g. "10"), or a status tag for status-change metrics (e.g. "LEG_DELIVERED")',
        example: '10',
    })
    @IsString()
    targetValue: string;

    @ApiPropertyOptional({
        description:
            'Whether the rule targets the current active stop dynamically, or one fixed stop index',
        example: 'DYNAMIC',
        enum: ['DYNAMIC', 'FIXED'],
        default: 'DYNAMIC',
    })
    @IsOptional()
    @IsIn(['DYNAMIC', 'FIXED'])
    stopScope?: string;

    @ApiPropertyOptional({
        description: 'Only used when stopScope is FIXED — the specific stop sequence number to target',
        example: 1,
    })
    @IsOptional()
    @IsInt()
    fixedStopIndex?: number;

    @ApiProperty({
        description: 'Notification title. Supports merge tags like {driver_name}, {threshold}',
        example: 'The Driver is 5 Mins from Pickup!',
    })
    @IsString()
    notifTitle: string;

    @ApiProperty({
        description:
            'Notification body. Supports merge tags: {driver_name}, {sme_client_name}, {recipient_name}, {delivery_address}, {stop_sequence}, {threshold}',
        example:
            'Hi {sme_client_name}, your driver {driver_name} is arriving shortly at the pickup in approximately {threshold} minutes. Please have the package ready.',
    })
    @IsString()
    notifMessage: string;

    @ApiPropertyOptional({
        description: 'Send this notification to the SME booking client (order sender)',
        example: true,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    sendToSender?: boolean;

    @ApiPropertyOptional({
        description:
            'Send this notification to the drop-off contact person (recipient). Note: recipients have no registered account, so viaPush cannot be combined with this.',
        example: false,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    sendToRecipient?: boolean;

    @ApiPropertyOptional({
        description: 'Send via push notification (sender only — requires a registered User with fcmToken)',
        example: true,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    viaPush?: boolean;

    @ApiPropertyOptional({
        description: 'Send via WhatsApp Business message',
        example: true,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    viaWhatsApp?: boolean;

    @ApiPropertyOptional({
        description: 'Send via SMS',
        example: false,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    viaSMS?: boolean;

    @ApiPropertyOptional({
        description: 'Whether this rule is currently active and will be evaluated',
        example: true,
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}