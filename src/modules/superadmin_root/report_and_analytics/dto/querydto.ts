import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsISO8601 } from 'class-validator';

export class OrderAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date in ISO format (e.g., 2025-12-24)',
    example: '2025-12-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'from must be a valid ISO8601 date string' })
  from?: string;

  @ApiPropertyOptional({
    description: 'End date in ISO format (e.g., 2025-12-24)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'to must be a valid ISO8601 date string' })
  to?: string;
}
