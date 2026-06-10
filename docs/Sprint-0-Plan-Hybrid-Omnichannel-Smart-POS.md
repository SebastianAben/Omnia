# Sprint 0 Plan

> Catatan scope terbaru 2026-06-09: dokumen ini adalah rencana Sprint 0
> historis. Source of truth terbaru ada di `docs/10-implementation-roadmap.md`,
> `docs/12-actual-status.md`, dan `.agents/sessionImplementation.md`.
> Integrasi Shopee tidak lagi menjadi scope aktif MVP. Target AI berubah dari
> analytics/rule-based dasar menjadi LLM provider integration.

## 1. Informasi Dokumen

- Nama produk: Omnia
- Nama dokumen: Sprint 0 Plan
- Versi: 1.0
- Tanggal: 2026-04-28
- Referensi:
  - `docs/PRD-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/MVP-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/High-Level-Architecture-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/User-Flow-Utama-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/ERD-Awal-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/Sync-Specification-Detail-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/API-Contract-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/Technical-Stack-Decision-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/Deployment-Strategy-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/Multi-Agent-Workflow-Hybrid-Omnichannel-Smart-POS.md`

## 2. Tujuan Sprint 0

Sprint 0 bertujuan menyiapkan fondasi project sebelum development fitur bisnis utama dimulai.

Sprint ini bukan fokus pada menyelesaikan seluruh fitur MVP, tetapi fokus pada:

- setup struktur project
- validasi stack teknis
- pembuatan skeleton aplikasi
- setup local dan central database
- setup auth dan module boundary dasar
- setup sync foundation
- setup deployment dan environment contract dasar
- setup multi-agent workflow untuk PM, worker, QA, reviewer, dan laporan akhir
- memastikan tim punya baseline yang stabil untuk Sprint 1 dan seterusnya

## 3. Outcome Sprint 0

Setelah Sprint 0 selesai, tim harus sudah memiliki:

- monorepo yang rapi
- aplikasi desktop utama yang bisa dijalankan
- backend pusat yang bisa dijalankan
- koneksi backend ke central database
- local database cabang yang siap dipakai
- struktur modul awal sesuai arsitektur
- auth skeleton
- sync skeleton
- seed data dasar
- CI, linting, format, environment setup, dan deployment readiness dasar

## 4. Scope Sprint 0

### 4.1 In Scope

- monorepo setup
- package management setup
- aplikasi desktop shell setup
- React app setup
- backend NestJS setup
- PostgreSQL setup
- Prisma setup
- SQLite setup
- Redis + BullMQ setup
- auth skeleton
- API skeleton
- sync skeleton
- env management
- deployment strategy dan env contract
- CORS strategy berbasis environment
- Docker Compose draft untuk backend, PostgreSQL, dan Redis
- multi-agent workflow document
- logging dasar
- Sentry preparation opsional dasar
- seed data dasar
- folder structure final awal
- coding standard dasar

### 4.2 Out of Scope

- POS flow lengkap
- dashboard lengkap
- Shopee integration lengkap
- AI analytics lengkap
- laporan penuh
- final UI polish
- final auth hardening production-grade

## 5. Deliverables Sprint 0

Deliverables minimum:

- repo structure final awal
- desktop app dapat dijalankan
- backend API dapat dijalankan
- koneksi PostgreSQL aktif
- Prisma schema awal aktif
- SQLite local setup aktif
- Redis queue aktif
- health check endpoint aktif
- auth login skeleton aktif
- product module skeleton aktif
- branch module skeleton aktif
- sync module skeleton aktif
- `.env.example` tersedia
- deployment strategy document tersedia
- multi-agent workflow document tersedia
- PM final report template tersedia
- local dan production URL dikendalikan lewat environment variable
- backend health endpoint siap dipakai untuk deploy check
- README setup dasar tersedia

## 6. Struktur Repo yang Harus Dibangun

Struktur awal yang disarankan:

```text
/apps
  /desktop-app
  /backend-api
  /ai-worker
/packages
  /ui
  /types
  /config
  /shared-utils
/docs
```

### Penjelasan

