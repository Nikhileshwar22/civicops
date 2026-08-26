# CivicOps

**Multi-Tenant Civic Operations & Complaint Management Platform**

A production-grade, enterprise-level platform for municipal administrations to manage citizen complaints, field operations, and civic services. Inspired by GHMC-style municipal systems.

---

## Architecture Overview

```
                     INTERNET
                         │
                         ▼
                    CLOUDFLARE
                 ┌───────┴────────┐
                 │                │
                CDN              WAF
                 │
                 ▼
             Cloudflare R2

                     API
                      │
                      ▼
                Load Balancer
                      │
                      ▼
                 AWS ECS/Fargate
                      │
      ┌───────────────┼─────────────────┐
      │               │                 │
      ▼               ▼                 ▼
   API Service   WebSocket Service   Workers
      │               │                 │
      │               │          ┌──────┼────────┐
      │               │          │      │        │
      │               │          ▼      ▼        ▼
      │               │         AI   Webhook   Email
      │               │       Worker  Worker   Worker
      │               │
      └───────┬───────┘
              │
    ┌─────────┼──────────┐
    │         │          │
    ▼         ▼          ▼
PostgreSQL   Redis     BullMQ
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query |
| Backend | NestJS, TypeScript, REST API, Socket.IO |
| Database | PostgreSQL + pgvector |
| ORM | Prisma |
| Cache/Queue | Redis, BullMQ |
| Auth | JWT + Refresh Tokens + Passport.js |
| Storage | Cloudflare R2 |
| CDN | Cloudflare CDN |
| AI | Gemini/OpenAI (provider abstraction) |
| Infrastructure | Docker, AWS ECS/Fargate, GitHub Actions |
| Monitoring | Sentry, CloudWatch |

## Project Structure

```
civicops/
├── apps/
│   ├── frontend/                # Next.js frontend (App Router)
│   │   ├── src/
│   │   │   ├── app/           # App Router pages & layouts
│   │   │   ├── components/    # React components
│   │   │   ├── lib/           # Utilities & API client
│   │   │   └── hooks/         # Custom React hooks
│   │   └── package.json
│   │
│   └── backend/                 # NestJS backend
│       ├── src/
│       │   ├── config/        # Configuration modules
│       │   ├── common/        # Guards, decorators, filters, interceptors
│       │   ├── database/      # Prisma service
│       │   ├── modules/       # Feature modules
│       │   │   ├── auth/      # Authentication & JWT
│       │   │   ├── users/     # User management
│       │   │   ├── tenants/   # Multi-tenancy
│       │   │   ├── rbac/      # Role-based access control
│       │   │   ├── geography/ # Zones, Circles, Wards
│       │   │   ├── departments/
│       │   │   ├── complaints/ # Core complaint management
│       │   │   ├── assignments/
│       │   │   ├── attachments/
│       │   │   ├── notifications/
│       │   │   ├── ai/        # AI gateway & services
│       │   │   ├── webhooks/  # Webhook management
│       │   │   ├── reports/   # Analytics & reporting
│       │   │   └── audit/     # Audit logging
│       │   ├── infrastructure/
│       │   │   ├── redis/     # Redis caching service
│       │   │   ├── queue/     # BullMQ queue service
│       │   │   ├── storage/   # R2 storage service
│       │   │   └── websocket/ # Socket.IO gateway
│       │   └── workers/       # Background job processors
│       └── package.json
│
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── validation/             # Shared Zod schemas
│   └── config/                 # Shared constants & config
│
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data
│
├── docker/
│   ├── Dockerfile.web         # Frontend production image
│   └── init-db.sql            # DB initialization
│
├── docs/                       # Architecture documentation
├── docker-compose.yml          # Local development infra
├── Dockerfile                  # API production image
└── .env.example               # Environment template
```

## Quick Start

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd civicops

# 2. Install dependencies
pnpm install

# 3. Start infrastructure (PostgreSQL + Redis)
docker compose up -d

# 4. Copy environment variables
cp .env.example .env

# 5. Generate Prisma client
pnpm db:generate

# 6. Run database migrations
pnpm db:migrate

# 7. Seed the database
pnpm db:seed

# 8. Start development servers
pnpm dev
```

The API will be available at `http://localhost:4000` and the frontend at `http://localhost:3000`.

### Swagger API Documentation

Available at `http://localhost:4000/api/docs` in development mode.

## Key Features

### Multi-Tenancy
- Complete tenant isolation at data level
- Every resource scoped to `tenantId`
- Cross-tenant access prevention (IDOR protection)

### Hierarchical RBAC
- 8 configurable roles from Super Admin to Citizen
- 30+ granular permissions
- Role-permission mapping
- Geographic scope (Zone/Circle/Ward)
- Department scope

### Complaint Management
- Full lifecycle: Received → Under Review → Assigned → In Progress → Resolved → Closed
- Priority-based SLA tracking
- AI-powered classification
- Location-based assignment
- Assignment history & status tracking

### Real-Time Updates
- Socket.IO for live notifications
- Authorized rooms (tenant/zone/ward/user scoped)
- Complaint status push updates

### AI Integration
- Provider abstraction (Gemini/OpenAI)
- Complaint classification
- Image analysis (vision)
- Citizen AI assistant
- RAG with pgvector

### Background Processing
- BullMQ for async job processing
- Dedicated workers: AI, Email, Webhooks, Reports, Image Processing
- Retry with exponential backoff

### Webhooks
- HMAC-signed deliveries
- Configurable event subscriptions
- Retry with exponential backoff
- Delivery history tracking

## Seed Data Credentials

All seeded users have the password: `Password123`

| Role | Email |
|------|-------|
| Super Admin | admin@ghmc.gov.in |
| Commissioner | commissioner@ghmc.gov.in |
| Zonal Commissioner | zonal.z01@ghmc.gov.in |
| Ward Officer | ward57.officer@ghmc.gov.in |
| Field Supervisor | supervisor1@ghmc.gov.in |
| Field Worker | worker1@ghmc.gov.in |
| Citizen | citizen1@example.com |

## API Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /api/v1/complaints
POST   /api/v1/complaints
GET    /api/v1/complaints/:id
PATCH  /api/v1/complaints/:id
PATCH  /api/v1/complaints/:id/status
POST   /api/v1/complaints/:id/assign
POST   /api/v1/complaints/:id/resolve
POST   /api/v1/complaints/:id/reopen

GET    /api/v1/audit
GET    /api/v1/health
```

## Development

```bash
# Run only the backend
pnpm dev:backend

# Run only the frontend
pnpm dev:frontend

# Run tests
pnpm test

# Lint
pnpm lint

# Prisma Studio (DB GUI)
pnpm db:studio
```

## Docker

```bash
# Start infrastructure only
docker compose up -d

# Start with Redis Commander (dev tool)
docker compose --profile tools up -d

# Stop everything
docker compose down
```

## Deployment

The application is prepared for AWS ECS/Fargate deployment:

1. Build Docker images
2. Push to Amazon ECR
3. Deploy to ECS with Fargate
4. Configure environment variables via AWS Secrets Manager/Parameter Store

See `docs/deployment.md` for detailed instructions.

## License

MIT
