import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CurrentUser, CurrentUserData } from '@/common/decorators/current-user.decorator';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';

@ApiTags('rbac')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // ====== ROLES ======

  @Get('roles')
  @RequirePermissions('role:manage')
  @ApiOperation({ summary: 'List all roles for tenant' })
  async findAllRoles(@CurrentUser() user: CurrentUserData) {
    return this.rbacService.findAllRoles(user);
  }

  @Get('roles/:id')
  @RequirePermissions('role:manage')
  @ApiOperation({ summary: 'Get role by ID with permissions' })
  async findRole(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.rbacService.findRoleById(id, user);
  }

  @Post('roles')
  @RequirePermissions('role:manage')
  @ApiOperation({ summary: 'Create a new role' })
  async createRole(@Body() dto: CreateRoleDto, @CurrentUser() user: CurrentUserData) {
    return this.rbacService.createRole(dto, user);
  }

  @Patch('roles/:id')
  @RequirePermissions('role:manage')
  @ApiOperation({ summary: 'Update a role' })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.rbacService.updateRole(id, dto, user);
  }

  @Delete('roles/:id')
  @RequirePermissions('role:manage')
  @ApiOperation({ summary: 'Delete a role (non-system only)' })
  async deleteRole(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.rbacService.deleteRole(id, user);
  }

  @Post('roles/:id/permissions')
  @RequirePermissions('role:manage')
  @ApiOperation({ summary: 'Assign permissions to a role' })
  async assignPermissions(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.rbacService.assignPermissions(id, dto, user);
  }

  // ====== PERMISSIONS ======

  @Get('permissions')
  @RequirePermissions('role:manage')
  @ApiOperation({ summary: 'List all available permissions' })
  async findAllPermissions(@CurrentUser() user: CurrentUserData) {
    return this.rbacService.findAllPermissions(user);
  }

  @Get('permissions/:id')
  @RequirePermissions('role:manage')
  @ApiOperation({ summary: 'Get permission by ID' })
  async findPermission(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    return this.rbacService.findPermissionById(id, user);
  }
}
