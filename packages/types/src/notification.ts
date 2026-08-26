// ============================================================
// Notification Types
// ============================================================

export interface Notification {
  id: string;
  userId: string;
  tenantId: string;
  title: string;
  message: string;
  type: NotificationType;
  channel: NotificationChannel;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface CreateNotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  channel: NotificationChannel;
  referenceType?: string;
  referenceId?: string;
}

export enum NotificationType {
  COMPLAINT_ASSIGNED = 'COMPLAINT_ASSIGNED',
  COMPLAINT_STATUS_CHANGED = 'COMPLAINT_STATUS_CHANGED',
  COMPLAINT_RESOLVED = 'COMPLAINT_RESOLVED',
  COMPLAINT_REOPENED = 'COMPLAINT_REOPENED',
  SLA_WARNING = 'SLA_WARNING',
  SLA_BREACHED = 'SLA_BREACHED',
  SYSTEM = 'SYSTEM',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  WEBSOCKET = 'WEBSOCKET',
}
