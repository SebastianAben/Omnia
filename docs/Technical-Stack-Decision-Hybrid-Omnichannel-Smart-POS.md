# Technical Stack Decision

## 1. Informasi Dokumen

- Nama produk: Omnia
- Nama dokumen: Technical Stack Decision
- Versi: 1.0
- Tanggal: 2026-04-28
- Referensi:
  - `docs/PRD-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/MVP-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/High-Level-Architecture-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/ERD-Awal-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/Sync-Specification-Detail-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/API-Contract-Hybrid-Omnichannel-Smart-POS.md`

## 2. Tujuan Dokumen

Dokumen ini menetapkan keputusan technical stack untuk MVP Omnia agar tim memiliki fondasi implementasi yang konsisten untuk:

- aplikasi utama
- penyimpanan lokal cabang
- backend pusat
- sinkronisasi
- dashboard
- integrasi Shopee
- AI analytics dasar

## 3. Prinsip Pemilihan Stack

Technical stack dipilih berdasarkan prinsip berikut:

- realistis untuk MVP
- cocok untuk arsitektur hybrid local-first
- kuat untuk transaksi operasional
- cukup sederhana untuk tim kecil atau menengah
- mudah dipelihara
- tidak terlalu berat secara infrastruktur awal
- bisa berkembang ke multi-cabang dan omnichannel

## 4. Keputusan Stack Tingkat Tinggi

### 4.1 Frontend App

Dipilih:

- `Next.js`
- `TypeScript`
- `Tailwind CSS`
- `shadcn/ui` atau komponen internal berbasis Radix

### 4.2 Packaging Aplikasi

Dipilih:

- `Electron`

Fungsi:

- membungkus aplikasi utama menjadi desktop app
- memudahkan akses printer, scanner, dan device lokal
- mendukung local-first workflow dengan lebih stabil dibanding browser murni

### 4.3 Local Database Cabang

Dipilih:

- `SQLite`
- ORM lokal ringan atau akses query terstruktur dari app layer

### 4.4 Backend Pusat

Dipilih:

- `NestJS`
- `TypeScript`

### 4.5 Central Database

Dipilih:

- `PostgreSQL`

### 4.6 ORM Backend

Dipilih:

- `Prisma`

### 4.7 Queue dan Background Jobs

Dipilih:

- `Redis`
- `BullMQ`

### 4.8 Authentication

Dipilih:

- `JWT access token`
- refresh token jika dibutuhkan
- role-based authorization di backend

### 4.9 API

Dipilih:

- `REST API`
- dokumentasi `OpenAPI / Swagger`

### 4.10 AI Analytics Dasar

Dipilih:

- service internal `Python`
- pemrosesan AI / analytics dengan:
  - `Pandas`
  - `scikit-learn`
  - model statistik sederhana
- LLM hanya opsional untuk narasi insight pada fase lanjut

### 4.11 Monitoring dan Logging

Dipilih:

- logging aplikasi terstruktur
- `Sentry` untuk error tracking
- logging terpusat berbasis file atau transport log server

### 4.12 Testing

Dipilih:

- `Vitest` untuk frontend/unit test
- `Jest` atau `Vitest` untuk backend test
- `Playwright` untuk end-to-end test utama

## 5. Keputusan Detail per Layer

## 5.1 Application Layer: Next.js + Electron

### Dipilih

- Next.js sebagai UI application layer
- Electron sebagai desktop shell

### Alasan

- satu codebase UI lebih mudah dipelihara
- React ecosystem matang untuk dashboard dan POS screen
- Electron memberi fleksibilitas untuk hardware-aware desktop app
- lebih cocok untuk local-first dibanding web browser biasa pada use case POS
- bisa tetap menghadirkan pengalaman “1 aplikasi utama”

### Peran Stack Ini

- POS screen
- dashboard role-based
- inventory UI
- Shopee integration UI
- AI insight UI
- local sync status UI

### Catatan

- Walau memakai Next.js, aplikasi ini tidak diposisikan sebagai web murni untuk POS cabang.
- Frontend harus dipisah modular agar POS screen tetap ringan.

## 5.2 Frontend State Management

### Dipilih

- `Zustand`
- `TanStack Query`

### Alasan

- Zustand ringan untuk state lokal UI
- TanStack Query baik untuk server state
- kombinasi ini cocok untuk aplikasi yang punya local data, API data, dan sync state
- lebih sederhana untuk MVP dibanding state framework yang terlalu besar

### Peran

- user session UI state
- cart state
- branch context
- sync status state
- API fetching dan cache

## 5.3 UI Layer

### Dipilih

- Tailwind CSS
- shadcn/ui
- Radix primitives

### Alasan

- cepat untuk membangun UI MVP
- mudah dikustomisasi
- cukup konsisten untuk dashboard dan backoffice
- tetap bisa dibuat ringan untuk POS screen

