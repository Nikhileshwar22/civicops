// ============================================================
// Permission definitions
// ============================================================

export const PERMISSIONS = {
  // Complaint permissions
  COMPLAINT_CREATE: 'complaint:create',
  COMPLAINT_VIEW: 'complaint:view',
  COMPLAINT_VIEW_ALL: 'complaint:view_all',
  COMPLAINT_UPDATE: 'complaint:update',
  COMPLAINT_ASSIGN: 'complaint:assign',
  COMPLAINT_RESOLVE: 'complaint:resolve',
  COMPLAINT_REOPEN: 'complaint:reopen',
  COMPLAINT_REJECT: 'complaint:reject',
  COMPLAINT_DELETE: 'complaint:delete',

  // User permissions
  USER_CREATE: 'user:create',
  USER_VIEW: 'user:view',
  USER_VIEW_ALL: 'user:view_all',
  USER_UPDATE: 'user:update',
  USER_DEACTIVATE: 'user:deactivate',

  // Role/Permission management
  ROLE_MANAGE: 'role:manage',
  PERMISSION_MANAGE: 'permission:manage',

  // Department permissions
  DEPARTMENT_MANAGE: 'department:manage',
  DEPARTMENT_VIEW: 'department:view',

  // Geographic permissions
  ZONE_MANAGE: 'zone:manage',
  CIRCLE_MANAGE: 'circle:manage',
  WARD_MANAGE: 'ward:manage',
  GEOGRAPHY_VIEW: 'geography:view',

  // Tenant permissions
  TENANT_CREATE: 'tenant:create',
  TENANT_UPDATE: 'tenant:update',
  TENANT_VIEW: 'tenant:view',
  TENANT_VIEW_ALL: 'tenant:view_all',

  // Report permissions
  REPORT_VIEW: 'report:view',
  REPORT_GENERATE: 'report:generate',
  REPORT_EXPORT: 'report:export',

  // Webhook permissions
  WEBHOOK_CREATE: 'webhook:create',
  WEBHOOK_UPDATE: 'webhook:update',
  WEBHOOK_DELETE: 'webhook:delete',
  WEBHOOK_VIEW: 'webhook:view',

  // AI permissions
  AI_USE: 'ai:use',
  AI_ANALYTICS: 'ai:analytics',
  AI_MANAGE: 'ai:manage',

  // Audit permissions
  AUDIT_VIEW: 'audit:view',

  // Notification permissions
  NOTIFICATION_MANAGE: 'notification:manage',

  // System permissions
  SYSTEM_ADMIN: 'system:admin',
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Default role-permission mapping
 * This defines which permissions each role gets by default.
 * Custom per-tenant role configurations can override these.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),

  COMMISSIONER: [
    PERMISSIONS.COMPLAINT_VIEW_ALL,
    PERMISSIONS.COMPLAINT_ASSIGN,
    PERMISSIONS.COMPLAINT_UPDATE,
    PERMISSIONS.COMPLAINT_RESOLVE,
    PERMISSIONS.COMPLAINT_REOPEN,
    PERMISSIONS.COMPLAINT_REJECT,
    PERMISSIONS.USER_VIEW_ALL,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DEACTIVATE,
    PERMISSIONS.ROLE_MANAGE,
    PERMISSIONS.DEPARTMENT_MANAGE,
    PERMISSIONS.DEPARTMENT_VIEW,
    PERMISSIONS.ZONE_MANAGE,
    PERMISSIONS.CIRCLE_MANAGE,
    PERMISSIONS.WARD_MANAGE,
    PERMISSIONS.GEOGRAPHY_VIEW,
    PERMISSIONS.TENANT_UPDATE,
    PERMISSIONS.TENANT_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_GENERATE,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.WEBHOOK_CREATE,
    PERMISSIONS.WEBHOOK_UPDATE,
    PERMISSIONS.WEBHOOK_DELETE,
    PERMISSIONS.WEBHOOK_VIEW,
    PERMISSIONS.AI_USE,
    PERMISSIONS.AI_ANALYTICS,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.NOTIFICATION_MANAGE,
  ],

  ZONAL_COMMISSIONER: [
    PERMISSIONS.COMPLAINT_VIEW_ALL,
    PERMISSIONS.COMPLAINT_ASSIGN,
    PERMISSIONS.COMPLAINT_UPDATE,
    PERMISSIONS.COMPLAINT_RESOLVE,
    PERMISSIONS.COMPLAINT_REOPEN,
    PERMISSIONS.USER_VIEW_ALL,
    PERMISSIONS.DEPARTMENT_VIEW,
    PERMISSIONS.GEOGRAPHY_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_GENERATE,
    PERMISSIONS.AI_USE,
    PERMISSIONS.AI_ANALYTICS,
    PERMISSIONS.AUDIT_VIEW,
  ],

  WARD_OFFICER: [
    PERMISSIONS.COMPLAINT_VIEW_ALL,
    PERMISSIONS.COMPLAINT_ASSIGN,
    PERMISSIONS.COMPLAINT_UPDATE,
    PERMISSIONS.COMPLAINT_RESOLVE,
    PERMISSIONS.COMPLAINT_REOPEN,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.DEPARTMENT_VIEW,
    PERMISSIONS.GEOGRAPHY_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.AI_USE,
  ],

  FIELD_SUPERVISOR: [
    PERMISSIONS.COMPLAINT_VIEW,
    PERMISSIONS.COMPLAINT_UPDATE,
    PERMISSIONS.COMPLAINT_RESOLVE,
    PERMISSIONS.DEPARTMENT_VIEW,
    PERMISSIONS.GEOGRAPHY_VIEW,
    PERMISSIONS.AI_USE,
  ],

  FIELD_WORKER: [
    PERMISSIONS.COMPLAINT_VIEW,
    PERMISSIONS.COMPLAINT_UPDATE,
    PERMISSIONS.COMPLAINT_RESOLVE,
    PERMISSIONS.GEOGRAPHY_VIEW,
  ],

  CITIZEN: [
    PERMISSIONS.COMPLAINT_CREATE,
    PERMISSIONS.COMPLAINT_VIEW,
    PERMISSIONS.COMPLAINT_REOPEN,
    PERMISSIONS.AI_USE,
  ],
};
