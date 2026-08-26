import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebhooksRepository } from './webhooks.repository';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { QueueService, QueueName } from '@/infrastructure/queue/queue.service';
import { CurrentUserData } from '@/common/decorators/current-user.decorator';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly repository: WebhooksRepository,
    private readonly queueService: QueueService,
  ) {}

  async findAll(user: CurrentUserData) {
    const webhooks = await this.repository.findAll(user.tenantId);
    return webhooks.map((w) => ({
      ...w,
      secret: this.maskSecret(w.secret),
      deliveryCount: w._count.deliveries,
      _count: undefined,
    }));
  }

  async findOne(id: string, user: CurrentUserData) {
    const webhook = await this.repository.findById(id);
    if (!webhook || webhook.tenantId !== user.tenantId) {
      throw new NotFoundException('Webhook not found');
    }
    return {
      ...webhook,
      secret: this.maskSecret(webhook.secret),
      deliveryCount: webhook._count.deliveries,
      _count: undefined,
    };
  }

  async create(dto: CreateWebhookDto, user: CurrentUserData) {
    const webhook = await this.repository.create({
      name: dto.name,
      url: dto.url,
      events: dto.events,
      tenantId: user.tenantId,
    });

    this.logger.log(`Webhook created: ${webhook.name} for tenant ${user.tenantId}`);
    return { ...webhook, secret: webhook.secret }; // Show full secret only on creation
  }

  async update(id: string, dto: UpdateWebhookDto, user: CurrentUserData) {
    await this.findOne(id, user);
    return this.repository.update(id, {
      ...(dto.name && { name: dto.name }),
      ...(dto.url && { url: dto.url }),
      ...(dto.events && { events: dto.events }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });
  }

  async delete(id: string, user: CurrentUserData) {
    await this.findOne(id, user);
    await this.repository.delete(id);
    return { message: 'Webhook deleted successfully' };
  }

  async regenerateSecret(id: string, user: CurrentUserData) {
    await this.findOne(id, user);
    const webhook = await this.repository.regenerateSecret(id);
    return { secret: webhook.secret }; // Return new secret
  }

  async getDeliveries(id: string, filter: any, user: CurrentUserData) {
    await this.findOne(id, user);
    return this.repository.getDeliveries(id, filter);
  }

  async testWebhook(id: string, user: CurrentUserData) {
    const webhook = await this.repository.findById(id);
    if (!webhook || webhook.tenantId !== user.tenantId) {
      throw new NotFoundException('Webhook not found');
    }

    // Queue a test delivery
    const delivery = await this.repository.createDelivery({
      webhookId: id,
      event: 'webhook.test',
      payload: {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        tenantId: user.tenantId,
        data: { message: 'This is a test webhook delivery from CivicOps' },
      },
    });

    await this.queueService.addJob(QueueName.WEBHOOKS, 'webhook:deliver', {
      webhookId: webhook.id,
      deliveryId: delivery.id,
      url: webhook.url,
      secret: webhook.secret,
      event: 'webhook.test',
      payload: delivery.payload,
      attempt: 1,
    });

    return { message: 'Test webhook queued for delivery', deliveryId: delivery.id };
  }

  // ====== Event Listeners - dispatch webhooks on events ======

  @OnEvent('complaint.created')
  async handleComplaintCreated(payload: any) {
    await this.dispatchWebhookEvent(payload.tenantId, 'complaint.created', {
      complaintId: payload.complaintId,
      citizenId: payload.citizenId,
      category: payload.category,
    });
  }

  @OnEvent('complaint.assigned')
  async handleComplaintAssigned(payload: any) {
    await this.dispatchWebhookEvent(payload.tenantId, 'complaint.assigned', {
      complaintId: payload.complaintId,
      assignedBy: payload.assignedBy,
      officerId: payload.officerId,
      workerId: payload.workerId,
    });
  }

  @OnEvent('complaint.resolved')
  async handleComplaintResolved(payload: any) {
    await this.dispatchWebhookEvent(payload.tenantId, 'complaint.resolved', {
      complaintId: payload.complaintId,
      resolvedBy: payload.resolvedBy,
      resolution: payload.resolution,
    });
  }

  @OnEvent('complaint.status_changed')
  async handleStatusChanged(payload: any) {
    const eventMap: Record<string, string> = {
      IN_PROGRESS: 'complaint.in_progress',
      CLOSED: 'complaint.closed',
      REOPENED: 'complaint.reopened',
    };
    const event = eventMap[payload.toStatus];
    if (event) {
      await this.dispatchWebhookEvent(payload.tenantId, event, {
        complaintId: payload.complaintId,
        fromStatus: payload.fromStatus,
        toStatus: payload.toStatus,
      });
    }
  }

  // ====== Private helpers ======

  private async dispatchWebhookEvent(tenantId: string, event: string, data: any) {
    try {
      // Find all active webhooks subscribing to this event using JSON query
      const webhooks = await this.repository.findAll(tenantId);
      const matching = webhooks.filter(
        (w) => w.isActive && (w.events as any[]).includes(event),
      );

      for (const webhook of matching) {
        const deliveryPayload = {
          id: `del_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          event,
          timestamp: new Date().toISOString(),
          tenantId,
          data,
        };

        const delivery = await this.repository.createDelivery({
          webhookId: webhook.id,
          event,
          payload: deliveryPayload,
        });

        await this.queueService.addJob(
          QueueName.WEBHOOKS,
          'webhook:deliver',
          {
            webhookId: webhook.id,
            deliveryId: delivery.id,
            url: webhook.url,
            secret: webhook.secret,
            event,
            payload: deliveryPayload,
            attempt: 1,
          },
          {
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 },
          },
        );
      }

      if (matching.length > 0) {
        this.logger.debug(`Dispatched ${event} to ${matching.length} webhook(s)`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to dispatch webhook event ${event}: ${error.message}`);
    }
  }

  private maskSecret(secret: string): string {
    if (!secret || secret.length < 8) return '****';
    return secret.slice(0, 6) + '...' + secret.slice(-4);
  }
}
