import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CurrentUser, CurrentUserData } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';

@ApiTags('departments')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @RequirePermissions('department:view')
  @ApiOperation({ summary: 'List all departments' })
  async findAll(@CurrentUser() user: CurrentUserData) {
    return this.departmentsService.findAll(user);
  }

  @Get(':id')
  @RequirePermissions('department:view')
  @ApiOperation({ summary: 'Get department by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.departmentsService.findOne(id, user);
  }

  @Post()
  @RequirePermissions('department:manage')
  @ApiOperation({ summary: 'Create a department' })
  async create(@Body() body: any, @CurrentUser() user: CurrentUserData) {
    return this.departmentsService.create(body, user);
  }

  @Patch(':id')
  @RequirePermissions('department:manage')
  @ApiOperation({ summary: 'Update a department' })
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.departmentsService.update(id, body, user);
  }
}
