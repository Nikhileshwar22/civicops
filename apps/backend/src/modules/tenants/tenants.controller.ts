import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CurrentUser, CurrentUserData } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('current')
  @RequirePermissions('tenant:view')
  @ApiOperation({ summary: 'Get current tenant info' })
  async getCurrent(@CurrentUser() user: CurrentUserData) {
    return this.tenantsService.findCurrent(user);
  }

  @Get('current/stats')
  @RequirePermissions('tenant:view')
  @ApiOperation({ summary: 'Get current tenant statistics' })
  async getStats(@CurrentUser() user: CurrentUserData) {
    return this.tenantsService.getStats(user);
  }

  @Get()
  @RequirePermissions('tenant:view_all')
  @ApiOperation({ summary: 'List all tenants (super admin)' })
  async findAll(@Query() filter: any) {
    return this.tenantsService.findAll(filter);
  }

  @Get(':id')
  @RequirePermissions('tenant:view')
  @ApiOperation({ summary: 'Get tenant by ID' })
  async findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Post()
  @RequirePermissions('system:admin')
  @ApiOperation({ summary: 'Create a new tenant (super admin)' })
  async create(@Body() dto: CreateTenantDto, @CurrentUser() user: CurrentUserData) {
    return this.tenantsService.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions('tenant:update')
  @ApiOperation({ summary: 'Update tenant' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.tenantsService.update(id, dto, user);
  }
}
