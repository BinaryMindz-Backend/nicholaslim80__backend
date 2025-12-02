import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsString } from 'class-validator';
import { ApplicableTyp, Condition } from '@prisma/client';

export class CreateUserDynamicSurgeDto {
  @ApiProperty({ enum: ApplicableTyp, example: 'RAIDER' })
  @IsEnum(ApplicableTyp)
  applicable_user: ApplicableTyp;

  @ApiProperty({ example: 'Pick Hours' })
  @IsString()
  role_name: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  price_multiplier: number;

  @ApiProperty({ enum: Condition, example: 'HIGH_DEMAND' })
  @IsEnum(Condition)
  condition: Condition;

  @ApiProperty({
    example: '10:20 AM - 12:30 PM',
    description: 'Time range in plain text format'
  })
  @IsString()
  time_range: string;
}
