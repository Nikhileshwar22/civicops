import { z } from 'zod';

const complaintCategories = [
  'GARBAGE',
  'ROAD_DAMAGE',
  'POTHOLES',
  'DRAINAGE',
  'WATER_LEAKAGE',
  'STREET_LIGHTS',
  'ILLEGAL_DUMPING',
  'PUBLIC_SANITATION',
  'PARKS',
  'OTHER',
] as const;

const complaintPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

const complaintStatuses = [
  'RECEIVED',
  'UNDER_REVIEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
  'REJECTED',
] as const;

export const createComplaintSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be at most 200 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description must be at most 5000 characters'),
  category: z.enum(complaintCategories),
  subcategory: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(500).optional(),
});

export const updateComplaintSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be at most 200 characters')
    .optional(),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description must be at most 5000 characters')
    .optional(),
  category: z.enum(complaintCategories).optional(),
  subcategory: z.string().max(100).optional(),
  priority: z.enum(complaintPriorities).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  address: z.string().max(500).optional(),
});

export const assignComplaintSchema = z.object({
  officerId: z.string().uuid().optional(),
  workerId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});

export const resolveComplaintSchema = z.object({
  resolution: z
    .string()
    .min(10, 'Resolution must be at least 10 characters')
    .max(5000, 'Resolution must be at most 5000 characters'),
  resolutionEvidence: z.array(z.string().url()).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(complaintStatuses),
  notes: z.string().max(1000).optional(),
});

export const complaintFilterSchema = z.object({
  status: z.enum(complaintStatuses).optional(),
  priority: z.enum(complaintPriorities).optional(),
  category: z.enum(complaintCategories).optional(),
  departmentId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  circleId: z.string().uuid().optional(),
  wardId: z.string().uuid().optional(),
  assignedOfficerId: z.string().uuid().optional(),
  assignedWorkerId: z.string().uuid().optional(),
  slaBreached: z.boolean().optional(),
  search: z.string().max(200).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type UpdateComplaintInput = z.infer<typeof updateComplaintSchema>;
export type AssignComplaintInput = z.infer<typeof assignComplaintSchema>;
export type ResolveComplaintInput = z.infer<typeof resolveComplaintSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type ComplaintFilterInput = z.infer<typeof complaintFilterSchema>;
