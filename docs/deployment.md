# Deployment

## AWS ECS/Fargate Architecture

```
                    Route 53 (DNS)
                         │
                    Cloudflare (CDN/WAF)
                         │
                    ALB (Application Load Balancer)
                         │
            ┌────────────┼────────────┐
            │            │            │
     ECS Service    ECS Service   ECS Service
     (API)          (Worker)      (Web)
            │            │            │
            └────────────┼────────────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
           RDS        ElastiCache  Secrets
         (PostgreSQL)  (Redis)     Manager
```

## Container Images

| Service | Dockerfile | Port |
|---------|-----------|------|
| API | `./Dockerfile` | 4000 |
| Web | `./docker/Dockerfile.web` | 3000 |
| Worker | `./Dockerfile` (different CMD) | - |

## Environment Configuration

All secrets are managed via AWS Secrets Manager or Parameter Store:

- `DATABASE_URL` - RDS connection string
- `REDIS_HOST` - ElastiCache endpoint
- `JWT_ACCESS_SECRET` - Random 64-char string
- `JWT_REFRESH_SECRET` - Random 64-char string
- `R2_*` - Cloudflare R2 credentials
- `GEMINI_API_KEY` / `OPENAI_API_KEY` - AI provider keys

## CI/CD Pipeline (GitHub Actions)

```
git push → Install → Lint → Test → Build → Docker Build → ECR Push → ECS Deploy
```

Separate pipelines for:
- `main` branch → Production
- `develop` branch → Staging
- Pull requests → Tests only

## Health Checks

- API: `GET /api/v1/health`
- ALB health check interval: 30s
- Unhealthy threshold: 3 consecutive failures
