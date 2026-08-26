import { IsString, IsUrl, MinLength, MaxLength, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWebhookDto {
  @ApiProperty({ example: 'External CRM Integration' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'https://api.example.com/webhooks/civicops' })
  @IsUrl()
  url: string;

  @ApiProperty({
    type: [String],
    example: ['complaint.created', 'complaint.resolved'],
  })
  @IsArray()
  @IsString({ each: true })
  events: string[];
}
