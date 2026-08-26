import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsRepository } from './notifications.repository';
import { WebsocketGateway } from '@/infrastructure/websocket/websocket.gateway';
import { QueueService, QueueName } from '@/infrastructure/queue/queue.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly repository: NotificationsRepository,
    private readonly wsGateway: WebsocketGateway,
    private readonly queueService: QueueService,
  ) {}

  async getUserNotifications(userId: string, filter: any) {
    return this.repository.findByUser(userId, filter);
  }

  async markAsRead(id: string, userId: string) {
    await this.repository.markAsRead(id, userId);
    return { message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: string) {
    await this.repository.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.repository.getUnreadCount(userId);
    return { count };
  }

  /**
   * Send an in-app notification and push via WebSocket
   */
  async sendNotification(params: {
    userId: string;
    tenantId: string;
    title: string;
    message: string;
    type: string;
    referenceType?: string;
    referenceId?: string;
  }) {
    const notification = await this.repository.create({
      ...params,
      channel: 'IN_APP',
    });

    // Push via WebSocket in real-time
    this.wsGateway.emitToUser(params.userId, 'notification', notification);

    // Also queue email notification
    await this.queueService.addJob(QueueName.EMAIL, 'notification:email', {
      userId: params.userId,
      title: params.title,
      message: params.message,
    });

    return notification;
  }

  // ====== Event Listeners - auto-send notifications ======

  @OnEvent('complaint.created')
  async handleComplaintCreated(payload: any) {
    this.logger.debug(`Notification: complaint created ${payload.complaintId}`);
    // Notify the citizen that complaint was received
    await this.sendNotification({
      userId: payload.citizenId,
      tenantId: payload.tenantId,
      title: 'Complaint Received',
      message: 'Your complaint has been received and is being reviewed.',
      type: 'COMPLAINT_STATUS_CHANGED',
      referenceType: 'COMPLAINT',
      referenceId: payload.complaintId,
    });
  }

  @OnEvent('complaint.assigned')
  async handleComplaintAssigned(payload: any) {
    // Notify the assigned officer
    if (payload.officerId) {
      await this.sendNotification({
        userId: payload.officerId,
        tenantId: payload.tenantId,
        title: 'New Complaint Assigned',
        message: 'A new complaint has been assigned to you for review.',
        type: 'COMPLAINT_ASSIGNED',
        referenceType: 'COMPLAINT',
        referenceId: payload.complaintId,
      });
    }

    // Notify the assigned worker
    if (payload.workerId) {
      await this.sendNotification({
        userId: payload.workerId,
        tenantId: payload.tenantId,
        title: 'New Task Assigned',
        message: 'A complaint has been assigned to you for field work.',
        type: 'COMPLAINT_ASSIGNED',
        referenceType: 'COMPLAINT',
        referenceId: payload.complaintId,
      });
    }
  }

  @OnEvent('complaint.resolved')
  async handleComplaintResolved(payload: any) {
    // Notify the citizen that their complaint was resolved
    // We need to look up the citizen ID from the complaint
    this.logger.debug(`Notification: complaint resolved ${payload.complaintId}`);
  }

  @OnEvent('complaint.status_changed')
  async handleStatusChanged(payload: any) {
    this.logger.debug(`Notification: status changed ${payload.complaintId} to ${payload.toStatus}`);
    // Push real-time update to tenant room
    this.wsGateway.emitToTenant(payload.tenantId, 'complaint:status_changed', {
      complaintId: payload.complaintId,
      fromStatus: payload.fromStatus,
      toStatus: payload.toStatus,
    });
  }
}
