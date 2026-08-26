import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    tenantId: string;
    title: string;
    message: string;
    type: string;
    channel: string;
    referenceType?: string;
    referenceId?: string;
  }) {
    return this.prisma.notification.create({ data });
  }

  async findByUser(userId: string, filter: any) {
    const where: any = { userId };
    if (filter.isRead !== undefined) where.isRead = filter.isRead;

    const { skip, take } = this.prisma.getPaginationParams(filter.page, filter.limit);

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data,
      unreadCount,
      meta: this.prisma.buildPaginationMeta(total, filter.page, filter.limit),
    };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }
}
