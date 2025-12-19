import { ApiPropertyOptional } from '@nestjs/swagger';
import { WalletTransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';



export class UserWalletHistoryQueryDto {
    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({ example: 20 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit?: number = 20;

    @ApiPropertyOptional({ enum: WalletTransactionType })
    @IsOptional()
    @Type(() => String)
    @IsEnum(WalletTransactionType)
    type?: WalletTransactionType;
}
