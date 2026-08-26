import { Injectable, NotFoundException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RbacRepository } from './rbac.repository';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CurrentUserData } from '@/common/decorators/current-user.decorator';

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  constructor(
    private readonly repository: RbacRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ====== ROLES ======

  async findAllRoles(user: CurrentUserData) {
    const roles = await this.repository.findAllRoles(user.tenantId);
    return roles.map((role) => ({
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
      userCount: role._count.userRoles,
      rolePermissions: undefined,
      _count: undefined,
    }));
  }

  async findRoleById(id: string, user: CurrentUserData) {
    const role = await this.repository.findRoleById(id);
    if (!role || role.tenantId !== user.tenantId) {
      throw new NotFoundException('Role not found');
    }
    return {
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
      userCount: role._count.userRoles,
      rolePermissions: undefined,
      _count: undefined,
    };
  }

  async createRole(dto: CreateRoleDto, user: CurrentUserData) {
    const role = await this.repository.createRole({
      name: dto.name,
      displayName: dto.displayName,
      description: dto.description,
      level: dto.level,
      tenantId: user.tenantId,
      isSystem: false,
    });

    this.eventEmitter.emit('rbac.role_created', {
      roleId: role.id,
      tenantId: user.tenantId,
      createdBy: user.id,
    });

    return role;
  }

  async updateRole(id: string, dto: UpdateRoleDto, user: CurrentUserData) {
    const role = await this.repository.findRoleById(id);
    if (!role || role.tenantId !== user.tenantId) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be modified');
    }

    return this.repository.updateRole(id, {
      ...(dto.displayName && { displayName: dto.displayName }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.level !== undefined && { level: dto.level }),
    });
  }

  async deleteRole(id: string, user: CurrentUserData) {
    const role = await this.repository.findRoleById(id);
    if (!role || role.tenantId !== user.tenantId) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be deleted');
    }

    if (role._count.userRoles > 0) {
      throw new ConflictException('Cannot delete a role that has users assigned');
    }

    await this.repository.deleteRole(id);

    this.eventEmitter.emit('rbac.role_deleted', {
      roleId: id,
      tenantId: user.tenantId,
      deletedBy: user.id,
    });

    return { message: 'Role deleted successfully' };
  }

  async assignPermissions(id: string, dto: AssignPermissionsDto, user: CurrentUserData) {
    const role = await this.repository.findRoleById(id);
    if (!role || role.tenantId !== user.tenantId) {
      throw new NotFoundException('Role not found');
    }

    await this.repository.assignPermissionsToRole(id, dto.permissionIds);

    this.eventEmitter.emit('rbac.permissions_assigned', {
      roleId: id,
      tenantId: user.tenantId,
      updatedBy: user.id,
      permissionCount: dto.permissionIds.length,
    });

    return this.findRoleById(id, user);
  }

  // ====== PERMISSIONS ======

  async findAllPermissions(user: CurrentUserData) {
    return this.repository.findAllPermissions(user.tenantId);
  }

  async findPermissionById(id: string, user: CurrentUserData) {
    const permission = await this.repository.findPermissionById(id);
    if (!permission || permission.tenantId !== user.tenantId) {
      throw new NotFoundException('Permission not found');
    }
    return permission;
  }
}
