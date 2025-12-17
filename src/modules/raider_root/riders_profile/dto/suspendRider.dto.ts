import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class SuspendRiderProfileDto {

  @ApiProperty({ description: 'Duration of the suspension' })
  @IsNotEmpty()
  suspendedDuration: Date;

  @ApiProperty({ description: 'Reason for the suspension' })
  @IsNotEmpty()
  suspensionReason: string;
}