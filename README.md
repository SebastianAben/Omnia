# Omnia

Omnia adalah Hybrid Smart POS untuk retail dan UMKM multi-cabang. MVP berfokus pada POS local-first, inventory, sync ke pusat, dashboard dasar, audit/monitoring, dan LLM-powered insights.

Dokumentasi utama tersedia di [docs/01-index.md](docs/01-index.md). Standar modularitas, clean code, dan performa ada di [docs/13-engineering-knowledge.md](docs/13-engineering-knowledge.md). Kesiapan Next.js untuk dibungkus sebagai desktop app dengan SQLite lokal dijelaskan di [docs/14-desktop-wrapper-readiness.md](docs/14-desktop-wrapper-readiness.md).

## Implementation Status

Sprint 0 foundation sudah selesai dan repo sudah masuk fitur MVP awal. Fondasi monorepo, desktop app shell, backend API, database, auth demo, sync foundation, seed data, CI/CD, deployment/env contract, dan dashboard dasar sudah tersedia.

Fitur yang sudah mulai berjalan meliputi POS checkout local-first ke SQLite, shift dasar, inventory adjustment MVP, receipt preview, sync status/replay transaksi, shift, dan stock movement, backend apply `transaction.bundle`, `shift.opened`/`shift.closed`, `stock_movement.created`, dashboard/reporting/audit, serta LLM Insights berbasis Gemini dengan structured output. Scope terbaru menghapus Shopee dari target aktif. Fitur yang masih belum final: UI Figma/pixel-perfect, auth production-grade, live provider validation, smoke runtime penuh, dan UAT.

## Struktur Repo

```text
apps/
  desktop-app/   Next.js + Electron shell
  backend-api/   NestJS central API
  ai-worker/     LLM/analytics worker skeleton
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
- `pnpm smoke:mvp`
- `pnpm format`
- `pnpm format:check`

## MVP Release Candidate Checks

Setelah setup lokal, migration, seed, dan backend berjalan, validasi smoke Sprint 7 dapat dijalankan dengan:

```bash
pnpm smoke:mvp
```

Smoke check ini memvalidasi health, login role utama, master data, sync bundle + idempotency, central dashboard, dan LLM insights sesuai scope terbaru. Detail release readiness dan backlog ekspansi ada di [Implementation Roadmap](docs/10-implementation-roadmap.md).

## CI/CD Home Server

Backend deployment memakai GitHub Actions dan self-hosted runner di home server.

- `dev` deploy ke `/home/froztbitez/web-server/omnia/dev` dengan host port `4101`
- `main` deploy ke `/home/froztbitez/web-server/omnia/main` dengan host port `4100`
- Compose project dipisah menjadi `omnia-dev` dan `omnia-main`
- Backend image dipublish ke GHCR sebagai `ghcr.io/sebastianaben/omnia-backend-api`
- Secret server disimpan di `.env.server` pada folder deployment, bukan di repo

Setup awal di home server:

```bash
mkdir -p /home/froztbitez/web-server/omnia/dev
mkdir -p /home/froztbitez/web-server/omnia/main
```

Copy `deploy/home-server/.env.server.example` menjadi `.env.server` di masing-masing folder deployment, lalu sesuaikan `COMPOSE_PROJECT_NAME`, `BACKEND_IMAGE`, `BACKEND_HOST_PORT`, `APP_ENV`, `PUBLIC_API_URL`, `CORS_ORIGINS`, dan secret. Gunakan `BACKEND_IMAGE=ghcr.io/sebastianaben/omnia-backend-api:dev` untuk dev dan `BACKEND_IMAGE=ghcr.io/sebastianaben/omnia-backend-api:main` untuk main.

Gunakan password PostgreSQL yang URL-friendly, misalnya:

```bash
openssl rand -hex 32
```

Nilai password di `POSTGRES_PASSWORD` harus sama dengan password di `DATABASE_URL`.

Jika deploy gagal dengan `Prisma P1000: Authentication failed`, cek volume
PostgreSQL yang sudah ada. Log `PostgreSQL Database directory appears to contain
a database; Skipping initialization` berarti `POSTGRES_PASSWORD` baru tidak akan
mengubah password user di database lama. Untuk mempertahankan data, kembalikan
`POSTGRES_PASSWORD` dan password di `DATABASE_URL` ke password lama. Untuk
database kosong, hentikan compose lalu hapus volume sesuai environment, misalnya
`docker volume rm omnia-dev_postgres_data`, kemudian deploy ulang.

Contoh nilai environment-specific:

```text
# /home/froztbitez/web-server/omnia/dev/.env.server
COMPOSE_PROJECT_NAME=omnia-dev
BACKEND_IMAGE=ghcr.io/sebastianaben/omnia-backend-api:dev
BACKEND_HOST_PORT=4101
APP_ENV=staging
PUBLIC_API_URL=https://api-dev-omnia.albern.space

