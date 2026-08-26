import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionsDto {
  @ApiProperty({ type: [String], description: 'Array of permission IDs to assign' })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}