## 5.4 Local Storage Layer

### Dipilih

- SQLite

### Alasan

- ringan dan stabil untuk desktop/local app
- cocok untuk transaksi lokal dan queue lokal
- jauh lebih kuat daripada hanya mengandalkan browser storage
- mudah untuk pencatatan transaksi offline

### Data yang Disimpan Lokal

- transaksi POS
- item transaksi
- payment record
- stok cabang
- stock movement
- sync queue
- cache master data minimum

## 5.5 Backend API Layer

### Dipilih

- NestJS

### Alasan

- arsitektur modular sangat cocok untuk domain besar
- cocok untuk TypeScript end-to-end dengan frontend
- mendukung dependency injection dan struktur enterprise-style yang rapi
- enak untuk memisahkan modul:
  - auth
  - products
  - inventory
  - transactions
  - sync
  - Shopee
  - AI

## 5.6 Central Database Layer

### Dipilih

- PostgreSQL

### Alasan

- matang untuk transaksi operasional
- kuat untuk relasi data kompleks
- cocok untuk audit, sync log, dan omnichannel data
- mendukung indexing dan growth yang baik untuk MVP menuju scale-up

## 5.7 ORM Layer

### Dipilih

- Prisma

### Alasan

- sangat cocok dengan TypeScript
- schema model mudah dibaca
- migration workflow jelas
- cukup produktif untuk tim yang ingin bergerak cepat

### Catatan

- Jika ada kebutuhan query yang sangat spesifik atau optimasi berat, raw SQL tetap bisa dipakai secara selektif.

## 5.8 Queue dan Background Worker

### Dipilih

- Redis
- BullMQ

### Alasan

- sederhana dan cukup kuat untuk MVP
- cocok untuk:
  - retry sync
  - webhook processing
  - dashboard aggregation
  - AI jobs
- banyak dipakai dan dokumentasinya matang

### Job yang Masuk Queue

- inbound sync processing
- outbound master data sync
- Shopee webhook processing
- stock sync ke Shopee
- AI insight generation
- dashboard aggregation refresh

## 5.9 Authentication dan Authorization

### Dipilih

- JWT
- password hashing modern
- role and permission validation di backend

### Alasan

- cukup sederhana untuk MVP
- cocok untuk aplikasi terpusat dengan cabang banyak
- mudah diintegrasikan dengan Electron app

### Catatan

- Session lokal cabang tetap perlu dikelola terpisah untuk usability offline.
- Kebijakan offline login perlu disepakati di tahap implementasi auth detail.

## 5.10 API Style

### Dipilih

- REST API

### Alasan

- lebih mudah untuk dipahami dan diimplementasikan cepat
- cocok untuk boundary yang sudah didefinisikan di API contract
- lebih sederhana untuk integrasi awal dibanding GraphQL

### Dokumentasi

- Swagger / OpenAPI

## 5.11 Shopee Integration Layer

### Dipilih

- service module di backend pusat
- job worker untuk webhook dan outbound stock sync

### Alasan

- integrasi tidak boleh berjalan di jalur checkout
- lebih aman dipisah dari modul transaksi inti

## 5.12 AI Analytics Layer

### Dipilih

- Python service kecil atau worker terpisah
- Pandas
- scikit-learn

### Alasan

- ekosistem Python lebih matang untuk analytics dan forecasting sederhana
- cocok untuk stockout prediction dasar
- fleksibel untuk berkembang ke model lebih kompleks nanti

### Peran

- low stock alerts
- stockout prediction sederhana
- tren penjualan dasar

### Catatan

- Untuk MVP, AI tidak perlu jadi microservice kompleks.
- Bisa dimulai sebagai worker atau service internal yang dipanggil oleh backend/job queue.

## 5.13 Logging, Monitoring, Error Tracking

### Dipilih

- aplikasi logging terstruktur
- Sentry
- audit log di database

### Alasan

- error sync dan integrasi harus cepat terlihat
- masalah di cabang harus mudah ditelusuri

### Minimum yang Dipantau

- sync failures
- queue backlog
- Shopee webhook failure
- branch offline duration
- AI job failure

## 5.14 Testing Strategy

### Dipilih

- unit test untuk business logic penting
- integration test untuk sync dan backend module
- e2e test untuk flow utama

### Tools

- Vitest
- Jest atau Vitest
- Playwright

### Fokus Test MVP

- transaksi POS
- stock movement
- sync bundle processing
- conflict handling dasar
- Shopee mapping
- AI insight endpoint dasar

## 6. Struktur Repo yang Disarankan

Disarankan menggunakan monorepo.

Contoh struktur:

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

## 7. Alasan Memilih Monorepo

