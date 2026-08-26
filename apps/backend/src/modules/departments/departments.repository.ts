import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class DepartmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId },
      include: { _count: { select: { complaints: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { complaints: true } } },
    });
  }

  async create(data: any) {
    return this.prisma.department.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.department.update({ where: { id }, data });
  }
}
