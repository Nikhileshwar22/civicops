import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AssignComplaintDto {
  @ApiPropertyOptional({ description: 'Officer user ID' })
  @IsOptional()
  @IsUUID()
  officerId?: string;

  @ApiPropertyOptional({ description: 'Field worker user ID' })
  @IsOptional()
  @IsUUID()
  workerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
