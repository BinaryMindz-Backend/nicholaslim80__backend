import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class ServiceEmailNumberDto {
    @ApiProperty()
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    service_email: string;

    @ApiProperty({ example: 99.99 })
    @IsString()
    @IsNotEmpty()
    service_number: string;

}