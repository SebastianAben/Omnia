# LLM Memory

## 1. Tujuan File

File ini menyimpan memori kerja untuk LLM/agent berikutnya agar tidak perlu scan seluruh project dari awal.

Update file ini setiap selesai pekerjaan besar, terutama jika ada perubahan:

- arsitektur
- dependency
- command setup
- env variable
- endpoint
- database schema
- status sprint
- blocker/manual action

## 2. Ringkasan Produk

Omnia adalah Hybrid Omnichannel Smart POS untuk retail dan UMKM multi-cabang.

Prinsip utama MVP:

- satu aplikasi utama berbasis role
- POS cabang local-first
- backend pusat untuk auth, sync, dashboard, Shopee, dan AI
- SQLite lokal untuk transaksi cabang/offline
- PostgreSQL pusat untuk konsolidasi
- Redis/BullMQ untuk background jobs dan sync queue
- AI hanya sebagai advisor, bukan auto-action

Role MVP:

- Cashier
- Store Supervisor
- HQ Admin
- Executive / Analyst

## 3. Dokumen Penting

Baca file ini dulu, lalu buka dokumen lain hanya jika perlu detail:

- `docs/README.md`
- `docs/Sprint-Roadmap-Implementation-Hybrid-Omnichannel-Smart-POS.md`
- `docs/Multi-Agent-Workflow-Hybrid-Omnichannel-Smart-POS.md`
- `docs/Deployment-Strategy-Hybrid-Omnichannel-Smart-POS.md`
- `docs/DESIGN.md`
- `docs/API-Contract-Hybrid-Omnichannel-Smart-POS.md`
- `docs/ERD-Awal-Hybrid-Omnichannel-Smart-POS.md`
- `docs/Sync-Specification-Detail-Hybrid-Omnichannel-Smart-POS.md`

## 4. Status Sprint 0 Terakhir

Sprint 0 sudah dikerjakan sampai fondasi runnable.

Selesai:

- monorepo pnpm workspace
- backend NestJS skeleton
- backend master data API awal untuk users, roles, branches, registers, categories, products, dan branch prices
- desktop app Next.js + Electron skeleton
- Tailwind CSS frontend setup
- Zustand dan TanStack Query setup
- shared UI primitives
- shared types/config/utils
- PostgreSQL local via Docker Compose
- Redis local via Docker Compose
- BullMQ sync queue skeleton
- Prisma schema awal
- migration SQL awal
- seed data awal dengan role MVP, demo users, branches, registers, product/category, branch price, inventory, stock movement, sales channel, dan shift
- SQLite local schema
- AI worker skeleton
- deployment strategy document
- design guide document
- multi-agent workflow document
- README setup local

Belum selesai / masih skeleton:

- UI belum pixel-perfect dari Figma
- CI/GitHub Actions belum dibuat
- auth belum production-grade
- JWT masih implementasi HMAC internal sederhana, belum memakai library JWT production-grade
- password hashing awal memakai scrypt untuk demo seed dan login
- sync baru receive + enqueue, belum apply event ke central DB
- POS belum transaksi nyata
- dashboard, Shopee, AI insight belum masuk implementasi fitur

## 5. Struktur Repo

```text
apps/
  backend-api/
  desktop-app/
  ai-worker/
packages/
  config/
  shared-utils/
  types/
  ui/
docs/
docker-compose.yml
```

## 6. App dan Package

### Backend

Path:

- `apps/backend-api`

Stack:

- NestJS
- Prisma
- PostgreSQL
- Redis/BullMQ
- Swagger

Endpoint saat ini:

- `GET /api/v1/health`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/users`
- `GET /api/v1/roles`
- `GET /api/v1/products`
- `GET /api/v1/categories`
- `GET /api/v1/branches`
- `GET /api/v1/branches/:branchId/product-prices`
- `GET /api/v1/registers`
- `POST /api/v1/sync/events`
- Swagger: `/api/v1/docs`

Catatan:

- `POST /api/v1/sync/events` sudah enqueue ke Redis/BullMQ queue `omnia.sync`.
- Auth guard sudah memverifikasi Bearer token HMAC dari `AuthService`, tetapi belum memakai library JWT production-grade.
- Product, category, branch, register, user, role, dan branch price endpoint sudah membaca data dari Prisma.

### Desktop App

Path:

- `apps/desktop-app`

Stack:

- Next.js
- Electron
- Tailwind CSS
- Zustand
- TanStack Query
- lucide-react
- shared package `@omnia/ui`

Routes saat ini:

- `/login`
- `/`
- `/pos`
- `/sync-status`

Catatan:

- UI masih placeholder netral, siap diganti berdasarkan export/screenshot Figma.
- Figma MCP/tool tidak tersedia saat Sprint 0 dikerjakan, jadi desain dari link Figma belum dibaca langsung.

### AI Worker

Path:

- `apps/ai-worker`

Status:

- Python skeleton tersedia.
- Belum ada analytics logic.

### Shared Packages

- `@omnia/types`: role, sync event, API response, user/context types
- `@omnia/config`: runtime config helper
- `@omnia/shared-utils`: response helpers dan utility kecil
- `@omnia/ui`: `Button`, `Badge`, `cn`

## 7. Local Development Commands

Install dependency:

```bash
pnpm install
```

Start local infra:

```bash
docker compose up -d postgres redis
```

Generate Prisma client:

```bash
pnpm --filter @omnia/backend-api prisma:generate
```

Apply local migration SQL:

```bash
pnpm --filter @omnia/backend-api db:migrate:local
```

Seed central DB:

```bash
pnpm --filter @omnia/backend-api prisma:seed
```

Initialize local SQLite DB:

```bash
pnpm --filter @omnia/desktop-app localdb:init
```

Run backend:

```bash
APP_ENV=local \
PORT=4000 \
PUBLIC_API_URL=http://localhost:4000 \
CORS_ORIGINS=http://localhost:3000,http://localhost:3001 \
DATABASE_URL=postgresql://omnia:omnia@localhost:55433/omnia \
REDIS_URL=redis://localhost:6379 \
JWT_SECRET=replace-with-local-development-secret \
JWT_EXPIRES_IN=15m \
LOG_LEVEL=info \
pnpm --filter @omnia/backend-api dev
```

Run frontend:

```bash
NEXT_PUBLIC_APP_ENV=local \
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1 \
NEXT_PUBLIC_SYNC_STATUS_POLL_INTERVAL_MS=15000 \
pnpm --filter @omnia/desktop-app dev
```

Run Electron:

```bash
pnpm --filter @omnia/desktop-app dev:desktop
```

Validation:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

## 8. Ports

- Frontend Next.js: `http://localhost:3000`
- Backend API: `http://localhost:4000/api/v1`
- Swagger: `http://localhost:4000/api/v1/docs`
- Redis: `localhost:6379`
- PostgreSQL Docker host port: `localhost:55433`

