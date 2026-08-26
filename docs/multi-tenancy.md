# Multi-Tenancy

## Overview

CivicOps supports multiple municipal organizations on a single deployment. Each tenant operates in complete isolation.

## Strategy

**Shared Database, Shared Schema** with tenant ID discrimination.

Every tenant-owned table includes a `tenantId` column, and all queries are scoped to the authenticated user's tenant.

## Tenant-Scoped Resources

- Users, Roles, Permissions
- Departments
- Zones, Circles, Wards
- Complaints and all related records
- Webhooks
- Notifications
- Audit Logs
- AI/RAG Documents
- Configuration

## Isolation Enforcement

### Rule 1: Never trust frontend tenantId
The `tenantId` is always derived from the authenticated user's JWT token, never from request parameters.

### Rule 2: Every query includes tenant filter
```typescript
// Repository layer
async findAll(filter: any, tenantId: string) {
  return this.prisma.complaint.findMany({
    where: { tenantId, ...filter },
  });
}
```

### Rule 3: Verify resource ownership before access
```typescript
if (complaint.tenantId !== user.tenantId) {
  throw new NotFoundException('Complaint not found');
}
```

## Tenant Provisioning

1. Create Tenant record
2. Seed default roles and permissions
3. Create admin user
4. Configure departments and geography
5. Set tenant-specific settings (SLA defaults, enabled features)
