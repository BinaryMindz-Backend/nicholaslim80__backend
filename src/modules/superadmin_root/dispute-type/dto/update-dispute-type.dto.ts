import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { DisputeRole } from './create-dispute-type.dto';

export class UpdateDisputeTypeDto {
  @ApiPropertyOptional({
    example: 'Late delivery',
    description: 'Updated name of dispute type',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    enum: DisputeRole,
    example: DisputeRole.DRIVER,
    description: 'Update role if needed',
  })
  @IsOptional()
  @IsEnum(DisputeRole)
  role?: DisputeRole;

  @ApiPropertyOptional({
    example: true,
    description: 'Activate or deactivate dispute type',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