- lebih mudah berbagi types dan util
- cocok untuk TypeScript lintas frontend dan backend
- konsisten untuk shared contract
- cocok untuk tim kecil yang ingin bergerak cepat

## 8. Data Flow dan Stack Mapping

### Branch App

- Next.js UI
- Electron shell
- SQLite local store
- Zustand + TanStack Query

### Central Platform

- NestJS API
- PostgreSQL
- Prisma
- Redis + BullMQ

### Analytics Layer

- Python worker/service
- Pandas
- scikit-learn

### Monitoring

- Sentry
- structured logging
- audit log database

## 9. Alternatif yang Dipertimbangkan

## 9.1 Web App Murni

Tidak dipilih untuk POS inti karena:

- terlalu bergantung pada koneksi
- kurang ideal untuk local-first cabang
- lebih rawan mengganggu checkout jika pusat bermasalah

## 9.2 Flutter / Mobile-First

Tidak dipilih untuk MVP karena:

- dashboard dan admin workflow lebih natural di stack web/desktop
- local-first desktop POS lebih sesuai dengan kebutuhan cabang dan perangkat

## 9.3 Tauri

Layak dipertimbangkan di masa depan, tetapi tidak dipilih dulu karena:

- Electron lebih matang dan lebih umum untuk tim yang ingin cepat bergerak
- ekosistem integrasi desktop dan referensi implementasi lebih banyak

## 9.4 Python untuk Seluruh Backend

Tidak dipilih sebagai backend utama karena:

- tim kemungkinan lebih cepat bergerak dengan TypeScript end-to-end untuk UI dan API
- boundary frontend-backend jadi lebih konsisten

Python tetap dipilih untuk analytics/AI layer.

## 10. Keputusan Non-Functional Terkait Stack

### Performance

Didukung oleh:

- SQLite lokal untuk write operasional cepat
- BullMQ untuk memindahkan kerja berat dari jalur checkout
- PostgreSQL untuk konsolidasi pusat

### Reliability

Didukung oleh:

- local-first app
- persistent local database
- retry queue
- structured logging

### Maintainability

Didukung oleh:

- TypeScript lintas app dan backend
- monorepo
- NestJS modular design
- Prisma schema

### Scalability

Didukung oleh:

- Redis queue
- worker terpisah
- PostgreSQL
- integrasi Shopee terisolasi

## 11. Dependency Tambahan yang Disarankan

### Frontend / Desktop

- React Hook Form
- Zod
- TanStack Table
- date utility library

### Backend

- class-validator atau Zod validation strategy
- Swagger
- bcrypt/argon2

### Shared

- UUID library
- environment validation

## 12. Risiko dari Stack yang Dipilih

### Electron

Risiko:

- resource usage lebih besar dibanding shell yang lebih ringan

Mitigasi:

- jaga UI POS tetap ringan
- hindari rendering berat di layar kasir

### SQLite + Sync

Risiko:

- implementasi sync jadi cukup sensitif

Mitigasi:

- ikuti sync spec ketat
- audit queue dan replay logic sejak awal

### NestJS + Prisma

Risiko:

- beberapa query kompleks bisa butuh optimasi tambahan

Mitigasi:

- gunakan raw query selektif jika memang diperlukan

### Python AI Worker

Risiko:

- ada dua runtime utama: Node dan Python

Mitigasi:

- batasi AI worker hanya untuk analytics
- jaga contract antar service sederhana

## 13. Keputusan Final Stack MVP

Stack final yang direkomendasikan:

- Frontend app: `Next.js + TypeScript + Tailwind CSS + shadcn/ui`
- Desktop shell: `Electron`
- Frontend state: `Zustand + TanStack Query`
- Local DB: `SQLite`
- Backend API: `NestJS + TypeScript`
- Central DB: `PostgreSQL`
- ORM: `Prisma`
- Queue: `Redis + BullMQ`
- Auth: `JWT-based auth`
- AI worker: `Python + Pandas + scikit-learn`
- Monitoring: `Sentry + structured logging`
- API style: `REST + OpenAPI`
- Testing: `Vitest / Jest + Playwright`

## 14. Tahap Lanjut Setelah Dokumen Ini

Setelah stack decision ini, dokumen planning yang paling tepat berikutnya adalah:

1. Sprint 0 plan
2. repo structure detail
3. module breakdown engineering
4. wireframe atau sitemap final jika belum

## 15. Kesimpulan

Technical stack ini dipilih untuk menyeimbangkan:

- kebutuhan operasional cabang yang tahan offline
- kemudahan pengembangan MVP
- kebutuhan omnichannel Shopee
- kebutuhan analytics dan AI dasar

Stack ini cukup modern, cukup realistis, dan cukup aman untuk membangun Omnia dari tahap MVP menuju sistem yang lebih matang tanpa mengambil kompleksitas berlebihan terlalu awal.
