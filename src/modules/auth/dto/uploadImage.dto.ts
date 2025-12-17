import { ApiProperty } from "@nestjs/swagger";

export class UploadImageDto {
  @ApiProperty({
    description: 'image  field is (required)',
    type: 'array',
    items: { type: 'file', format: 'binary' },
    required: true,
  })
  images: Express.Multer.File[];
}