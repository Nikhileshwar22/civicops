import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { CurrentUser, CurrentUserData } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('audit:view')
  @ApiOperation({ summary: 'Get audit logs for the tenant' })
  async findAll(
    @Query() filter: any,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.auditService.findByTenant(user.tenantId, filter);
  }
}
