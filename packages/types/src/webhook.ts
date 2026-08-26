// ============================================================
// Webhook Types
// ============================================================

export interface Webhook {
  id: string;
  tenantId: string;
  name: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: Record<string, any>;
  attempt: number;
  maxAttempts: number;
  httpStatus?: number;
  response?: string;
  success: boolean;
  nextRetryAt?: string;
  createdAt: string;
}

export interface CreateWebhookRequest {
  name: string;
  url: string;
  events: WebhookEvent[];
}

export interface UpdateWebhookRequest {
  name?: string;
  url?: string;
  events?: WebhookEvent[];
  isActive?: boolean;
}

export enum WebhookEvent {
  COMPLAINT_CREATED = 'complaint.created',
  COMPLAINT_ASSIGNED = 'complaint.assigned',
  COMPLAINT_IN_PROGRESS = 'complaint.in_progress',
  COMPLAINT_RESOLVED = 'complaint.resolved',
  COMPLAINT_CLOSED = 'complaint.closed',
  COMPLAINT_REOPENED = 'complaint.reopened',
  AI_CLASSIFICATION_COMPLETED = 'ai.classification.completed',
  AI_SUMMARY_GENERATED = 'ai.summary.generated',
  SLA_WARNING = 'sla.warning',
  SLA_BREACHED = 'sla.breached',
}
