import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: {
              include: { rolePermissions: { include: { permission: true } } },
            },
          },
        },
        userScopes: {
          include: { zone: true, circle: true, ward: true, department: true },
        },
      },
    });
  }

  async findByEmail(email: string, tenantId: string) {
    return this.prisma.user.findFirst({
      where: { email, tenantId },
    });
  }

  async findByRoleNames(tenantId: string, roleNames: string[]) {
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        userRoles: { some: { role: { name: { in: roleNames } } } },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userRoles: {
          include: { role: { select: { name: true, displayName: true } } },
        },
        userScopes: {
          include: { ward: { select: { id: true, name: true, number: true } } },
        },
      },
      orderBy: { firstName: 'asc' },
    });

    return users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.userRoles[0]?.role?.displayName || 'Worker',
      roleName: u.userRoles[0]?.role?.name,
      ward: u.userScopes.find((s) => s.ward)?.ward || null,
    }));
  }

  async findAll(tenantId: string, filter: any) {
    const where: any = { tenantId };

    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    if (filter.roleId) {
      where.userRoles = { some: { roleId: filter.roleId } };
    }
    if (filter.search) {
      where.OR = [
        { firstName: { contains: filter.search, mode: 'insensitive' } },
        { lastName: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = this.prisma.getPaginationParams(filter.page, filter.limit);

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          isActive: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,
          userRoles: {
            include: { role: { select: { id: true, name: true, displayName: true } } },
          },
          userScopes: {
            include: {
              zone: { select: { id: true, name: true } },
              circle: { select: { id: true, name: true } },
              ward: { select: { id: true, name: true, number: true } },
              department: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { [filter.sortBy || 'createdAt']: filter.sortOrder || 'desc' },
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: this.prisma.buildPaginationMeta(total, filter.page, filter.limit),
    };
  }

  async create(data: any) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        tenantId: data.tenantId,
        isActive: true,
        isEmailVerified: false,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deactivate(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async updatePassword(id: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async assignRoles(userId: string, roleIds: string[]) {
    // Remove existing roles
    await this.prisma.userRole.deleteMany({ where: { userId } });
    // Assign new roles
    await this.prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({ userId, roleId })),
    });
  }

  async assignScopes(userId: string, scopes: any[]) {
    // Remove existing scopes
    await this.prisma.userScope.deleteMany({ where: { userId } });
    // Assign new scopes
    if (scopes.length > 0) {
      await this.prisma.userScope.createMany({
        data: scopes.map((s) => ({ userId, ...s })),
      });
    }
  }
}