- `apps/desktop-app`
  aplikasi utama React + Electron

- `apps/backend-api`
  backend NestJS untuk API pusat

- `apps/ai-worker`
  worker Python untuk AI dasar

- `packages/ui`
  shared UI primitives atau design base

- `packages/types`
  shared types dan contract yang aman dibagi

- `packages/config`
  konfigurasi lint, tsconfig, env schema, dan sejenisnya

- `packages/shared-utils`
  helper umum yang dipakai lintas app

## 7. Workstream Sprint 0

Sprint 0 dibagi menjadi 8 workstream utama:

1. Repo and Tooling Setup
2. Desktop App Foundation
3. Backend Foundation
4. Database Foundation
5. Sync Foundation
6. Auth Foundation
7. Developer Experience and Quality
8. Seed Data and Demo Readiness

## 8. Workstream 1: Repo and Tooling Setup

### Tujuan

Menyiapkan workspace development yang konsisten.

### Task

- inisialisasi monorepo
- pilih package manager workspace
- setup TypeScript base config
- setup linting
- setup formatting
- setup path alias dasar
- setup git hooks opsional
- setup environment validation dasar

### Output

- repo bisa di-install dengan satu alur setup
- standar kode dasar sudah aktif

## 9. Workstream 2: Desktop App Foundation

### Tujuan

Menyiapkan aplikasi utama berbasis React + Electron.

### Task

- bootstrap React app
- bootstrap Electron shell
- integrasikan React dan Electron
- pastikan app bisa run di local
- setup routing dasar per role
- setup layout dasar aplikasi
- setup state management base:
  - Zustand
  - TanStack Query
- setup folder modules frontend

### Output

- desktop app menyala
- ada shell layout dasar
- siap untuk integrasi auth dan local DB

## 10. Workstream 3: Backend Foundation

### Tujuan

Menyiapkan backend pusat berbasis NestJS.

### Task

- bootstrap NestJS project
- setup module structure dasar
- setup config module
- setup global validation
- setup error response base
- setup logging base
- setup Swagger/OpenAPI base
- setup health check endpoint

### Output

- backend dapat dijalankan
- base API sudah siap dikembangkan

## 11. Workstream 4: Database Foundation

### Tujuan

Menyiapkan fondasi data pusat dan lokal.

### Task Central DB

- setup PostgreSQL
- setup Prisma
- terjemahkan ERD awal ke Prisma schema awal
- buat migration awal
- buat koneksi database service

### Task Local DB

- setup SQLite untuk desktop app
- buat local schema awal minimum:
  - users session minimal
  - products cache
  - branch prices cache
  - inventory balances lokal
  - stock movements lokal
  - sales transactions lokal
  - payments lokal
  - sync queue lokal

### Output

- central DB siap
- local DB siap
- struktur data minimum bisa diuji

## 12. Workstream 5: Sync Foundation

### Tujuan

Menyiapkan pondasi sinkronisasi sesuai sync specification.

### Task

- setup Redis
- setup BullMQ
- buat sync queue dasar di backend
- buat struktur sync job model
- buat endpoint `sync/bundles` skeleton
- buat acknowledgement response base
- buat log sync dasar
- buat status sync dasar di frontend/local app

### Output

- alur dasar push bundle dapat diuji walau belum final
- queue pusat aktif

## 13. Workstream 6: Auth Foundation

### Tujuan

Menyiapkan fondasi login dan role-based access.

### Task

- buat entity/model role dan user
- buat seed role MVP
- buat seed admin awal
- implement login endpoint dasar
- implement token validation
- implement `auth/me`
- buat route guard backend
- buat role-based frontend routing awal

### Output

- login dasar berjalan
- role routing awal berjalan

## 14. Workstream 7: Developer Experience and Quality

### Tujuan

Membuat project nyaman untuk dikembangkan sejak awal.

### Task

- README setup project
- `.env.example`
- script run all apps
- script migration
- script seed
- script lint
- script test
- script format
- deployment strategy document
- environment variable contract
- CORS configuration strategy
- Docker Compose draft untuk backend, PostgreSQL, dan Redis
- error boundary frontend dasar
- loading convention dasar

