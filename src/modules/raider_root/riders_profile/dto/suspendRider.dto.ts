import { ApiProperty } from "@nestjs/swagger";

export class SuspendRiderProfileDto {


  @ApiProperty({ description: 'Duration of the suspension' })
  suspendedDuration: Date;

  @ApiProperty({ description: 'Reason for the suspension' })
  suspensionReason: string;
}