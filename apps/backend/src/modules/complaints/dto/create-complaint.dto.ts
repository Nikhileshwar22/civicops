import { IsString, MinLength, MaxLength, IsOptional, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum ComplaintCategory {
  GARBAGE = 'GARBAGE',
  ROAD_DAMAGE = 'ROAD_DAMAGE',
  POTHOLES = 'POTHOLES',
  DRAINAGE = 'DRAINAGE',
  WATER_LEAKAGE = 'WATER_LEAKAGE',
  STREET_LIGHTS = 'STREET_LIGHTS',
  ILLEGAL_DUMPING = 'ILLEGAL_DUMPING',
  PUBLIC_SANITATION = 'PUBLIC_SANITATION',
  PARKS = 'PARKS',
  OTHER = 'OTHER',
}

export class CreateComplaintDto {
  @ApiProperty({ example: 'Large pothole on main road' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'There is a large pothole near the bus stop that is causing accidents' })
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  description: string;

  @ApiProperty({ enum: ComplaintCategory, example: 'POTHOLES' })
  @IsEnum(ComplaintCategory)
  category: string;

  @ApiPropertyOptional({ example: 'Major road damage' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subcategory?: string;

  @ApiPropertyOptional({ example: 17.385 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 78.4867 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: 'Near Bus Stop #42, Main Road, Ward 57' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;
}
