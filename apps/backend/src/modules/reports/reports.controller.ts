import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CurrentUser, CurrentUserData } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @RequirePermissions('report:view|complaint:view|complaint:view_all')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboard(@CurrentUser() user: CurrentUserData) {
    return this.reportsService.getDashboardStats(user);
  }

  @Get('by-category')
  @RequirePermissions('report:view|complaint:view_all')
  @ApiOperation({ summary: 'Complaints grouped by category' })
  async getByCategory(@CurrentUser() user: CurrentUserData) {
    return this.reportsService.getByCategory(user);
  }

  @Get('by-priority')
  @RequirePermissions('report:view|complaint:view_all')
  @ApiOperation({ summary: 'Complaints grouped by priority' })
  async getByPriority(@CurrentUser() user: CurrentUserData) {
    return this.reportsService.getByPriority(user);
  }

  @Get('departments')
  @RequirePermissions('report:view|complaint:view_all')
  @ApiOperation({ summary: 'Department performance metrics' })
  async getDepartmentPerformance(@CurrentUser() user: CurrentUserData) {
    return this.reportsService.getDepartmentPerformance(user);
  }

  @Get('by-zone')
  @RequirePermissions('report:view|complaint:view_all')
  @ApiOperation({ summary: 'Complaints by zone' })
  async getByZone(@CurrentUser() user: CurrentUserData) {
    return this.reportsService.getByZone(user);
  }

  @Get('trend')
  @RequirePermissions('report:view|complaint:view_all')
  @ApiOperation({ summary: 'Complaint trend (last 30 days)' })
  async getTrend(@CurrentUser() user: CurrentUserData) {
    return this.reportsService.getComplaintTrend(user);
  }

  @Get('sla')
  @RequirePermissions('report:view|complaint:view_all')
  @ApiOperation({ summary: 'SLA compliance statistics' })
  async getSlaStats(@CurrentUser() user: CurrentUserData) {
    return this.reportsService.getSlaStats(user);
  }
}
