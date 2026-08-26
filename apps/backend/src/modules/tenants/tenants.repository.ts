import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class TenantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: any) {
    const where: any = {};
    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { slug: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const { skip, take } = this.prisma.getPaginationParams(filter.page, filter.limit);

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return { data, meta: this.prisma.buildPaginationMeta(total, filter.page, filter.limit) };
  }

  async findById(id: string) {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  async findBySlug(slug: string) {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  async create(data: any) {
    return this.prisma.tenant.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.tenant.update({ where: { id }, data });
  }

  async getStats(tenantId: string) {
    const [users, complaints, departments, zones] = await Promise.all([
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.complaint.count({ where: { tenantId } }),
      this.prisma.department.count({ where: { tenantId } }),
      this.prisma.zone.count({ where: { tenantId } }),
    ]);
    return { users, complaints, departments, zones };
  }
}
