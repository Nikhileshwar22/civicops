// ============================================================
// Complaint Types
// ============================================================

export interface Complaint {
  id: string;
  complaintNumber: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  subcategory?: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  latitude?: number;
  longitude?: number;
  address?: string;
  tenantId: string;
  zoneId?: string;
  circleId?: string;
  wardId?: string;
  departmentId?: string;
  citizenId: string;
  assignedOfficerId?: string;
  assignedWorkerId?: string;
  resolution?: string;
  resolutionEvidence?: string[];
  slaDeadline?: string;
  slaBreached: boolean;
  aiClassification?: AiClassificationResult;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface ComplaintWithDetails extends Complaint {
  citizen: { id: string; firstName: string; lastName: string; email: string };
  assignedOfficer?: { id: string; firstName: string; lastName: string };
  assignedWorker?: { id: string; firstName: string; lastName: string };
  zone?: { id: string; name: string };
  circle?: { id: string; name: string };
  ward?: { id: string; name: string; number: number };
  department?: { id: string; name: string };
  attachments: ComplaintAttachment[];
  comments: ComplaintComment[];
  statusHistory: ComplaintStatusHistory[];
}

export interface CreateComplaintRequest {
  title: string;
  description: string;
  category: ComplaintCategory;
  subcategory?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface UpdateComplaintRequest {
  title?: string;
  description?: string;
  category?: ComplaintCategory;
  subcategory?: string;
  priority?: ComplaintPriority;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface AssignComplaintRequest {
  officerId?: string;
  workerId?: string;
  notes?: string;
}

export interface ResolveComplaintRequest {
  resolution: string;
  resolutionEvidence?: string[];
}

export interface UpdateStatusRequest {
  status: ComplaintStatus;
  notes?: string;
}

export interface ComplaintAttachment {
  id: string;
  complaintId: string;
  objectKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  url: string;
  uploadedBy: string;
  createdAt: string;
}

export interface ComplaintComment {
  id: string;
  complaintId: string;
  userId: string;
  userName: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface ComplaintStatusHistory {
  id: string;
  complaintId: string;
  fromStatus: ComplaintStatus;
  toStatus: ComplaintStatus;
  changedBy: string;
  changedByName: string;
  notes?: string;
  createdAt: string;
}

export interface ComplaintFilterQuery {
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  category?: ComplaintCategory;
  departmentId?: string;
  zoneId?: string;
  circleId?: string;
  wardId?: string;
  assignedOfficerId?: string;
  assignedWorkerId?: string;
  slaBreached?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AiClassificationResult {
  category: ComplaintCategory;
  subcategory?: string;
  priority: ComplaintPriority;
  suggestedDepartment?: string;
  suggestedSlaHours?: number;
  confidence: number;
  reasoning?: string;
}

export enum ComplaintStatus {
  RECEIVED = 'RECEIVED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
  REJECTED = 'REJECTED',
}

export enum ComplaintPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ComplaintCategory {
  GARBAGE = 'GARBAGE',
  ROAD_DAMAGE = 'ROAD_DAMAGE',
  POTHOLES = 'POTHOLES',
  DRAINAGE = 'DRAINAGE',
  WATER_LEAKAGE = 'WATER_LEAKAGE',
  STREET_LIGHTS = 'STREET_LIGHTS',
  ILLEGAL_DUMPING = 'ILLEGAL_DUMPING',
  PUBLIC_SANITATION = 'PUBLIC_SANITATION',
  PARKS = 'PARKS',
  OTHER = 'OTHER',
}