# /home/froztbitez/web-server/omnia/main/.env.server
COMPOSE_PROJECT_NAME=omnia-main
BACKEND_IMAGE=ghcr.io/sebastianaben/omnia-backend-api:main
BACKEND_HOST_PORT=4100
APP_ENV=production
PUBLIC_API_URL=https://api-omnia.albern.space
```

`CORS_ORIGINS` berisi origin frontend yang mengakses backend, bukan domain backend. Untuk local development, `http://localhost:3000` tetap boleh dipakai; tambahkan domain frontend Vercel ketika sudah tersedia.

Reverse proxy/Nginx Proxy Manager:

```text
api-dev-omnia.albern.space -> http://127.0.0.1:4101
api-omnia.albern.space     -> http://127.0.0.1:4100
```

Jika package GHCR dibuat private, login Docker satu kali di home server sebelum deploy:

```bash
docker login ghcr.io
```

Runner GitHub untuk repo `SebastianAben/Omnia` perlu dibuat satu kali dari GitHub repository settings dengan label:

```text
self-hosted, linux, x64, omnia-home
```

Folder runner yang direkomendasikan:

```text
/home/froztbitez/actions-runner-omnia
```

Setelah membuat token runner di GitHub, jalankan di home server:

```bash
cd /path/to/Omnia
RUNNER_TOKEN=replace-with-github-runner-token scripts/setup-home-runner.sh
```

## Environment Strategy

Deployment values must come from environment variables. Do not hardcode production URLs or secrets in source code.

Key values:

- `NEXT_PUBLIC_API_BASE_URL` for frontend-to-backend API target
- `CORS_ORIGINS` for backend allowlist
- `DATABASE_URL` for PostgreSQL
- `REDIS_URL` for Redis/BullMQ
- `PUBLIC_API_URL` for backend public URL
- `LLM_PROVIDER` for LLM provider selection
- `LLM_API_KEY` for server-side LLM provider access
- `LLM_MODEL` for the insight generation model
- `LLM_TIMEOUT_MS` for provider timeout
- `LLM_INSIGHT_TTL_MINUTES` for insight cache/staleness behavior
- `LLM_MAX_INSIGHTS` for maximum generated insight count per provider call
- `LLM_MAX_CONTEXT_ROWS` for bounded central-data context size
- `LLM_GENERATION_COOLDOWN_MINUTES` for reusing fresh persisted insights

Shopee/mock marketplace integration is no longer active MVP scope. Active Shopee backend endpoints, frontend routes, env values, and smoke checks have been removed from the MVP runtime surface; legacy marketplace schema remains inert until a separate data-retention cleanup is approved.

See [Technical Stack](docs/08-technical-stack.md) and [System Architecture](docs/04-system-architecture.md).

## Design Workflow

UI implementation should follow the selected Figma design and [UI Design Guide](docs/09-ui-design-guide.md). If the Figma source is not available to the developer/agent, implement only neutral placeholders and wait for exported screenshots/assets before doing visual polish.

## Multi-Agent Workflow

Sprint work follows [Delivery Workflow](docs/11-delivery-workflow.md). PM must provide a final report after implementation, including completed work, validation, blockers, manual user actions, and next steps.
