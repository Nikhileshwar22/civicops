import { IsString, MinLength, MaxLength, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResolveComplaintDto {
  @ApiProperty({ example: 'Pothole has been filled and road resurfaced' })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  resolution: string;

  @ApiPropertyOptional({ type: [String], description: 'Proof image paths/URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resolutionEvidence?: string[];
}
