import { IsString, IsOptional, IsInt, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTriggerEventDto {
    @ApiProperty({
        description: 'Human-readable label shown in the admin trigger event table',
        example: 'Driver ETA to Next Stop',
    })
    @IsString()
    name: string;

    @ApiProperty({
        description: 'Unique backend key used in code to reference this metric',
        example: 'ETA_MINUTES',
    })
    @IsString()
    backendTag: string;

    @ApiPropertyOptional({
        description: 'Explains what this metric tracks, shown as helper text in the admin UI',
        example:
            'Automatically monitors live GPS coordinates to calculate traveling time estimates for active delivery segments',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'Expected numeric threshold value (whole number) for this metric',
        example: 30,
    })
    @IsOptional()
    @IsInt()
    expectedValue?: number;

    @ApiPropertyOptional({
        description: 'Unit type for the expected value',
        example: 'Min',
        enum: ['Min', 'Km'],
    })
    @IsOptional()
    @IsIn(['Min', 'Km'])
    expectedValueType?: string;

    @ApiProperty({
        description:
            'Order/stop status this metric applies to. Admin-managed list — values can be added or removed.',
        example: 'IN_TRANSIT',
        enum: ['ASSIGNED', 'ARRIVED_AT_PICKUP', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'],
    })
    @IsString()
    status: string;

    @ApiPropertyOptional({
        description: 'Whether this trigger event is active and selectable when building rules',
        example: true,
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}