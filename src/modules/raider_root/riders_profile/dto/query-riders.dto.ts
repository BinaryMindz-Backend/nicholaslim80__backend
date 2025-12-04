import { ApiProperty } from '@nestjs/swagger';
import { PortalEnum, RaiderVerification } from '@prisma/client';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export class GetRidersQueryDto {
  @ApiProperty({ required: false, description: 'Raider name to filter by' })
  @IsOptional()
  @IsString()
  raider_name?: string;

  @ApiProperty({ required: false, description: 'Raider ID to filter by' })
  @IsOptional()
  @IsString()
  raiderId?: number;


  @ApiProperty({ required: false, enum: RaiderVerification, description: 'Raider verification status from admin to filter by' })
  @IsOptional()
  @IsEnum(RaiderVerification)
  raider_verificationFromAdmin?: RaiderVerification;

  @ApiProperty({ required: false, enum: PortalEnum, description: 'Sign-in portal to filter by' })
  @IsOptional()
  @IsEnum(PortalEnum)
  signInPortal?: PortalEnum;

  @ApiProperty({ required: false, description: 'Type of sorting: first (ascending) or last (descending)' })
  @IsOptional()
  @IsString()
  type?: 'asc' | 'desc';
}
