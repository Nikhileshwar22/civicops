import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/infrastructure/redis/cache.service';
import { CurrentUserData } from '@/common/decorators/current-user.decorator';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Dashboard overview stats for the authenticated user's scope
   */
  async getDashboardStats(user: CurrentUserData) {
    const cacheKey = `dashboard:${user.tenantId}:${user.roles[0] || 'default'}`;

    return this.cacheService.getOrSet(cacheKey, async () => {
      const tenantId = user.tenantId;

      const [total, received, underReview, assigned, inProgress, resolved, closed, reopened, slaBreached] =
        await Promise.all([
          this.prisma.complaint.count({ where: { tenantId } }),
          this.prisma.complaint.count({ where: { tenantId, status: 'RECEIVED' } }),
          this.prisma.complaint.count({ where: { tenantId, status: 'UNDER_REVIEW' } }),
          this.prisma.complaint.count({ where: { tenantId, status: 'ASSIGNED' } }),
          this.prisma.complaint.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
          this.prisma.complaint.count({ where: { tenantId, status: 'RESOLVED' } }),
          this.prisma.complaint.count({ where: { tenantId, status: 'CLOSED' } }),
          this.prisma.complaint.count({ where: { tenantId, status: 'REOPENED' } }),
          this.prisma.complaint.count({ where: { tenantId, slaBreached: true } }),
        ]);

      return {
        total,
        byStatus: { received, underReview, assigned, inProgress, resolved, closed, reopened },
        slaBreached,
        pending: received + underReview,
        active: assigned + inProgress,
        completed: resolved + closed,
      };
    }, 120); // 2 minute cache
  }

  /**
   * Complaints grouped by category
   */
  async getByCategory(user: CurrentUserData) {
    const tenantId = user.tenantId;

    const results = await this.prisma.complaint.groupBy({
      by: ['category'],
      where: { tenantId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    return results.map((r) => ({ category: r.category, count: r._count.id }));
  }

  /**
   * Complaints grouped by priority
   */
  async getByPriority(user: CurrentUserData) {
    const tenantId = user.tenantId;

    const results = await this.prisma.complaint.groupBy({
      by: ['priority'],
      where: { tenantId },
      _count: { id: true },
    });

    return results.map((r) => ({ priority: r.priority, count: r._count.id }));
  }

  /**
   * Department performance - complaints per department with resolution stats
   */
  async getDepartmentPerformance(user: CurrentUserData) {
    const tenantId = user.tenantId;

    const departments = await this.prisma.department.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        code: true,
        _count: { select: { complaints: true } },
        complaints: {
          select: { status: true, slaBreached: true },
        },
      },
    });

    return departments.map((dept) => {
      const total = dept._count.complaints;
      const resolved = dept.complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
      const breached = dept.complaints.filter((c) => c.slaBreached).length;

      return {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        total,
        resolved,
        pending: total - resolved,
        slaBreached: breached,
        resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      };
    });
  }

  /**
   * Zone-wise complaint distribution
   */
  async getByZone(user: CurrentUserData) {
    const tenantId = user.tenantId;

    const results = await this.prisma.complaint.groupBy({
      by: ['zoneId'],
      where: { tenantId, zoneId: { not: null } },
      _count: { id: true },
    });

    const zones = await this.prisma.zone.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });

    const zoneMap = new Map(zones.map((z) => [z.id, z.name]));

    return results.map((r) => ({
      zoneId: r.zoneId,
      zoneName: zoneMap.get(r.zoneId!) || 'Unknown',
      count: r._count.id,
    }));
  }

  /**
   * Complaints trend - daily count for last 30 days
   */
  async getComplaintTrend(user: CurrentUserData) {
    const tenantId = user.tenantId;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const complaints = await this.prisma.complaint.findMany({
      where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
    });

    // Group by date
    const dailyCounts: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dailyCounts[key] = 0;
    }

    complaints.forEach((c) => {
      const key = c.createdAt.toISOString().split('T')[0];
      if (dailyCounts[key] !== undefined) dailyCounts[key]++;
    });

    return Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * SLA compliance stats
   */
  async getSlaStats(user: CurrentUserData) {
    const tenantId = user.tenantId;

    const [total, breached, onTime] = await Promise.all([
      this.prisma.complaint.count({ where: { tenantId, status: { in: ['RESOLVED', 'CLOSED'] } } }),
      this.prisma.complaint.count({ where: { tenantId, status: { in: ['RESOLVED', 'CLOSED'] }, slaBreached: true } }),
      this.prisma.complaint.count({ where: { tenantId, status: { in: ['RESOLVED', 'CLOSED'] }, slaBreached: false } }),
    ]);

    return {
      total,
      breached,
      onTime,
      complianceRate: total > 0 ? Math.round((onTime / total) * 100) : 100,
    };
  }
}
