import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class AddFundsDto {

  @ApiProperty({ example: 5000, description: 'Amount to add in Usd' })
  @IsNotEmpty()
  amount: number;
}