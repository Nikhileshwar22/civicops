import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ComplaintRepository } from './complaint.repository';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { AssignComplaintDto } from './dto/assign-complaint.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ResolveComplaintDto } from './dto/resolve-complaint.dto';
import { ComplaintFilterDto } from './dto/complaint-filter.dto';
import { CurrentUserData } from '@/common/decorators/current-user.decorator';

@Injectable()
export class ComplaintService {
  private readonly logger = new Logger(ComplaintService.name);

  constructor(
    private readonly repository: ComplaintRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateComplaintDto, user: CurrentUserData) {
    const complaint = await this.repository.create({
      ...dto,
      citizenId: user.id,
      tenantId: user.tenantId,
    });

    // Emit event for async processing (AI classification, notifications, webhooks)
    this.eventEmitter.emit('complaint.created', {
      complaintId: complaint.id,
      tenantId: user.tenantId,
      citizenId: user.id,
      category: dto.category,
      description: dto.description,
    });

    this.logger.log(`Complaint ${complaint.complaintNumber} created by ${user.id}`);
    return complaint;
  }

  async findAll(filter: ComplaintFilterDto, user: CurrentUserData) {
    // Apply scope-based filtering
    const scopedFilter = this.applyScopeFilter(filter, user);
    return this.repository.findAll(scopedFilter, user.tenantId);
  }

  async findOne(id: string, user: CurrentUserData) {
    const complaint = await this.repository.findById(id);

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    // Verify tenant isolation
    if (complaint.tenantId !== user.tenantId) {
      throw new NotFoundException('Complaint not found');
    }

    // Verify scope access
    this.verifyScopeAccess(complaint, user);

    return complaint;
  }

  async update(id: string, dto: UpdateComplaintDto, user: CurrentUserData) {
    const complaint = await this.findOne(id, user);

    const updated = await this.repository.update(id, dto);

    this.eventEmitter.emit('complaint.updated', {
      complaintId: id,
      tenantId: user.tenantId,
      updatedBy: user.id,
      changes: dto,
    });

    return updated;
  }

  async updateStatus(id: string, dto: UpdateStatusDto, user: CurrentUserData) {
    const complaint = await this.findOne(id, user);

    const updated = await this.repository.updateStatus(id, {
      fromStatus: complaint.status,
      toStatus: dto.status,
      changedBy: user.id,
      notes: dto.notes,
    });

    this.eventEmitter.emit('complaint.status_changed', {
      complaintId: id,
      tenantId: user.tenantId,
      fromStatus: complaint.status,
      toStatus: dto.status,
      changedBy: user.id,
    });

    return updated;
  }

  async assign(id: string, dto: AssignComplaintDto, user: CurrentUserData) {
    const complaint = await this.findOne(id, user);

    const updated = await this.repository.assign(id, {
      officerId: dto.officerId,
      workerId: dto.workerId,
      assignedById: user.id,
      notes: dto.notes,
    });

    this.eventEmitter.emit('complaint.assigned', {
      complaintId: id,
      tenantId: user.tenantId,
      assignedBy: user.id,
      officerId: dto.officerId,
      workerId: dto.workerId,
    });

    return updated;
  }

  async resolve(id: string, dto: ResolveComplaintDto, user: CurrentUserData) {
    const complaint = await this.findOne(id, user);

    if (!['ASSIGNED', 'IN_PROGRESS'].includes(complaint.status)) {
      throw new ForbiddenException('Complaint must be assigned or in progress to resolve');
    }

    const updated = await this.repository.resolve(id, {
      resolution: dto.resolution,
      resolutionEvidence: dto.resolutionEvidence,
      resolvedBy: user.id,
    });

    this.eventEmitter.emit('complaint.resolved', {
      complaintId: id,
      tenantId: user.tenantId,
      resolvedBy: user.id,
      resolution: dto.resolution,
    });

    return updated;
  }

  async reopen(id: string, user: CurrentUserData) {
    const complaint = await this.findOne(id, user);

    if (!['RESOLVED', 'CLOSED'].includes(complaint.status)) {
      throw new ForbiddenException('Only resolved or closed complaints can be reopened');
    }

    const updated = await this.repository.updateStatus(id, {
      fromStatus: complaint.status,
      toStatus: 'REOPENED',
      changedBy: user.id,
      notes: 'Complaint reopened',
    });

    this.eventEmitter.emit('complaint.reopened', {
      complaintId: id,
      tenantId: user.tenantId,
      reopenedBy: user.id,
    });

    return updated;
  }

  private applyScopeFilter(filter: ComplaintFilterDto, user: CurrentUserData): ComplaintFilterDto {
    const scopedFilter = { ...filter };

    switch (user.scope.type) {
      case 'GLOBAL':
      case 'TENANT':
        // Can see all tenant complaints
        break;
      case 'ZONE':
        if (user.scope.zoneIds?.length) {
          scopedFilter.zoneId = scopedFilter.zoneId || user.scope.zoneIds[0];
        }
        break;
      case 'CIRCLE':
        if (user.scope.circleIds?.length) {
          scopedFilter.circleId = scopedFilter.circleId || user.scope.circleIds[0];
        }
        break;
      case 'WARD':
        if (user.scope.wardIds?.length) {
          scopedFilter.wardId = scopedFilter.wardId || user.scope.wardIds[0];
        }
        break;
      case 'ASSIGNED_ONLY':
        // Citizens see only their own complaints.
        // Workers/supervisors see complaints assigned to them.
        // mineUserId produces an OR match on citizen / officer / worker.
        if (user.permissions.includes('complaint:view_all')) {
          break;
        }
        (scopedFilter as any).mineUserId = user.id;
        break;
    }

    return scopedFilter;
  }

  private verifyScopeAccess(complaint: any, user: CurrentUserData) {
    if (user.scope.type === 'GLOBAL' || user.scope.type === 'TENANT') {
      return;
    }

    if (user.scope.type === 'ZONE' && user.scope.zoneIds?.length) {
      if (complaint.zoneId && !user.scope.zoneIds.includes(complaint.zoneId)) {
        throw new ForbiddenException('Access denied: complaint outside your zone');
      }
      return;
    }

    if (user.scope.type === 'WARD' && user.scope.wardIds?.length) {
      if (complaint.wardId && !user.scope.wardIds.includes(complaint.wardId)) {
        throw new ForbiddenException('Access denied: complaint outside your ward');
      }
      return;
    }

    if (user.scope.type === 'ASSIGNED_ONLY') {
      const isOwner = complaint.citizenId === user.id;
      const isAssignedOfficer = complaint.assignedOfficerId === user.id;
      const isAssignedWorker = complaint.assignedWorkerId === user.id;
      const hasViewAll = user.permissions.includes('complaint:view_all');

      if (!isOwner && !isAssignedOfficer && !isAssignedWorker && !hasViewAll) {
        throw new ForbiddenException('Access denied');
      }
    }
  }
}
