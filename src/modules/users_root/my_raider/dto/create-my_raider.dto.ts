import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateMyRaiderDto {

  @ApiProperty({ example: 'raider@example.com', description: 'How user found the raider' })
  @IsString()
  find_by: string;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Mark as favorite or not',
  })
  @IsBoolean()
  @IsOptional()
  is_fav?: boolean = false;
}
