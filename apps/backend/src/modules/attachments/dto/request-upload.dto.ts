import { IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestUploadDto {
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
