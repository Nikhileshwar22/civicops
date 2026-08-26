import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.webhook.findMany({
      where: { tenantId },
      include: { _count: { select: { deliveries: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.webhook.findUnique({
      where: { id },
      include: { _count: { select: { deliveries: true } } },
    });
  }

  async findActiveByEvent(tenantId: string, event: string) {
    return this.prisma.webhook.findMany({
      where: {
        tenantId,
        isActive: true,
        events: { path: [], array_contains: event },
      },
    });
  }

  async create(data: { name: string; url: string; events: string[]; tenantId: string }) {
    const secret = crypto.randomBytes(32).toString('hex');
    return this.prisma.webhook.create({
      data: {
        name: data.name,
        url: data.url,
        secret,
        events: data.events,
        tenantId: data.tenantId,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.webhook.update({ where: { id }, data });
  }

  async delete(id: string) {
    // Delete deliveries first then webhook
    await this.prisma.webhookDelivery.deleteMany({ where: { webhookId: id } });
    return this.prisma.webhook.delete({ where: { id } });
  }

  async regenerateSecret(id: string) {
    const secret = crypto.randomBytes(32).toString('hex');
    return this.prisma.webhook.update({ where: { id }, data: { secret } });
  }

  // ====== DELIVERIES ======

  async createDelivery(data: {
    webhookId: string;
    event: string;
    payload: any;
    maxAttempts?: number;
  }) {
    return this.prisma.webhookDelivery.create({
      data: {
        webhookId: data.webhookId,
        event: data.event,
        payload: data.payload,
        maxAttempts: data.maxAttempts || 5,
      },
    });
  }

  async updateDelivery(id: string, data: any) {
    return this.prisma.webhookDelivery.update({ where: { id }, data });
  }

  async getDeliveries(webhookId: string, filter: any) {
    const where: any = { webhookId };
    if (filter.success !== undefined) where.success = filter.success;

    const { skip, take } = this.prisma.getPaginationParams(filter.page, filter.limit);

    const [data, total] = await Promise.all([
      this.prisma.webhookDelivery.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.webhookDelivery.count({ where }),
    ]);

    return { data, meta: this.prisma.buildPaginationMeta(total, filter.page, filter.limit) };
  }
}
