# ============================================================
# CivicOps Backend - Production Dockerfile
# Multi-stage build for minimal production image
# ============================================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@8.15.4 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/
COPY packages/config/package.json ./packages/config/

RUN pnpm install --frozen-lockfile --prod=false

# Stage 2: Build
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@8.15.4 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY . .

RUN cd apps/backend && npx prisma generate --schema=../../prisma/schema.prisma
RUN pnpm --filter @civicops/backend build

# Stage 3: Production
FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init

WORKDIR /app

ENV NODE_ENV=production

# Compiled app
COPY --from=builder /app/apps/backend/dist ./dist
# Full dependency tree (includes Prisma CLI + ts-node for migrations/seed)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
# Prisma schema, migrations and seed
COPY --from=builder /app/prisma ./prisma
# tsconfig for ts-node seed execution
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 4000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
