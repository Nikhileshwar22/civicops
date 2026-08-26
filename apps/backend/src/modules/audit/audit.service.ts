import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/database/prisma.service';

export interface AuditLogEntry {
  userId?: string;
  tenantId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry) {
    try {
      await this.prisma.auditLog.create({
        data: entry,
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
    }
  }

  async findByTenant(tenantId: string, filter: any) {
    const where: any = { tenantId };

    if (filter.action) where.action = filter.action;
    if (filter.resourceType) where.resourceType = filter.resourceType;
    if (filter.userId) where.userId = filter.userId;

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = new Date(filter.startDate);
      if (filter.endDate) where.createdAt.lte = new Date(filter.endDate);
    }

    const { skip, take } = this.prisma.getPaginationParams(filter.page, filter.limit);

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: this.prisma.buildPaginationMeta(total, filter.page, filter.limit),
    };
  }

  // ====== Event Listeners for auto audit logging ======

  @OnEvent('auth.login')
  handleAuthLogin(payload: any) {
    this.log({
      userId: payload.userId,
      tenantId: payload.tenantId,
      action: 'AUTH_LOGIN',
      resourceType: 'USER',
      resourceId: payload.userId,
      ipAddress: payload.ipAddress,
    });
  }

  @OnEvent('auth.registered')
  handleAuthRegistered(payload: any) {
    this.log({
      userId: payload.userId,
      tenantId: payload.tenantId,
      action: 'AUTH_REGISTER',
      resourceType: 'USER',
      resourceId: payload.userId,
    });
  }

  @OnEvent('auth.logout')
  handleAuthLogout(payload: any) {
    this.log({
      userId: payload.userId,
      tenantId: payload.tenantId || 'system',
      action: 'AUTH_LOGOUT',
      resourceType: 'USER',
      resourceId: payload.userId,
    });
  }

  @OnEvent('complaint.created')
  handleComplaintCreated(payload: any) {
    this.log({
      userId: payload.citizenId,
      tenantId: payload.tenantId,
      action: 'COMPLAINT_CREATED',
      resourceType: 'COMPLAINT',
      resourceId: payload.complaintId,
      metadata: { category: payload.category },
    });
  }

  @OnEvent('complaint.assigned')
  handleComplaintAssigned(payload: any) {
    this.log({
      userId: payload.assignedBy,
      tenantId: payload.tenantId,
      action: 'COMPLAINT_ASSIGNED',
      resourceType: 'COMPLAINT',
      resourceId: payload.complaintId,
      metadata: { officerId: payload.officerId, workerId: payload.workerId },
    });
  }

  @OnEvent('complaint.status_changed')
  handleComplaintStatusChanged(payload: any) {
    this.log({
      userId: payload.changedBy,
      tenantId: payload.tenantId,
      action: 'COMPLAINT_STATUS_CHANGED',
      resourceType: 'COMPLAINT',
      resourceId: payload.complaintId,
      metadata: { fromStatus: payload.fromStatus, toStatus: payload.toStatus },
    });
  }

  @OnEvent('complaint.resolved')
  handleComplaintResolved(payload: any) {
    this.log({
      userId: payload.resolvedBy,
      tenantId: payload.tenantId,
      action: 'COMPLAINT_RESOLVED',
      resourceType: 'COMPLAINT',
      resourceId: payload.complaintId,
    });
  }
}