### Output

- developer baru bisa onboarding lebih cepat
- konfigurasi local, preview, dan production tidak membutuhkan perubahan kode

## 15. Workstream 8: Seed Data and Demo Readiness

### Tujuan

Menyiapkan data dummy agar alur dasar bisa didemokan.

### Data yang Perlu Disiapkan

- 2-3 branch dummy
- role MVP
- 4-8 user dummy
- 15-30 product dummy
- kategori dummy
- branch price dummy
- inventory dummy
- 2-3 transaction dummy
- 1-2 Shopee order dummy opsional dasar

### Output

- aplikasi dapat diuji tanpa menunggu input manual penuh

## 16. Module Skeleton Minimum yang Harus Ada

### Frontend Modules

- auth
- shell/layout
- pos
- inventory
- dashboard
- sync status
- integrations
- ai-insights

### Backend Modules

- auth
- users
- roles
- branches
- registers
- products
- categories
- pricing
- inventory
- transactions
- payments
- shifts
- sync
- dashboard
- shopee
- ai-insights
- audit
- health

## 17. Definition of Done Sprint 0

Sprint 0 dianggap selesai jika:

- monorepo berjalan
- desktop app dapat dibuka
- backend API dapat berjalan
- PostgreSQL terkoneksi
- Prisma migration pertama sukses
- SQLite lokal dapat dipakai aplikasi
- Redis dan BullMQ aktif
- login skeleton berjalan
- endpoint health check berjalan
- sync endpoint skeleton tersedia
- seed data dapat dijalankan
- deployment strategy document tersedia
- backend bisa dijalankan dengan env local
- frontend bisa diarahkan ke backend berbeda hanya dengan env
- CORS allowlist dikendalikan dari environment variable
- tidak ada URL production di source code
- Docker Compose draft tersedia untuk backend, PostgreSQL, dan Redis
- multi-agent workflow dan PM final report template tersedia
- README setup cukup jelas untuk developer lain

## 18. Risiko Sprint 0

### Risiko 1

- integrasi React + Electron memakan waktu lebih lama dari dugaan

Mitigasi:

- mulai dari shell minimal, jangan kejar UI lengkap

### Risiko 2

- local DB dan central DB boundary belum rapi

Mitigasi:

- patuhi ERD dan sync spec yang sudah dibuat

### Risiko 3

- tim terlalu cepat masuk feature sebelum fondasi stabil

Mitigasi:

- lock Sprint 0 hanya untuk foundation deliverables

### Risiko 4

- stack terlalu banyak sekaligus untuk tim pemula

Mitigasi:

- prioritaskan setup minimum yang benar-benar diperlukan
- jangan langsung memasang seluruh kompleksitas production

## 19. Rekomendasi Urutan Pengerjaan Sprint 0

Urutan yang paling aman:

1. setup monorepo dan tooling
2. bootstrap backend
3. bootstrap desktop app
4. setup PostgreSQL + Prisma
5. setup SQLite lokal
6. setup auth skeleton
7. setup Redis + BullMQ
8. setup sync skeleton
9. setup seed data
10. setup deployment env contract
11. setup README dan scripts

## 20. Checklist Sprint 0

- [x] Monorepo workspace aktif
- [x] Desktop app React + Electron aktif
- [x] Backend NestJS aktif
- [x] PostgreSQL aktif
- [x] Prisma schema awal aktif
- [x] SQLite lokal aktif
- [x] Redis aktif
- [x] BullMQ aktif
- [x] Auth login skeleton aktif
- [x] Role seed aktif
- [x] Product seed aktif
- [x] Branch seed aktif
- [x] Sync endpoint skeleton aktif
- [x] Health endpoint aktif
- [x] `.env.example` siap
- [x] Deployment strategy document siap
- [x] Env variable contract siap
- [x] CORS strategy siap
- [x] Docker Compose local/home-server draft siap
- [x] Local dan production URL tidak hardcoded
- [x] Multi-agent workflow siap
- [x] PM final report template siap
- [x] README setup dasar siap

