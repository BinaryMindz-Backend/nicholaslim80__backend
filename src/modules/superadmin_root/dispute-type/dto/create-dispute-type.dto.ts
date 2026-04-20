import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export enum DisputeRole {
  USER = 'USER',
  DRIVER = 'DRIVER',
}

export class CreateDisputeTypeDto {
  @ApiProperty({
    example: 'Payment / Billing issue',
    description: 'Name of the dispute type',
  })
  @IsString()
  name: string;

  @ApiProperty({
    enum: DisputeRole,
    example: DisputeRole.USER,
    description: 'حدد هذا النوع لأي جهة (USER أو DRIVER)',
  })
  @IsEnum(DisputeRole)
  role: DisputeRole;
}
