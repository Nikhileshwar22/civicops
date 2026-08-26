# CivicOps Architecture

## Overview

CivicOps is built as a **modular monolith** using NestJS. The backend is a single well-structured application with clearly separated modules, while background workers and infrastructure components are independently deployable when required.

## Request Flow

```
Client
  → Cloudflare (CDN/WAF)
    → Load Balancer
      → Router
        → RequestID Middleware
          → Authentication Guard (JWT validation)
            → Authorization Guard (Permissions + Scope)
              → Validation Pipe (DTO validation)
                → Controller (thin, route handling)
                  → Service (business logic)
                    → Repository (data access)
                      → Prisma Client
                        → PostgreSQL
```

## Event Flow

```
Service (business logic completes)
  → Domain Event emitted
    ├── Audit Listener → AuditLog
    ├── Notification Listener → Queue → Email/WebSocket/InApp
    ├── Webhook Listener → Queue → HTTP delivery with retry
    ├── AI Listener → Queue → Classification/Summary
    └── WebSocket Gateway → Real-time push to rooms
```

## Module Architecture

Each domain module follows this layered structure:

```
module/
├── module.module.ts          # NestJS module definition
├── module.controller.ts      # HTTP route handlers (thin)
├── module.service.ts         # Business logic
├── module.repository.ts      # Data access via Prisma
├── dto/                      # Request/Response DTOs
│   ├── create-*.dto.ts
│   ├── update-*.dto.ts
│   └── filter-*.dto.ts
├── events/                   # Domain events
│   └── *.events.ts
└── policies/                 # Authorization policies (future)
    └── *.policy.ts
```

## Multi-Tenancy

- **Strategy**: Shared database with tenant ID column
- **Enforcement**: Every tenant-scoped query includes `tenantId` from the authenticated user
- **Trust model**: `tenantId` is NEVER accepted from the frontend; always derived from the JWT token
- **Isolation**: Cross-tenant access is prevented at the service/repository layer

## Authorization Model

Authorization is a combination of:

1. **Role** - What organizational level (Commissioner, Ward Officer, etc.)
2. **Permissions** - What actions (complaint:assign, report:generate, etc.)
3. **Geographic Scope** - Which area (Zone, Circle, Ward)
4. **Department Scope** - Which department
5. **Tenant** - Which organization

## Caching Strategy

- **Redis** for session state, rate limiting, and frequently accessed data
- Cache invalidation on write operations
- TTL-based expiry for configuration data (geography, departments)
- Short-lived cache for dashboard statistics

## Queue Architecture

- **BullMQ** backed by Redis
- Separate queues for different job types (AI, email, webhooks, reports)
- Configurable retry with exponential backoff
- Dead letter queue for failed deliveries
- Job progress tracking for long-running operations
