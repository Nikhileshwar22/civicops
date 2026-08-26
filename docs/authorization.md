# Authorization

## Overview

CivicOps implements hierarchical RBAC with geographic and department scoping.

## Role Hierarchy

```
SUPER_ADMIN (level 100)
  └── COMMISSIONER (level 90)
       └── ZONAL_COMMISSIONER (level 70)
            └── DEPUTY_COMMISSIONER (level 60)
                 └── WARD_OFFICER (level 50)
                      └── FIELD_SUPERVISOR (level 30)
                           └── FIELD_WORKER (level 20)
                                └── CITIZEN (level 10)
```

## Permission Model

Permissions follow `resource:action` naming:

- `complaint:create`, `complaint:view`, `complaint:view_all`, `complaint:assign`
- `user:create`, `user:view`, `user:update`, `user:deactivate`
- `department:manage`, `zone:manage`, `report:generate`
- `webhook:create`, `ai:use`, `audit:view`

## Scope Types

| Scope | Access Level |
|-------|-------------|
| GLOBAL | All data across the platform (Super Admin only) |
| TENANT | All data within the tenant |
| ZONE | Complaints/users within assigned zone(s) |
| CIRCLE | Complaints/users within assigned circle(s) |
| WARD | Complaints/users within assigned ward(s) |
| ASSIGNED_ONLY | Only personally created or assigned items |

## Authorization Check

Every protected endpoint performs:

1. JWT validation (Authentication Guard)
2. Permission check (Permissions Guard) - Does the user have the required permission?
3. Tenant check (Tenant Guard) - Is the resource in the user's tenant?
4. Scope check (Service layer) - Is the resource within the user's geographic/department scope?

## Implementation

```typescript
@RequirePermissions('complaint:assign')
@UseGuards(TenantGuard, PermissionsGuard)
async assign(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
  // Service layer verifies scope access
  return this.complaintService.assign(id, dto, user);
}
```
