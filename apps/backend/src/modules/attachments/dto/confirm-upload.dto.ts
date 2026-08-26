import { IsString, IsNumber, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmUploadDto {
  @ApiProperty()
  @IsUUID()
  complaintId: string;

  @ApiProperty({ example: 'tenant-id/complaints/abc123.jpg' })
  @IsString()
  objectKey: string;

  @ApiProperty({ example: 'pothole-photo.jpg' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  mimeType: string;

  @ApiProperty({ example: 2048000 })
  @IsNumber()
  @Min(1)
  @Max(10485760)
  fileSize: number;
}
