# Omnia

Omnia adalah Hybrid Smart POS untuk retail dan UMKM multi-cabang. Aplikasi ini dirancang untuk menjaga transaksi kasir tetap berjalan secara local-first, lalu menyinkronkan data operasional ke pusat untuk inventory, dashboard, audit, monitoring, dan LLM-powered insights.

Produk ini berfokus pada workflow operasional toko: checkout POS, shift kasir, stock movement, sync offline-online, dashboard pusat/cabang, serta insight berbasis data untuk membantu pengambilan keputusan.

## Fitur Utama

- POS local-first dengan penyimpanan transaksi di SQLite lokal.
- Sync replay dari cabang ke backend pusat dengan idempotency.
- Inventory dasar, stock movement, dan audit log.
- Dashboard cabang dan pusat untuk melihat KPI operasional.
- Role MVP untuk cashier, store supervisor, HQ admin, dan executive/analyst.
- LLM insights untuk rekomendasi operasional seperti low stock, sales trend, anomaly, dan stockout risk.

## Tech Stack

| Layer      | Teknologi                                           |
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
| CI/CD      | GitHub Actions, Docker                              |

## Struktur Repository

```text
apps/
  desktop-app/   Next.js renderer dan Electron shell
  backend-api/   NestJS central API
  ai-worker/     Worker LLM/analytics
packages/
  ui/            Shared UI primitives
  types/         Shared TypeScript contracts
  config/        Shared runtime config helpers
  shared-utils/  Shared utilities
docs/            Dokumentasi produk, arsitektur, teknis, dan workflow
deploy/          Konfigurasi deployment
scripts/         Script development dan smoke test
```

## Prerequisites

- Node.js 20+
- pnpm 9+ sesuai `packageManager` repo
- Docker dan Docker Compose untuk PostgreSQL dan Redis lokal
- `sqlite3` CLI untuk inisialisasi local-first SQLite pada desktop app

Aktifkan pnpm melalui Corepack jika belum tersedia:

```bash
corepack enable
corepack prepare pnpm@10.17.0 --activate
```

## Menjalankan Secara Lokal

1. Install dependencies.

```bash
pnpm install
```

2. Siapkan environment lokal.

```bash
cp .env.example .env.local
```

Sesuaikan nilai di `.env.local` bila perlu, terutama `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, dan `NEXT_PUBLIC_API_BASE_URL`.

3. Jalankan PostgreSQL dan Redis.

```bash
docker compose up -d postgres redis
```

4. Siapkan database pusat dan local store.

```bash
pnpm --filter @omnia/backend-api db:migrate:local
pnpm --filter @omnia/backend-api prisma:seed
pnpm --filter @omnia/desktop-app localdb:init
```

5. Jalankan semua workspace app.

```bash
pnpm dev
```

Endpoint lokal utama:

- Desktop renderer: `http://localhost:3000`
- Backend API docs: `http://localhost:4000/api/v1/docs`

### Opsi Cepat

Repo juga menyediakan script setup lokal yang lebih otomatis:

```bash
pnpm dev:full
```

Script ini berbasis PowerShell. Gunakan flow manual di atas jika environment lokal tidak mendukung PowerShell.

## Deployment

Frontend Omnia dapat diakses di:

[https://omnia-rosy.vercel.app](https://omnia-rosy.vercel.app)

Detail deployment backend, environment server, dan CI/CD dipisahkan dari README utama. Lihat konfigurasi di folder `deploy/` dan dokumentasi terkait di `docs/`.

## Command Penting

| Command                         | Fungsi                                              |
| ------------------------------- | --------------------------------------------------- |
| `pnpm dev`                      | Menjalankan workspace app dalam mode development    |
| `pnpm dev:full`                 | Setup dan menjalankan local dev flow via PowerShell |
| `pnpm build`                    | Build seluruh workspace yang memiliki script build  |
| `pnpm lint`                     | Menjalankan lint/type guard per workspace           |
| `pnpm typecheck`                | Menjalankan TypeScript typecheck                    |
| `pnpm test:backend:vitest`      | Menjalankan test backend dengan Vitest              |
| `pnpm test:e2e:web`             | Menjalankan Playwright E2E untuk web renderer       |
| `pnpm test:e2e:electron`        | Menjalankan Playwright E2E untuk Electron           |
| `pnpm smoke:mvp`                | Menjalankan smoke check MVP                         |
| `pnpm format:check`             | Mengecek format dengan Prettier                     |

## Testing dan Quality Checks

Gunakan command berikut sesuai kebutuhan sebelum membuat perubahan besar atau sebelum release:

```bash
pnpm typecheck
pnpm lint
pnpm test:backend:vitest
pnpm test:e2e:web
pnpm test:e2e:electron
pnpm smoke:mvp
pnpm format:check
```

`pnpm smoke:mvp` memvalidasi alur penting seperti health check, login role utama, master data, sync bundle/idempotency, dashboard pusat, dan LLM insights.
