// ============================================================
// User Types
// ============================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithRoles extends User {
  roles: Role[];
  permissions: string[];
  scope: import('./auth').UserScope;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  level: number;
  tenantId: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  resource: string;
  action: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  roleIds: string[];
  departmentIds?: string[];
  zoneIds?: string[];
  circleIds?: string[];
  wardIds?: string[];
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive?: boolean;
  roleIds?: string[];
  departmentIds?: string[];
  zoneIds?: string[];
  circleIds?: string[];
  wardIds?: string[];
}

export enum SystemRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMMISSIONER = 'COMMISSIONER',
  ADDITIONAL_COMMISSIONER = 'ADDITIONAL_COMMISSIONER',
  ZONAL_COMMISSIONER = 'ZONAL_COMMISSIONER',
  DEPUTY_COMMISSIONER = 'DEPUTY_COMMISSIONER',
  ASSISTANT_MUNICIPAL_COMMISSIONER = 'ASSISTANT_MUNICIPAL_COMMISSIONER',
  WARD_OFFICER = 'WARD_OFFICER',
  FIELD_SUPERVISOR = 'FIELD_SUPERVISOR',
  FIELD_WORKER = 'FIELD_WORKER',
  CITIZEN = 'CITIZEN',
}
