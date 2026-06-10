# Technical Stack

## Stack Final

| Layer      | Stack                                               |
| ---------- | --------------------------------------------------- |
| Monorepo   | pnpm workspace                                      |
| Frontend   | Next.js, React, TypeScript                          |
| Desktop    | Electron                                            |
| Styling/UI | Tailwind CSS, internal UI package, lucide-react     |
| State      | Zustand, TanStack Query                             |
| Local DB   | SQLite                                              |
| Backend    | NestJS, TypeScript                                  |
| Central DB | PostgreSQL                                          |
| ORM        | Prisma                                              |
| Queue      | Redis, BullMQ                                       |
| Validation | Zod, class-validator/class-transformer              |
| API Docs   | Swagger/OpenAPI                                     |
| LLM Worker | Backend/worker orchestration for LLM provider calls |
| CI/CD      | GitHub Actions, Docker                              |

## Alasan Pemilihan

- TypeScript end-to-end mempercepat sharing types dan contract.
- Electron memberi akses desktop/local yang lebih cocok untuk POS cabang.
- SQLite kuat untuk local-first transaction store.
- NestJS modular cocok untuk domain besar seperti POS, inventory, sync, dashboard, audit, dan LLM insight.
- PostgreSQL matang untuk relasi, audit, dan reporting.
- Prisma mempercepat schema dan query typed.
- Redis/BullMQ cukup sederhana untuk retry, sync, LLM generation, dan job async.

## Struktur Repo

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
deploy/
scripts/
```

## Command Utama

```bash
pnpm install
docker compose up -d postgres redis
pnpm --filter @omnia/backend-api prisma:generate
pnpm --filter @omnia/backend-api db:migrate:local
pnpm --filter @omnia/backend-api prisma:seed
pnpm --filter @omnia/desktop-app localdb:init
pnpm typecheck
pnpm lint
pnpm build
pnpm smoke:mvp
```

## Environment Penting

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `PUBLIC_API_URL`
- `CORS_ORIGINS`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SYNC_STATUS_POLL_INTERVAL_MS`
- `LLM_PROVIDER`
- `LLM_API_KEY`
- `LLM_MODEL`
- `LLM_TIMEOUT_MS`
- `LLM_INSIGHT_TTL_MINUTES`
- `LLM_MAX_INSIGHTS`
- `LLM_MAX_CONTEXT_ROWS`
- `LLM_GENERATION_COOLDOWN_MINUTES`
- `AI_WORKER_BACKEND_TOKEN` jika worker tetap dipakai sebagai orchestrator internal

## Risiko Teknis

- Electron lebih berat dari shell ringan; POS screen harus tetap sederhana.
- Packaging Next.js + Electron harus divalidasi terpisah dari `next dev`; lihat `14-desktop-wrapper-readiness.md`.
- SQLite + sync butuh idempotency dan replay test.
- Prisma query kompleks mungkin perlu raw SQL selektif.
- Dua runtime Node/Python perlu contract yang jelas.
