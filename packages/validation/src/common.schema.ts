import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const searchSchema = z.object({
  search: z.string().max(200).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type UuidParamInput = z.infer<typeof uuidParamSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
