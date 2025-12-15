import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateDriverCompetitionDto {
  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  rank_weight: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  rating_weight: number;

  @ApiProperty({ example: 70 })
  @IsInt()
  @Min(0)
  followers_weight: number;

  @ApiProperty({ example: 8, description: 'Challenge timeout in seconds' })
  @IsInt()
  @Min(1)
  challenges_timeout: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  max_users_to_join: number;
}
