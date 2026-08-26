import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class RbacRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ====== ROLES ======

  async findAllRoles(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
      orderBy: { level: 'desc' },
    });
  }

  async findRoleById(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
    });
  }

  async createRole(data: any) {
    return this.prisma.role.create({
      data,
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async updateRole(id: string, data: any) {
    return this.prisma.role.update({
      where: { id },
      data,
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async deleteRole(id: string) {
    // Remove role permissions first, then role
    await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await this.prisma.userRole.deleteMany({ where: { roleId: id } });
    return this.prisma.role.delete({ where: { id } });
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    // Remove existing
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    // Assign new
    if (permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      });
    }
  }

  // ====== PERMISSIONS ======

  async findAllPermissions(tenantId: string) {
    return this.prisma.permission.findMany({
      where: { tenantId },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  async findPermissionById(id: string) {
    return this.prisma.permission.findUnique({ where: { id } });
  }

  async createPermission(data: any) {
    return this.prisma.permission.create({ data });
  }

  async deletePermission(id: string) {
    await this.prisma.rolePermission.deleteMany({ where: { permissionId: id } });
    return this.prisma.permission.delete({ where: { id } });
  }
}
