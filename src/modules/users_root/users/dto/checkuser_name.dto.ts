import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsAlphanumeric, IsString, Length } from 'class-validator';

export class CheckUsernameDto {
    @ApiProperty({
        example: 'john_doe',
        description: 'Username to check',
        required: true,
    })
    @Type(() => String)
    @IsString()
    @IsAlphanumeric()
    @Length(3, 20)
    username: string;
}
