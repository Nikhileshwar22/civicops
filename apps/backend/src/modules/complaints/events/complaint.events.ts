// ============================================================
// Complaint Domain Events
// These events are emitted by ComplaintService and handled by
// various listeners (AI, Webhooks, Notifications, Audit)
// ============================================================

export class ComplaintCreatedEvent {
  constructor(
    public readonly complaintId: string,
    public readonly tenantId: string,
    public readonly citizenId: string,
    public readonly category: string,
    public readonly description: string,
  ) {}
}

export class ComplaintAssignedEvent {
  constructor(
    public readonly complaintId: string,
    public readonly tenantId: string,
    public readonly assignedBy: string,
    public readonly officerId?: string,
    public readonly workerId?: string,
  ) {}
}

export class ComplaintStatusChangedEvent {
  constructor(
    public readonly complaintId: string,
    public readonly tenantId: string,
    public readonly fromStatus: string,
    public readonly toStatus: string,
    public readonly changedBy: string,
  ) {}
}

export class ComplaintResolvedEvent {
  constructor(
    public readonly complaintId: string,
    public readonly tenantId: string,
    public readonly resolvedBy: string,
    public readonly resolution: string,
  ) {}
}

export class ComplaintReopenedEvent {
  constructor(
    public readonly complaintId: string,
    public readonly tenantId: string,
    public readonly reopenedBy: string,
  ) {}
}
