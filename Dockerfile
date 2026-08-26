# ============================================================
# CivicOps Backend - Production Dockerfile
# Debian slim base (reliable Prisma + OpenSSL support)
# ============================================================

# Stage 1: Dependencies
FROM node:20-slim AS deps
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@8.15.4 --activate

WORKDIR /app

# .npmrc carries `shamefully-hoist=true`, which hoists @prisma/client into the
# root node_modules so `prisma generate` (schema lives at repo root) can resolve it.
# Without this file present at install time, Prisma fails with "Could not resolve @prisma/client".
COPY .npmrc ./
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/types/package.json ./packages/types/
COPY packages/validation/package.json ./packages/validation/
COPY packages/config/package.json ./packages/config/

RUN pnpm install --frozen-lockfile --prod=false

# Stage 2: Build
FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@8.15.4 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY . .

# Stop Prisma from trying to auto-install its CLI mid-build (deps are already installed
# via pnpm install above). Without this, `prisma generate` runs `pnpm add prisma -D`
# which fails inside the Docker build in a pnpm workspace.
ENV PRISMA_GENERATE_SKIP_AUTOINSTALL=true

# Generate Prisma client (use pnpm exec so it resolves the workspace binary)
RUN pnpm --filter @civicops/backend exec prisma generate --schema=../../prisma/schema.prisma
# Build the NestJS app
RUN pnpm --filter @civicops/backend build

# Stage 3: Production
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y openssl ca-certificates dumb-init && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

# Compiled app
COPY --from=builder /app/apps/backend/dist ./dist
# Full dependency tree (includes Prisma CLI + ts-node for migrations/seed)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
# Prisma schema, migrations, seed and tsconfig (for ts-node seed)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 4000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
