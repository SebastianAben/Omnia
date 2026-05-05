# Omnia

Omnia adalah Hybrid Omnichannel Smart POS untuk retail dan UMKM multi-cabang. MVP berfokus pada POS local-first, inventory, sync ke pusat, dashboard dasar, Shopee integration, dan AI insights sederhana.

## Sprint 0 Status

Repo ini sedang berada di Sprint 0: fondasi project, bukan fitur bisnis lengkap. Target Sprint 0 adalah membuat monorepo, desktop app shell, backend API skeleton, database foundation, auth skeleton, sync skeleton, seed data, dan deployment/env contract siap dikembangkan.

## Struktur Repo

```text
apps/
  desktop-app/   Next.js + Electron shell
  backend-api/   NestJS central API
  ai-worker/     Python AI/analytics worker
packages/
  ui/            shared UI primitives
  types/         shared TypeScript contracts
  config/        shared runtime config helpers
  shared-utils/  shared utilities
docs/            product, technical, design, deployment, and workflow docs
```

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker dan Docker Compose untuk PostgreSQL/Redis local

## Setup Local

Cara paling sederhana untuk menjalankan seluruh aplikasi lokal:

```bash
pnpm dev:full
```

Perintah ini akan install dependencies, membuat env lokal jika belum ada, menyalakan PostgreSQL/Redis via Docker Compose, menjalankan Prisma generate/migrate/seed, menyiapkan SQLite lokal desktop app, lalu menjalankan semua workspace dev process.

Setelah siap:

- Desktop renderer: `http://localhost:3000`
- Backend API docs: `http://localhost:4000/api/v1/docs`

### Manual

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment template:

```bash
cp .env.example .env.local
```

3. Start local infrastructure:

```bash
docker compose up -d postgres redis
```

4. Prepare central and local databases:

```bash
pnpm --filter @omnia/backend-api db:migrate:local
pnpm --filter @omnia/backend-api prisma:seed
pnpm --filter @omnia/desktop-app localdb:init
```

5. Run workspace apps:

```bash
pnpm dev
```

## Root Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm format`
- `pnpm format:check`

## Environment Strategy

Deployment values must come from environment variables. Do not hardcode production URLs or secrets in source code.

Key values:

- `NEXT_PUBLIC_API_BASE_URL` for frontend-to-backend API target
- `CORS_ORIGINS` for backend allowlist
- `DATABASE_URL` for PostgreSQL
- `REDIS_URL` for Redis/BullMQ
- `PUBLIC_API_URL` for backend public URL

See [Deployment Strategy](docs/Deployment-Strategy-Hybrid-Omnichannel-Smart-POS.md).

## Design Workflow

UI implementation should follow the selected Figma design and [DESIGN.md](docs/DESIGN.md). If the Figma source is not available to the developer/agent, implement only neutral placeholders and wait for exported screenshots/assets before doing visual polish.

## Multi-Agent Workflow

Sprint work follows [Multi-Agent Workflow](docs/Multi-Agent-Workflow-Hybrid-Omnichannel-Smart-POS.md). PM must provide a final report after implementation, including completed work, validation, blockers, manual user actions, and next steps.
