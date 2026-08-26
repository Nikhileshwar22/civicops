// ============================================================
// Department Types
// ============================================================

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentRequest {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}
