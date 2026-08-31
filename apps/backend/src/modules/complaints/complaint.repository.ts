import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

interface CreateComplaintData {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  citizenId: string;
  tenantId: string;
}

interface UpdateStatusData {
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  notes?: string;
}

interface AssignData {
  officerId?: string;
  workerId?: string;
  assignedById: string;
  notes?: string;
}

interface ResolveData {
  resolution: string;
  resolutionEvidence?: string[];
  resolvedBy: string;
}

@Injectable()
export class ComplaintRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateComplaintData) {
    const complaintNumber = await this.generateComplaintNumber(data.tenantId);

    return this.prisma.complaint.create({
      data: {
        complaintNumber,
        title: data.title,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address,
        citizenId: data.citizenId,
        tenantId: data.tenantId,
        status: 'RECEIVED',
        priority: 'MEDIUM',
      },
      include: this.defaultInclude(),
    });
  }

  async findById(id: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: this.detailedInclude(),
    });
    return this.mapAttachmentUrls(complaint);
  }

  async findAll(filter: any, tenantId: string) {
    const where: any = { tenantId };

    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority;
    if (filter.category) where.category = filter.category;
    if (filter.departmentId) where.departmentId = filter.departmentId;
    if (filter.zoneId) where.zoneId = filter.zoneId;
    if (filter.circleId) where.circleId = filter.circleId;
    if (filter.wardId) where.wardId = filter.wardId;
    if (filter.assignedOfficerId) where.assignedOfficerId = filter.assignedOfficerId;
    if (filter.assignedWorkerId) where.assignedWorkerId = filter.assignedWorkerId;
    if (filter.citizenId) where.citizenId = filter.citizenId;
    if (filter.slaBreached !== undefined) where.slaBreached = filter.slaBreached;

    const andConditions: any[] = [];

    // "mineUserId" = complaints where the user is the citizen, officer, or worker
    if (filter.mineUserId) {
      andConditions.push({
        OR: [
          { citizenId: filter.mineUserId },
          { assignedOfficerId: filter.mineUserId },
          { assignedWorkerId: filter.mineUserId },
        ],
      });
    }

    if (filter.search) {
      andConditions.push({
        OR: [
          { title: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } },
          { complaintNumber: { contains: filter.search, mode: 'insensitive' } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = new Date(filter.startDate);
      if (filter.endDate) where.createdAt.lte = new Date(filter.endDate);
    }

    const { skip, take } = this.prisma.getPaginationParams(filter.page, filter.limit);

    const [data, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        include: this.defaultInclude(),
        orderBy: { [filter.sortBy || 'createdAt']: filter.sortOrder || 'desc' },
        skip,
        take,
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return {
      data: data.map((c) => this.mapAttachmentUrls(c)),
      meta: this.prisma.buildPaginationMeta(total, filter.page, filter.limit),
    };
  }

  async update(id: string, data: any) {
    return this.prisma.complaint.update({
      where: { id },
      data,
      include: this.defaultInclude(),
    });
  }

  async updateStatus(id: string, statusData: UpdateStatusData) {
    return this.prisma.$transaction(async (tx) => {
      // Update complaint status
      const complaint = await tx.complaint.update({
        where: { id },
        data: {
          status: statusData.toStatus,
          ...(statusData.toStatus === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
          ...(statusData.toStatus === 'CLOSED' ? { closedAt: new Date() } : {}),
        },
        include: this.defaultInclude(),
      });

      // Record status history
      await tx.complaintStatusHistory.create({
        data: {
          complaintId: id,
          fromStatus: statusData.fromStatus,
          toStatus: statusData.toStatus,
          changedBy: statusData.changedBy,
          notes: statusData.notes,
        },
      });

      return complaint;
    });
  }

  async assign(id: string, assignData: AssignData) {
    return this.prisma.$transaction(async (tx) => {
      const updateData: any = { status: 'ASSIGNED' };
      if (assignData.officerId) updateData.assignedOfficerId = assignData.officerId;
      if (assignData.workerId) updateData.assignedWorkerId = assignData.workerId;

      const complaint = await tx.complaint.update({
        where: { id },
        data: updateData,
        include: this.defaultInclude(),
      });

      // Record assignment
      if (assignData.officerId) {
        await tx.complaintAssignment.create({
          data: {
            complaintId: id,
            assignedToId: assignData.officerId,
            assignedById: assignData.assignedById,
            role: 'OFFICER',
            notes: assignData.notes,
          },
        });
      }

      if (assignData.workerId) {
        await tx.complaintAssignment.create({
          data: {
            complaintId: id,
            assignedToId: assignData.workerId,
            assignedById: assignData.assignedById,
            role: 'WORKER',
            notes: assignData.notes,
          },
        });
      }

      // Record status history
      await tx.complaintStatusHistory.create({
        data: {
          complaintId: id,
          fromStatus: complaint.status,
          toStatus: 'ASSIGNED',
          changedBy: assignData.assignedById,
          notes: `Assigned to ${assignData.officerId ? 'officer' : ''}${assignData.workerId ? ' worker' : ''}`,
        },
      });

      return complaint;
    });
  }

  async resolve(id: string, resolveData: ResolveData) {
    return this.prisma.$transaction(async (tx) => {
      const complaint = await tx.complaint.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          resolution: resolveData.resolution,
          resolutionEvidence: resolveData.resolutionEvidence || [],
          resolvedAt: new Date(),
        },
        include: this.defaultInclude(),
      });

      await tx.complaintStatusHistory.create({
        data: {
          complaintId: id,
          fromStatus: 'IN_PROGRESS',
          toStatus: 'RESOLVED',
          changedBy: resolveData.resolvedBy,
          notes: 'Complaint resolved',
        },
      });

      return complaint;
    });
  }

  private async generateComplaintNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.complaint.count({ where: { tenantId } });
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `CMP-${year}${month}-${(count + 1).toString().padStart(5, '0')}`;
  }

  private mapAttachmentUrls(complaint: any): any {
    if (!complaint) return complaint;
    if (!complaint.attachments) return complaint;
    return {
      ...complaint,
      attachments: complaint.attachments.map((a: any) => ({
        ...a,
        url: a.objectKey?.startsWith('http')
          ? a.objectKey
          : `/api/v1/attachments/file/${a.objectKey}`,
      })),
    };
  }

  private defaultInclude() {
    return {
      citizen: { select: { id: true, firstName: true, lastName: true, email: true } },
      assignedOfficer: { select: { id: true, firstName: true, lastName: true } },
      assignedWorker: { select: { id: true, firstName: true, lastName: true } },
      department: { select: { id: true, name: true, code: true } },
      zone: { select: { id: true, name: true } },
      circle: { select: { id: true, name: true } },
      ward: { select: { id: true, name: true, number: true } },
      attachments: { select: { id: true, fileName: true, objectKey: true, mimeType: true } },
    };
  }

  private detailedInclude() {
    return {
      ...this.defaultInclude(),
      attachments: true,
      comments: {
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' as const },
      },
      statusHistory: {
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' as const },
      },
      aiClassification: true,
    };
  }
}
