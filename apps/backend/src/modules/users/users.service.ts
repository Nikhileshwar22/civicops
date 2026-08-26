import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { CurrentUserData } from '@/common/decorators/current-user.decorator';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly repository: UsersRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(filter: UserFilterDto, user: CurrentUserData) {
    return this.repository.findAll(user.tenantId, filter);
  }

  async getAssignableWorkers(user: CurrentUserData) {
    return this.repository.findByRoleNames(user.tenantId, ['FIELD_WORKER', 'FIELD_SUPERVISOR']);
  }

  async findOne(id: string, user: CurrentUserData) {
    const found = await this.repository.findById(id);
    if (!found || found.tenantId !== user.tenantId) {
      throw new NotFoundException('User not found');
    }
    return this.formatUserResponse(found);
  }

  async getProfile(user: CurrentUserData) {
    return this.findOne(user.id, user);
  }

  async create(dto: CreateUserDto, currentUser: CurrentUserData) {
    // Check email uniqueness within tenant
    const existing = await this.repository.findByEmail(dto.email, currentUser.tenantId);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.repository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      tenantId: currentUser.tenantId,
    });

    // Assign roles
    if (dto.roleIds && dto.roleIds.length > 0) {
      await this.repository.assignRoles(user.id, dto.roleIds);
    }

    // Assign scopes
    if (dto.scopeType) {
      const scopes = this.buildScopes(dto);
      await this.repository.assignScopes(user.id, scopes);
    }

    this.eventEmitter.emit('user.created', {
      userId: user.id,
      tenantId: currentUser.tenantId,
      createdBy: currentUser.id,
    });

    this.logger.log(`User ${user.email} created by ${currentUser.id}`);
    return this.findOne(user.id, currentUser);
  }

  async update(id: string, dto: UpdateUserDto, currentUser: CurrentUserData) {
    const user = await this.repository.findById(id);
    if (!user || user.tenantId !== currentUser.tenantId) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.repository.update(id, {
      ...(dto.firstName && { firstName: dto.firstName }),
      ...(dto.lastName && { lastName: dto.lastName }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
    });

    // Update roles if provided
    if (dto.roleIds && dto.roleIds.length > 0) {
      await this.repository.assignRoles(id, dto.roleIds);
    }

    // Update scopes if provided
    if (dto.scopeType) {
      const scopes = this.buildScopes(dto);
      await this.repository.assignScopes(id, scopes);
    }

    this.eventEmitter.emit('user.updated', {
      userId: id,
      tenantId: currentUser.tenantId,
      updatedBy: currentUser.id,
    });

    return this.findOne(id, currentUser);
  }

  async updateProfile(dto: UpdateUserDto, currentUser: CurrentUserData) {
    // Users can only update their own name and phone
    await this.repository.update(currentUser.id, {
      ...(dto.firstName && { firstName: dto.firstName }),
      ...(dto.lastName && { lastName: dto.lastName }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
    });

    return this.findOne(currentUser.id, currentUser);
  }

  async changePassword(dto: ChangePasswordDto, currentUser: CurrentUserData) {
    const user = await this.repository.findById(currentUser.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new ForbiddenException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.repository.updatePassword(currentUser.id, newHash);

    this.eventEmitter.emit('user.password_changed', {
      userId: currentUser.id,
      tenantId: currentUser.tenantId,
    });

    return { message: 'Password changed successfully' };
  }

  async deactivate(id: string, currentUser: CurrentUserData) {
    const user = await this.repository.findById(id);
    if (!user || user.tenantId !== currentUser.tenantId) {
      throw new NotFoundException('User not found');
    }

    if (id === currentUser.id) {
      throw new ForbiddenException('Cannot deactivate your own account');
    }

    await this.repository.deactivate(id);

    this.eventEmitter.emit('user.deactivated', {
      userId: id,
      tenantId: currentUser.tenantId,
      deactivatedBy: currentUser.id,
    });

    return { message: 'User deactivated successfully' };
  }

  async activate(id: string, currentUser: CurrentUserData) {
    const user = await this.repository.findById(id);
    if (!user || user.tenantId !== currentUser.tenantId) {
      throw new NotFoundException('User not found');
    }

    await this.repository.activate(id);

    this.eventEmitter.emit('user.activated', {
      userId: id,
      tenantId: currentUser.tenantId,
      activatedBy: currentUser.id,
    });

    return { message: 'User activated successfully' };
  }

  private buildScopes(dto: any): any[] {
    const scopes: any[] = [];
    const baseScope: any = { scopeType: dto.scopeType };

    if (dto.departmentIds && dto.departmentIds.length > 0) {
      for (const deptId of dto.departmentIds) {
        scopes.push({ ...baseScope, departmentId: deptId });
      }
    }

    if (dto.zoneIds && dto.zoneIds.length > 0) {
      for (const zoneId of dto.zoneIds) {
        scopes.push({ ...baseScope, zoneId });
      }
    } else if (dto.circleIds && dto.circleIds.length > 0) {
      for (const circleId of dto.circleIds) {
        scopes.push({ ...baseScope, circleId });
      }
    } else if (dto.wardIds && dto.wardIds.length > 0) {
      for (const wardId of dto.wardIds) {
        scopes.push({ ...baseScope, wardId });
      }
    }

    // If no geography/dept, just add the base scope type
    if (scopes.length === 0) {
      scopes.push(baseScope);
    }

    return scopes;
  }

  private formatUserResponse(user: any) {
    const roles = user.userRoles?.map((ur: any) => ({
      id: ur.role.id,
      name: ur.role.name,
      displayName: ur.role.displayName,
    })) || [];

    const permissions = [
      ...new Set(
        (user.userRoles || []).flatMap((ur: any) =>
          (ur.role.rolePermissions || []).map((rp: any) => rp.permission.name),
        ),
      ),
    ];

    const scopes = (user.userScopes || []).map((s: any) => ({
      scopeType: s.scopeType,
      zone: s.zone,
      circle: s.circle,
      ward: s.ward,
      department: s.department,
    }));

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      tenantId: user.tenantId,
      roles,
      permissions,
      scopes,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
