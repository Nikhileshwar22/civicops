import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DepartmentsRepository } from './departments.repository';
import { CacheService } from '@/infrastructure/redis/cache.service';
import { CurrentUserData } from '@/common/decorators/current-user.decorator';

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(
    private readonly repository: DepartmentsRepository,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(user: CurrentUserData) {
    return this.cacheService.getOrSet(
      `dept:${user.tenantId}`,
      async () => {
        const departments = await this.repository.findAll(user.tenantId);
        return departments.map((d) => ({
          ...d,
          complaintCount: d._count.complaints,
          _count: undefined,
        }));
      },
      3600,
    );
  }

  async findOne(id: string, user: CurrentUserData) {
    const dept = await this.repository.findById(id);
    if (!dept || dept.tenantId !== user.tenantId) {
      throw new NotFoundException('Department not found');
    }
    return { ...dept, complaintCount: dept._count.complaints, _count: undefined };
  }

  async create(data: any, user: CurrentUserData) {
    const dept = await this.repository.create({
      name: data.name,
      code: data.code,
      description: data.description,
      tenantId: user.tenantId,
    });
    await this.cacheService.invalidateDepartments(user.tenantId);
    return dept;
  }

  async update(id: string, data: any, user: CurrentUserData) {
    await this.findOne(id, user);
    const updated = await this.repository.update(id, {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    });
    await this.cacheService.invalidateDepartments(user.tenantId);
    return updated;
  }
}