Important:

- Host machine already had PostgreSQL on port `5432`, so Docker Postgres for Omnia uses host port `55433`.

## 9. Database Notes

PostgreSQL:

- Docker service name: `postgres`
- Container name: `omnia-postgres`
- User: `omnia`
- Password: `omnia`
- DB: `omnia`
- Host URL: `postgresql://omnia:omnia@localhost:55433/omnia`
- In-container URL: `postgresql://omnia:omnia@postgres:5432/omnia`

Redis:

- Docker service name: `redis`
- Container name: `omnia-redis`
- URL: `redis://localhost:6379`

Prisma:

- Schema: `apps/backend-api/prisma/schema.prisma`
- Seed: `apps/backend-api/prisma/seed.ts`
- Migration SQL: `apps/backend-api/prisma/migrations/20260505023000_init/migration.sql`

Known issue:

- `prisma migrate dev` failed on this machine with `Schema engine error: undefined`.
- Workaround implemented: `pnpm --filter @omnia/backend-api db:migrate:local`, which applies the migration SQL via `psql`.

SQLite:

- Schema: `apps/desktop-app/local-store/schema.sql`
- Local generated DB path: `apps/desktop-app/.omnia/omnia-local.db`
- `.omnia/` is gitignored.

## 10. Smoke Tests

Health:

```bash
curl -s http://localhost:4000/api/v1/health
```

Expected:

```json
{
  "success": true,
  "data": { "status": "ok", "service": "backend-api", "version": "0.1.0" }
}
```

Auth login:

```bash
curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"demo.cashier","password":"password","device_id":"register-01"}'
```

Sync event:

```bash
curl -s -X POST http://localhost:4000/api/v1/sync/events \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer sprint0-token' \
  -d '{"event_id":"evt_demo_003","event_type":"transaction.created","event_version":"1","branch_id":"br_demo","source_system":"branch_app","source_mode":"online","entity_type":"sales_transaction","entity_id":"txn_demo_003","occurred_at":"2026-05-05T02:00:00.000Z","payload":{"total":128000}}'
```

Check Redis queue length:

```bash
docker exec omnia-redis redis-cli LLEN bull:omnia.sync:wait
```

## 11. Figma / Design Status

User provided Figma link:

```text
https://www.figma.com/design/buwkbTfcP9YOXvivexNuGd/Manprod?node-id=0-1&t=euXRamKKerHn3Msp-1
```

Status:

- Figma MCP/tool was not available during Sprint 0 implementation.
- Current UI is placeholder only.
- Next UI work should use exported screenshots/assets or a working Figma tool connection.

## 12. Multi-Agent Rule

Project uses PM-led multi-agent workflow.

Every implementation should end with Final PM Report containing:

- Summary
- Completed Work
- Detailed Work
- Files / Modules Changed
- Validation Result
- Not Completed
- Manual Action Required From User
- Risks / Notes
- Next Step Recommendation

Reference:

- `docs/Multi-Agent-Workflow-Hybrid-Omnichannel-Smart-POS.md`

## 13. Next Recommended Work

Recommended immediate next steps:

1. Add CI/GitHub Actions for `pnpm install`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`.
2. Resolve Figma access/export and implement UI shell from design.
3. Continue Sprint 1 hardening:
   - replace internal HMAC token helper with a production JWT library/config
   - add explicit permission checks and branch scope guards per endpoint
   - add create/update flows where needed for master data
   - wire frontend/local cache to users, roles, branches, registers, products, categories, and branch prices
4. Replace placeholder POS with real local transaction flow after Sprint 1 data/auth foundations are stable.

## 14. Manual User Actions Pending

User should provide one of:

- Figma export/screenshots/assets, or
- a working Figma MCP/tool access path, or
- selected screenshots from the Figma file for each screen.

For future deployment:

- provide backend home server domain
- configure DNS and HTTPS reverse proxy
- provide production secrets
- provide Shopee credentials when Sprint 6 starts