### 20.1 Status Implementasi Sprint 0 Saat Ini

- [x] Root monorepo memakai `pnpm workspace`.
- [x] Shared packages awal tersedia: `@omnia/types`, `@omnia/config`, `@omnia/shared-utils`, dan `@omnia/ui`.
- [x] Desktop app Next.js + Electron skeleton tersedia di `apps/desktop-app`.
- [x] Desktop app memiliki route awal: `/login`, `/`, `/pos`, dan `/sync-status`.
- [x] Tailwind CSS, Zustand, TanStack Query, dan shared UI primitives sudah tersedia.
- [x] Backend NestJS skeleton tersedia di `apps/backend-api`.
- [x] Backend memiliki global prefix `/api/v1`.
- [x] Backend health endpoint tersedia di `GET /api/v1/health`.
- [x] Auth skeleton tersedia di `POST /api/v1/auth/login` dan `GET /api/v1/auth/me`.
- [x] Product module skeleton tersedia di `GET /api/v1/products`.
- [x] Branch module skeleton tersedia di `GET /api/v1/branches`.
- [x] Sync endpoint skeleton tersedia di `POST /api/v1/sync/events`.
- [x] Redis + BullMQ queue skeleton tersedia untuk sync event.
- [x] PostgreSQL local berjalan via Docker Compose.
- [x] PostgreSQL local memakai host port `55433` untuk menghindari konflik dengan PostgreSQL lokal di port `5432`.
- [x] Prisma schema awal tersedia.
- [x] Migration SQL awal tersedia di `apps/backend-api/prisma/migrations/20260505023000_init/migration.sql`.
- [x] Seed data awal tersedia dan sudah diuji: role cashier, branch demo, user demo, product demo, inventory demo.
- [x] SQLite local schema tersedia di `apps/desktop-app/local-store/schema.sql`.
- [x] Script local DB tersedia: `pnpm --filter @omnia/desktop-app localdb:init`.
- [x] AI worker skeleton tersedia di `apps/ai-worker`.
- [x] Deployment strategy, design guide, dan multi-agent workflow sudah tersedia di `docs`.
- [x] Validasi terakhir berhasil: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, dan `pnpm build`.
- [x] Smoke test backend berhasil untuk health, auth login, products, branches, dan sync event enqueue.
- [ ] UI belum pixel-perfect mengikuti Figma karena Figma MCP/tool pembaca desain tidak tersedia pada sesi implementasi.
- [ ] CI/GitHub Actions belum dibuat.
- [ ] Auth belum production-grade; password hashing dan JWT sungguhan masuk Sprint 1.
- [ ] Sync belum menerapkan event ke central DB; saat ini baru receive + enqueue.
- [ ] POS masih placeholder; transaksi nyata masuk Sprint 2.

## 21. Artifact yang Sebaiknya Dihasilkan Selama Sprint 0

- initial repo scaffold
- initial Prisma schema
- local DB schema awal
- auth flow skeleton
- sync flow skeleton
- sample API docs dari Swagger
- sample seed script
- sample runbook local development
- deployment strategy document
- Docker Compose draft untuk local/home-server
- env variable contract
- multi-agent workflow document
- PM final report template

## 22. Hasil yang Belum Perlu Disempurnakan di Sprint 0

Pada Sprint 0 belum perlu:

- UI cantik final
- semua endpoint lengkap
- semua validation detail
- semua AI flow final
- semua integrasi Shopee final
- testing coverage tinggi

Fokus Sprint 0 adalah `fondasi yang jalan`, bukan `fitur yang selesai penuh`.

## 23. Kesimpulan

Sprint 0 adalah fase menyiapkan tanah sebelum membangun rumah. Untuk Omnia, Sprint 0 sangat penting karena project ini:

- hybrid
- multi-domain
- local-first
- punya sinkronisasi
- punya integrasi Shopee
- punya AI layer

Kalau Sprint 0 dilakukan dengan benar, Sprint 1 dan seterusnya akan jauh lebih stabil, cepat, dan tidak terlalu banyak revisi arsitektur di tengah jalan.
