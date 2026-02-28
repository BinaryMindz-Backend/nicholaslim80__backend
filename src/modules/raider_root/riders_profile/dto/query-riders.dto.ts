import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RaiderVerification } from '@prisma/client';
import { IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';


export enum loginTypeDto {
    DIRECT_SIGNIN = "DIRECT_SIGNIN"
}


export enum SortType {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetRidersQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  raider_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumberString()
  raiderId?: number;

  @ApiProperty({ required: false, enum : loginTypeDto })
  @IsOptional()
  @IsEnum(loginTypeDto)
  loginType?: loginTypeDto;

  @ApiProperty({ required: false, enum: RaiderVerification })
  @IsOptional()
  @IsEnum(RaiderVerification)
  raider_verificationFromAdmin?: RaiderVerification;

  @IsEnum(SortType)
  type?: SortType;


  // NEW PAGINATION ↓↓↓
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @IsNumberString()
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @IsNumberString()
  limit?: number;

  @ApiPropertyOptional({
  description: 'Search by rider name or email',
  example: 'rahim',
  })
  @IsOptional()
  @IsString()
  search?: string;

}
