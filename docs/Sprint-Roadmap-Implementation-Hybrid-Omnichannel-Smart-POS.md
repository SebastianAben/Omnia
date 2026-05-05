# Sprint Roadmap Implementation Plan

## 1. Informasi Dokumen

- Nama produk: Omnia
- Nama dokumen: Sprint Roadmap Implementation Plan
- Versi: 1.0
- Tanggal: 2026-05-05
- Referensi:
  - `docs/PRD-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/MVP-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/High-Level-Architecture-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/Technical-Stack-Decision-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/Sync-Specification-Detail-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/API-Contract-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/README.md`
- Skill/security review:
  - Menggunakan workflow `skill-scanner`
  - Scan otomatis tidak dapat dijalankan karena instalasi lokal `skill-scanner` hanya berisi `SKILL.md` dan tidak menyertakan `scripts/scan_skill.py`
  - Review manual `skill-scanner` dilakukan terhadap instruksi skill dan struktur file lokal; tidak ditemukan instruksi untuk membaca secret, memodifikasi konfigurasi agent, atau menjalankan remote code

## 2. Tujuan Roadmap Sprint

Dokumen ini merancang tahapan implementasi Omnia dari fondasi sampai MVP siap divalidasi, lalu menyiapkan jalur fase lanjutan setelah MVP.

Dokumen ini juga menjadi hasil konsolidasi dari:

- roadmap lanjutan MVP yang sebelumnya terpisah
- checklist persiapan development/vibes coding
- catatan status Sprint 0 yang sudah berubah menjadi fondasi runnable

Roadmap ini mengikuti keputusan produk dan teknis berikut:

- satu aplikasi utama berbasis role
- POS cabang bersifat hybrid local-first
- pusat menjadi sumber konsolidasi dan keputusan final konflik
- sync, dashboard, integrasi Shopee, dan AI berjalan asynchronous
- stack utama memakai Next.js, Electron, NestJS, Prisma, PostgreSQL, SQLite, Redis, BullMQ, dan Python worker

## 3. Prinsip Penyusunan Sprint

- Sprint tidak boleh merusak alur POS yang sudah stabil.
- Fitur berat seperti dashboard, Shopee, dan AI tidak boleh blocking checkout.
- Setiap sprint harus menghasilkan luaran yang bisa diuji.
- Sync dan audit dibuat lebih awal karena menjadi fondasi reliability.
- AI hanya advisory dan tidak mengubah stok, harga, atau order secara otomatis.
- Payment gateway, retur, multi-marketplace, dan accounting penuh tetap di luar MVP.

## 4. Checklist Persiapan Development

Checklist ini menggantikan dokumen persiapan yang sebelumnya terpisah. Gunakan sebagai gate sebelum mulai atau melanjutkan sprint besar.

### 4.1 Produk dan Scope

- [x] Tujuan produk, user utama, masalah utama, dan scope MVP tersedia di PRD dan MVP document.
- [x] Keputusan `1 aplikasi utama berbasis role` sudah dikunci.
- [x] Keputusan `hybrid local-first POS` sudah dikunci.
- [x] Marketplace pertama adalah Shopee.
- [x] AI pada fase awal hanya sebagai advisor, bukan auto-action.
- [x] Out of scope MVP sudah ditulis.

### 4.2 Desain, Arsitektur, dan Data

- [x] User flow utama tersedia.
- [x] Arsitektur high-level tersedia.
- [x] ERD awal tersedia.
- [x] Sync, retry, replay, idempotency, dan conflict handling sudah punya spesifikasi.
- [x] Role MVP tersedia.
- [x] UI direction tersedia di design guide.
- [ ] UI final dari Figma/Stitch belum diimplementasikan secara pixel-aligned.

### 4.3 Engineering

- [x] Tech stack sudah dipilih.
- [x] Monorepo dan package workspace tersedia.
- [x] Backend NestJS skeleton tersedia.
- [x] Prisma schema dan migration awal tersedia.
- [x] PostgreSQL dan Redis local tersedia via Docker Compose.
- [x] SQLite local schema tersedia.
- [x] Seed data dasar tersedia.
- [x] API pattern REST dan OpenAPI-ready sudah dipilih.
- [x] CI/CD GitHub Actions sudah tersedia untuk validasi, build image backend, publish GHCR, dan deploy backend.
- [x] Sync apply logic dan transaksi POS lokal nyata sudah tersedia.
- [ ] Auth masih demo-grade dan belum production-grade.

### 4.4 AI-Assisted Development

- [x] File memori agent tersedia di `docs/LLM-Memory.md`.
- [x] Skill usage per sprint tersedia di `docs/Skill-Guide-by-Sprint-Hybrid-Omnichannel-Smart-POS.md`.
- [x] Multi-agent workflow tersedia di `docs/Multi-Agent-Workflow-Hybrid-Omnichannel-Smart-POS.md`.
- [x] Skill/security review memakai workflow `skill-scanner`.
- [ ] Skill pihak ketiga baru tetap harus direview sebelum dipakai.

## 5. Ringkasan Tahapan

| Sprint   | Fokus                               | Target utama                                                                               |
| -------- | ----------------------------------- | ------------------------------------------------------------------------------------------ |
| Sprint 0 | Foundation                          | Monorepo, desktop shell, backend skeleton, DB skeleton, auth dan sync skeleton             |
| Sprint 1 | Backend API dan Prisma Foundation   | Auth usable, master data API, Prisma schema/migration/seed awal                            |
| Sprint 2 | Local Data dan Hybrid Sync Backend  | SQLite/local schema, sync bundle, retry, idempotency, inventory ledger                     |
| Sprint 3 | Frontend POS Desktop                | Login UI, role shell, product/price read, cart, checkout lokal, shift dasar                |
| Sprint 4 | Dashboard, Reporting, dan Audit     | Dashboard cabang/pusat, report dasar, audit log, monitoring sync                           |
| Sprint 5 | Shopee Integration                  | Store connection, SKU mapping, webhook/order import, retry dan integration health          |
| Sprint 6 | AI Analytics Dasar                  | Low stock alert, stockout prediction sederhana, trend summary, confidence score            |
| Sprint 7 | MVP Hardening dan Release Readiness | E2E flow, seed demo, observability, security baseline, release candidate                   |
| Sprint 8 | Post-MVP Expansion                  | Marketplace tambahan, AI lanjutan, replenishment recommendation, export/reporting lanjutan |

## 6. Outcome Keseluruhan

Setelah seluruh tahapan MVP selesai, Omnia harus dapat:

- menjalankan transaksi POS cabang dari aplikasi desktop
- tetap mencatat transaksi dan stok saat offline
- menyinkronkan transaksi, payment record, stock movement, dan shift ke pusat
- mengelola produk, kategori, harga per cabang, user, role, cabang, dan register
- menampilkan dashboard cabang dan pusat
- menerima order Shopee melalui integrasi pusat
- memetakan SKU Shopee ke SKU internal
- menampilkan log sync, audit log, dan health monitoring dasar
- menghasilkan alert stok menipis dan prediksi stockout sederhana
- memenuhi acceptance criteria MVP dari PRD dan MVP document

## 7. Scope Keseluruhan

### 7.1 In Scope MVP

- authentication dan role-based access
- branch-scoped access
- POS transaction flow
- cart management
- payment record tanpa payment gateway langsung
- shift open/close dasar
- product catalog dan pricing per cabang
- inventory balance dan stock movement
- SQLite local store untuk operasi cabang
- sync queue lokal dan sync API pusat
- Redis + BullMQ untuk job pusat
- dashboard cabang dan dashboard pusat
- audit log dasar
- Shopee integration pertama
- AI analytics dasar
- monitoring sync dan integration health
- automated test minimum untuk flow kritis

### 7.2 Out of Scope MVP

- retur dan refund
- payment gateway langsung
- multi-marketplace penuh
- promo engine kompleks
- loyalty system
- procurement penuh
- accounting penuh
- multi-warehouse kompleks
- natural language analytics
- AI action otomatis
- dynamic pricing otomatis
- chat marketplace
- campaign management marketplace

## 8. Deliverables Keseluruhan

Deliverables utama:

- aplikasi desktop Omnia dapat dijalankan
- backend API pusat dapat dijalankan
- database PostgreSQL pusat aktif
- database SQLite lokal aktif
- Prisma schema dan migration berjalan
- Redis/BullMQ aktif untuk queue pusat
- auth, role, permission, dan branch scope berjalan
- POS checkout lokal berjalan
- sync bundle transaction berjalan
- dashboard pusat dan cabang menampilkan KPI dasar
- Shopee order dapat masuk sebagai order internal
- AI insight dasar muncul dari data pusat
- README dan runbook development tersedia
- `.env.example` lengkap
- Swagger/OpenAPI tersedia
- test dan smoke verification minimum tersedia

## 9. Sprint 0: Project Foundation

### Tujuan

Menyiapkan fondasi project sebelum fitur bisnis utama dikembangkan.

### Scope

- monorepo setup
- desktop app foundation
- backend NestJS skeleton
- PostgreSQL, Prisma, SQLite, Redis, dan BullMQ setup awal
- auth skeleton
- sync skeleton
- seed data dasar
- lint, format, typecheck, env setup, dan README awal

### Workstream

1. Repo and Tooling Setup
2. Desktop App Foundation
3. Backend Foundation
4. Database Foundation
5. Sync Foundation
6. Auth Foundation
7. Developer Experience and Quality
8. Seed Data and Demo Readiness

### Deliverables Sprint 0

- repo structure final awal
- desktop app dapat dijalankan
- backend API dapat dijalankan
- PostgreSQL terkoneksi
- Prisma schema awal aktif
- SQLite local setup aktif
- Redis queue aktif
- health check endpoint aktif
- auth login skeleton aktif
- product, branch, dan sync module skeleton aktif
- `.env.example` tersedia
- README setup dasar tersedia

### Checklist Sprint 0

- [x] desktop app bisa dijalankan
- [x] backend API bisa dijalankan
- [x] database pusat dan lokal siap dipakai
- [x] health check tersedia
- [x] login skeleton tersedia
- [x] sync endpoint skeleton tersedia
- [x] seed data dasar bisa dijalankan

Status saat ini:

- [x] Next.js + Electron shell tersedia.
- [x] Backend NestJS tersedia dengan endpoint health, auth, sync, products, dan branches skeleton.
- [x] PostgreSQL local tersedia via Docker Compose.
- [x] Redis tersedia via Docker Compose.
- [x] BullMQ sync queue skeleton tersedia.
- [x] Prisma schema dan migration SQL awal tersedia.
- [x] SQLite local schema tersedia.
- [x] AI worker skeleton tersedia.
- [x] README dan `.env.example` sudah mencakup setup local.
- [x] Deployment strategy, design guide, dan multi-agent workflow tersedia.
- [x] Validasi Sprint 0 terakhir berhasil: typecheck, lint, format check, build, seed, local DB init, dan backend smoke test.

### Definition of Done Sprint 0

- developer dapat menjalankan install dan startup project dari README
- desktop app dan backend dapat hidup secara lokal
- health endpoint merespons
- migration awal dan seed dasar dapat dijalankan
- module boundary awal sesuai arsitektur

## 10. Sprint 1: Backend API dan Prisma Foundation

### Tujuan

Menyiapkan backend pusat, Prisma, dan data inti terlebih dahulu agar frontend POS dibangun di atas kontrak API dan schema yang stabil.

### Scope

- Prisma setup untuk PostgreSQL pusat
- model awal user, role, branch, register, product, category, branch price
- model awal inventory, transaction, payment, shift, sync log, dan audit log
- migration awal
- seed role MVP, admin, branch, register, product, category, price, dan inventory minimum
- auth login backend usable
- endpoint `auth/me`
- endpoint master data awal
- validation schema backend
- response envelope dan error contract konsisten

### Out of Scope

- frontend POS final
- local SQLite final
- sync bundle final
- dashboard
- Shopee
- AI
- payment gateway
- retur

### Workstream

1. Prisma and PostgreSQL Foundation
2. Auth Backend
3. Master Data API
4. Inventory and Transaction Schema Base
5. Seed Data
6. API Validation and Error Contract

### Task

- setup Prisma di `apps/backend-api`
- buat schema PostgreSQL awal berdasarkan ERD dan roadmap
- buat migration awal
- buat database service yang siap memakai Prisma Client
- implement seed role MVP
- implement seed admin awal
- implement seed branch, register, category, product, branch price, dan inventory dummy
- implement login backend dengan password hashing awal
- implement token validation skeleton dan `auth/me`
- implement endpoint users, roles, branches, registers, products, categories, branch prices
- implement Zod schema untuk login dan master data request
- rapikan response envelope dan error code dasar

### Output

- backend punya koneksi Prisma/PostgreSQL
- schema inti tersedia
- migration awal tersedia
- seed dasar dapat dijalankan
- login backend dan `auth/me` siap dipakai frontend
- master data API siap dikonsumsi frontend POS

### Checklist Sprint 1

- [x] Prisma setup aktif
- [x] PostgreSQL connection aktif
- [x] Prisma schema awal dibuat
- [x] Migration awal dibuat
- [x] Prisma Client terhubung ke backend
- [x] Role seed aktif
- [x] Admin seed aktif
- [x] Branch seed aktif
- [x] Register seed aktif
- [x] Product seed aktif
- [x] Category seed aktif
- [x] Branch price seed aktif
- [x] Inventory seed aktif
- [x] Auth login backend usable
- [x] `auth/me` backend usable
- [x] Master data API awal aktif
- [x] Zod validation backend aktif

### Status Implementasi Sprint 1

Status per 2026-05-05:

- Prisma schema pusat sudah diperluas di `apps/backend-api/prisma/schema.prisma` untuk user, role, branch, register, category, product, variant, branch price, inventory balance, stock movement, shift, sales transaction, transaction item, payment, sales channel, sync job, sync log, dan audit log.
- Migration awal `apps/backend-api/prisma/migrations/20260505023000_init/migration.sql` sudah digenerate ulang dari Prisma schema dan berhasil diterapkan ke PostgreSQL lokal.
- Seed `apps/backend-api/prisma/seed.ts` sudah idempotent untuk role MVP, demo admin, cashier, supervisor, analyst, branch, register, category, product, branch price, inventory, stock movement awal, sales channel, dan shift demo.
- Auth backend sudah memakai Prisma user, password hash awal berbasis `scrypt`, token HMAC JWT sederhana, audit log login, dan guard bearer token.
- Zod sudah dipakai untuk validasi environment backend dan login request.
- Endpoint master data awal aktif: `GET /users`, `GET /roles`, `GET /products`, `GET /categories`, `GET /branches`, `GET /registers`, dan `GET /branches/{branch_id}/product-prices`.
- Smoke verification lokal berhasil: Docker PostgreSQL dan Redis healthy, Prisma validate lolos, migration status up to date, typecheck/build backend lolos, seed count terisi, login `demo.cashier` sukses, dan products endpoint mengembalikan data.
- Catatan lanjutan: auth masih level usable skeleton untuk Sprint 1 dan perlu hardening pada sprint berikutnya jika ingin memakai library JWT/password hashing production-grade.
- Review modularitas, validasi, Prisma schema, query, dan performa Sprint 1 terdokumentasi di `docs/Sprint-1-Backend-Scalability-Modularity-Knowledge.md`.

### Definition of Done Sprint 1

- backend dapat membaca/menulis data inti ke PostgreSQL
- migration dan seed berjalan dari script yang jelas
- frontend punya kontrak API stabil untuk login, products, categories, branches, registers, dan branch prices
- role dan branch scope awal tersedia di data model

### Artifact Sprint 1

- Prisma schema awal
- migration awal
- seed script
- auth backend skeleton usable
- master data API skeleton usable
- API validation schema

### Risiko Sprint 1

### Risiko 1

- schema terlalu cepat melebar sebelum flow MVP jelas.

Mitigasi:

- mulai dari entitas inti PRD/MVP dan simpan fitur lanjutan sebagai backlog.

### Risiko 2

- frontend mulai dibangun sebelum API contract stabil.

Mitigasi:

- kunci endpoint dan response minimum dulu sebelum UI POS masuk Sprint 3.

## 11. Sprint 2: Local Data dan Hybrid Sync Backend

### Tujuan

Menyiapkan fondasi local data dan sync backend agar POS frontend nantinya punya jalur offline-online yang jelas.

### Scope

- SQLite local schema design
- sync queue lokal design dan adapter skeleton
- transaction bundle sync
- stock movement sync
- payment record sync
- shift event sync
- inventory ledger pusat
- retry dan replay
- acknowledgement model
- central sync log
- idempotency
- conflict detection dasar
- inventory balance pusat dan lokal
- Redis + BullMQ sync queue

### Out of Scope

- POS UI final
- dashboard UI
- conflict resolution kompleks
- Shopee webhook
- AI prediction

### Workstream

1. Local SQLite Schema Design
2. Central Sync API
3. Transaction Bundle Processor
4. Inventory Ledger and Balance
5. Redis/BullMQ Sync Queue
6. Retry, Replay, and Idempotency

### Task

- buat local schema awal untuk users session, products cache, branch prices cache, inventory balances, stock movements, sales transactions, payments, shifts, dan sync queue
- buat tabel local sync queue
- buat status `pending`, `queued`, `processing`, `synced`, `failed`, `conflict`
- buat endpoint `POST /api/v1/sync/bundles`
- validasi envelope `event_id`, `event_type`, `branch_id`, `source_mode`, dan payload
- simpan idempotency key/event id di pusat
- proses transaction bundle sebagai unit konsisten
- update central inventory ledger dari stock movement valid
- buat acknowledgement response
- update status lokal berdasarkan acknowledgement
- buat retry dengan `attempt_count`, `last_attempt_at`, dan `next_retry_at`
- buat endpoint `GET /sync/jobs` dan `GET /sync/logs`
- buat worker skeleton BullMQ untuk `sync-bundle`

### Output

- local schema siap dipakai frontend Sprint 3
- transaksi offline punya target queue lokal yang jelas
- transaksi dapat dikirim ke pusat lewat bundle
- event duplicate tidak membuat transaksi ganda
- sync gagal tercatat
- inventory movement masuk ledger pusat

### Checklist Sprint 2

- [x] SQLite local schema dirancang
- [x] Local sync queue dibuat
- [x] Transaction bundle payload dibuat
- [x] `POST /sync/bundles` aktif
- [x] Event idempotency aktif
- [x] Duplicate event ditandai `duplicate_ignored`
- [x] Transaction bundle diproses konsisten
- [x] Payment record ikut bundle
- [x] Stock movement ikut bundle
- [x] Shift event dapat dikirim melalui kontrak generic sync event
- [x] Inventory ledger pusat aktif
- [x] BullMQ sync queue skeleton aktif
- [x] Retry policy dasar aktif
- [x] Replay saat online kembali disiapkan melalui local queue ordering dan retry fields
- [x] Acknowledgement contract tersedia untuk memperbarui status lokal
- [x] Sync jobs dapat dilihat
- [x] Sync logs dapat dilihat

### Status Implementasi Sprint 2

Status per 2026-05-05:

- SQLite local schema di `apps/desktop-app/local-store/schema.sql` sudah mencakup session lokal, cache produk/harga, inventory balance, stock movement ledger lokal, transaksi, item transaksi, payment, shift, dan persistent sync queue.
- Local sync queue sudah memiliki status lifecycle `pending`, `queued`, `processing`, `synced`, `failed`, dan `conflict` sebagai kontrak aplikasi, plus `attempt_count`, `last_attempt_at`, `next_retry_at`, `last_error_code`, `last_error_message`, `acknowledged_at`, dan `ack_status`.
- Backend sync API mengaktifkan `POST /api/v1/sync/bundles` untuk `transaction.bundle`, memakai Zod runtime parsing untuk envelope dan payload transaksi.
- Bundle transaksi diproses atomic dalam Prisma transaction: header transaksi, item, payment, stock movement, sync log, sync job, audit log, dan inventory balance pusat diterapkan sebagai satu unit.
- Idempotency memakai `event_id` dan `Idempotency-Key`; replay event yang sama mengembalikan acknowledgement `duplicate_ignored` tanpa membuat transaksi atau stok ganda.
- Inventory pusat mengikuti ledger `stock_movements`, menyimpan `quantity_before`, `quantity_after`, dan memperbarui snapshot `inventory_balances`.
- BullMQ queue `omnia.sync` memiliki producer dan worker skeleton untuk `sync.bundle.received`, dengan attempts, exponential backoff, retention policy, dan graceful shutdown.
- Monitoring dasar aktif melalui `GET /api/v1/sync/jobs` dan `GET /api/v1/sync/logs` dengan filter branch/status/job/log.
- Smoke verification lokal berhasil: bundle dummy tersinkron, duplicate replay menghasilkan `duplicate_ignored`, queue job `bundle-evt-smoke-sprint2-004` dibuat, dan log terbaru berstatus `applied`.

### Definition of Done Sprint 2

- transaction bundle dummy dari local schema dapat diterima pusat
- pusat tidak membuat duplikasi ketika event yang sama dikirim ulang
- setiap sync dapat ditelusuri lewat branch, event id, entity id, status, dan timestamp
- inventory balance pusat berubah berdasarkan stock movement yang valid
- frontend Sprint 3 punya local DB dan sync contract yang jelas

### Artifact Sprint 2

- sync bundle schema
- sync queue local schema
- sync job central schema
- idempotency table
- SQLite local schema notes
- BullMQ sync queue skeleton
- retry/replay runbook
- integration test sync bundle

### Risiko Sprint 2

### Risiko 1

- partial apply menyebabkan transaksi dan stok tidak konsisten.

Mitigasi:

- transaction bundle diproses dalam unit atomic di pusat.

### Risiko 2

- queue menumpuk saat cabang offline lama.

Mitigasi:

- tampilkan pending count dan last successful sync di UI monitoring.

## 12. Sprint 3: Frontend POS Desktop

### Tujuan

Membangun pengalaman POS desktop setelah backend, master data, local schema, dan sync contract siap.

### Scope

- login UI
- session restore memakai `auth/me`
- role-based shell
- branch context
- product catalog read
- branch price read
- cart management
- shift open/close dasar
- checkout lokal
- payment record cash/non-cash tercatat
- stock local update
- transaction number strategy
- sync status UI dasar

### Out of Scope

- dashboard pusat lengkap
- Shopee integration
- AI insight
- payment gateway
- retur
- sync conflict resolution kompleks

### Workstream

1. Auth and Session UI
2. Role-based Desktop Shell
3. Product and Pricing Read UI
4. POS Cart and Checkout
5. Shift and Register UI
6. Local Transaction Persistence
7. Sync Status UI

### Task

- implement login UI dan session state
- implement route guard berdasarkan role
- implement product list/search untuk POS
- implement branch price lookup
- implement cart add/remove/update quantity
- implement discount item dan transaction discount dasar
- implement tax field dasar jika dibutuhkan
- implement payment method record
- implement transaction number strategy per branch/register
- implement shift open/close UI
- simpan transaksi lokal ke SQLite
- kurangi stok lokal dari checkout
- masukkan transaction bundle ke local sync queue
- tampilkan sync status dasar

### Output

- kasir dapat login
- kasir dapat membuka shift
- kasir dapat mencari produk
- kasir dapat membuat cart
- kasir dapat menyelesaikan transaksi lokal
- transaksi tersimpan lokal
- payment record tersimpan lokal
- stok lokal berkurang
- event masuk sync queue lokal

### Checklist Sprint 3

- [x] Login UI berjalan
- [x] `auth/me` dipakai untuk session restore
- [x] Role-based menu dasar aktif
- [x] Branch context aktif
- [x] Product list dapat dibaca
- [x] Branch price dapat dibaca
- [x] Cart add/remove/update qty aktif
- [x] Discount item dasar aktif
- [ ] Discount transaksi dasar aktif
- [x] Payment method record aktif
- [x] Shift open aktif
- [x] Shift close aktif
- [x] Transaction number unik per branch/register
- [x] Transaksi tersimpan ke SQLite lokal
- [x] Stok lokal berkurang setelah checkout
- [x] Event transaksi masuk sync queue lokal
- [x] Sync status UI dasar aktif

### Status Implementasi Sprint 3

Status per 2026-05-05:

- Desktop app sudah direvisi dari placeholder page-level menjadi struktur modular berbasis domain di `apps/desktop-app/features`.
- Login UI sudah memanggil `POST /auth/login`, menyimpan session ke Zustand app state, dan mengarahkan user ke `/pos` saat berhasil.
- Session restore sudah memakai `GET /auth/me` saat token tersimpan tersedia.
- Role shell memakai state terpusat dengan menu berdasarkan role cashier, supervisor, HQ admin, dan executive.
- POS catalog memakai API-first read path ke `GET /products` dan `GET /branches/{branch_id}/product-prices`, dengan demo cache fallback agar flow cashier tetap bisa diuji saat backend tidak aktif.
- Cart state dipisah ke `features/pos/cart-store.ts` dengan add, decrement, remove, item discount, clear, payment method, payment status, dan amount received state.
- Checkout lokal membuat transaction record, payment record, stock movement payload, update inventory lokal, dan `transaction.bundle` sync queue record melalui Electron IPC/preload bridge ke SQLite.
- Cashier navigation sudah mengikuti arahan design dengan POS, Shift, Receipts, Inventory, dan Sync.
- Shift open/close UI dasar tersedia untuk mengubah shift state lokal, memakai active shift ID saat close, dan menampilkan pending sync warning.
- POS checkout sudah wajib berada dalam shift aktif.
- Receipt preview dasar tersedia dari transaksi lokal, menampilkan transaction number, item, subtotal, discount, tax, total, payment method, dan pending sync status.
- Sync status UI membaca queue lokal, menampilkan pending/failed summary untuk transaksi, shift, dan stock movement, serta menyediakan tabel event type, entity, created time, attempts, dan status.
- Supervisor inventory page sudah tersedia untuk local stock adjustment, low stock watch, reason code, dan stock movement history.
- Knowledge modularitas dan prosedur Sprint 3 tersedia di `docs/Sprint-3-Frontend-POS-Modularity-Knowledge.md`.
- Catatan lanjutan: role/permission UI masih dasar, receipt print fisik belum tersedia, dan manual smoke offline-online terbaru belum dijalankan setelah batch inventory.

### Definition of Done Sprint 3

- kasir dapat menyelesaikan transaksi lokal end-to-end
- checkout tidak bergantung pada dashboard, Shopee, atau AI
- semua transaksi minimal punya branch, register, cashier, timestamp, item, total, dan payment status
- flow utama diuji dengan seed produk dan branch dummy
- event checkout siap disinkronkan lewat contract Sprint 2

### Artifact Sprint 3

- POS transaction local implementation
- cart state implementation
- shift UI
- receipt data model
- sync status UI
- smoke test checkout lokal

### Risiko Sprint 3

### Risiko 1

- POS UI terlalu berat untuk kasir.

Mitigasi:

- fokus pada flow cepat dan layout utilitarian.

### Risiko 2

- transaction number tidak konsisten antar mode online/offline.

Mitigasi:

- gunakan prefix branch/register dan UUID/global ID untuk deduplication.

## 13. Sprint 4: Dashboard, Reporting, dan Audit

### Tujuan

Memberi visibilitas operasional untuk supervisor, HQ admin, dan executive berdasarkan data pusat yang sudah terkonsolidasi.

### Scope

- dashboard cabang
- dashboard pusat
- sales summary
- inventory alert report
- top selling products
- slow moving products
- payment method summary
- audit log dasar
- branch sync health
- integration health placeholder
- reporting aggregation job dasar
- dashboard UI role-based

### Out of Scope

- export PDF/XLSX final
- analytics AI prediction
- Shopee real webhook processing
- laporan accounting

### Workstream

1. Dashboard API
2. Reporting Query and Aggregation
3. Audit Log
4. Monitoring API
5. Role-based Dashboard UI

### Task

- implement `GET /dashboard/branch`
- implement `GET /dashboard/central`
- implement `GET /reports/sales-summary`
- implement `GET /reports/inventory-alerts`
- buat aggregation job dasar untuk KPI
- buat audit log untuk login, transaksi, stok, harga, sync
- buat `GET /audit/logs`
- buat `GET /monitoring/branches/sync-health`
- tampilkan dashboard sesuai role
- tampilkan filter periode dan cabang

### Output

- supervisor dapat melihat dashboard cabang
- HQ admin dapat melihat dashboard pusat
- executive/analyst dapat melihat KPI pusat read-only
- audit log dapat ditelusuri
- health sync cabang terlihat

### Checklist Sprint 4

- [ ] Dashboard cabang aktif
- [ ] Dashboard pusat aktif
- [ ] Sales summary aktif
- [ ] Inventory alert report aktif
- [ ] Top selling products aktif
- [ ] Slow moving products aktif
- [ ] Payment method summary aktif
- [ ] Filter tanggal aktif
- [ ] Filter cabang aktif
- [ ] Audit log login aktif
- [ ] Audit log transaksi aktif
- [ ] Audit log stok aktif
- [ ] Audit log harga aktif
- [x] Audit log sync aktif
- [x] Branch sync health aktif
- [ ] Dashboard UI role-based aktif

### Status Implementasi Sprint 4

Status per 2026-05-05:

- Dashboard cabang, dashboard pusat, sales summary, reporting KPI, filter periode/cabang, dan dashboard UI role-based belum tersedia.
- Audit log sudah ditulis oleh login, transaction bundle sync, shift sync, dan stock movement sync.
- Monitoring sync dasar sudah tersedia melalui `GET /api/v1/sync/jobs` dan `GET /api/v1/sync/logs`; ini memenuhi branch sync health awal, tetapi belum berupa dashboard health khusus.
- Backend inventory read endpoint awal sudah tersedia melalui `GET /api/v1/inventory/balances`, `GET /api/v1/inventory/movements`, dan `GET /api/v1/inventory/stock-movements`.
- Implementasi saat ini memajukan sebagian scope operasional Sprint 4, tetapi dashboard/reporting penuh tetap belum dimulai.

### Definition of Done Sprint 4

- dashboard tidak membaca langsung dari local store cabang
- KPI utama tampil dari central DB atau hasil agregasi pusat
- role cashier tidak melihat dashboard pusat
- audit log aksi sensitif tersimpan dengan user, waktu, cabang, action, dan entity

### Artifact Sprint 4

- dashboard API response schema
- audit log schema
- monitoring endpoint
- dashboard wireframe implemented
- report query notes

### Risiko Sprint 4

### Risiko 1

- query dashboard mengganggu transaksi.

Mitigasi:

- gunakan query/agregasi pusat dan jangan menjalankan reporting di jalur checkout.

### Risiko 2

- role boundary bocor di UI.

Mitigasi:

- authorization tetap dicek backend, bukan hanya menu frontend.

## 14. Sprint 5: Shopee Integration

### Tujuan

Menghubungkan marketplace pertama ke sistem pusat tanpa mengganggu POS core.

### Scope

- Shopee store connection skeleton
- product channel mapping
- webhook receiver
- order import
- online order internal model
- idempotency webhook
- integration retry
- integration error log
- stock sync dasar ke Shopee jika credential dan sandbox siap
- integration monitoring UI

### Out of Scope

- multi-marketplace
- chat marketplace
- campaign management
- ads
- payment gateway marketplace penuh
- dynamic pricing dua arah

### Workstream

1. Shopee Account and Store
2. SKU Mapping
3. Webhook and Order Import
4. Integration Queue and Retry
5. Stock Sync Base
6. Integration Monitoring

### Task

- implement `POST /integrations/shopee/stores`
- implement `GET /integrations/shopee/stores`
- implement `POST /integrations/shopee/product-mappings`
- implement `GET /integrations/shopee/product-mappings`
- implement `POST /webhooks/shopee/orders`
- validasi webhook dan idempotency
- mapping SKU Shopee ke produk internal
- buat `online_orders` dan `online_order_items`
- buat retry job untuk webhook gagal
- buat error handling untuk mapping SKU tidak ditemukan
- implement `GET /integrations/shopee/orders`
- implement `GET /monitoring/integrations/shopee`

### Output

- HQ admin dapat membuat mapping SKU Shopee
- order Shopee dapat masuk sebagai order internal
- webhook duplicate tidak membuat order ganda
- error mapping tercatat
- integrasi gagal tidak mengganggu checkout POS

### Checklist Sprint 5

- [ ] Shopee store model aktif
- [ ] Store connection skeleton aktif
- [ ] Product mapping aktif
- [ ] Mapping status aktif
- [ ] Webhook receiver aktif
- [ ] Webhook validation dasar aktif
- [ ] Webhook idempotency aktif
- [ ] Online order model aktif
- [ ] Online order item model aktif
- [ ] Import order Shopee aktif
- [ ] Mapping SKU gagal masuk error log
- [ ] Retry failed webhook aktif
- [ ] Integration health aktif
- [ ] Integration monitoring UI aktif
- [ ] Stock sync dasar disiapkan

### Definition of Done Sprint 5

- satu order Shopee dummy/sandbox dapat masuk ke sistem internal
- order duplicate diabaikan atau diack aman
- mapping SKU internal ke eksternal dapat dikelola
- error integrasi bisa dilihat dan diretry oleh HQ admin

### Artifact Sprint 5

- Shopee integration module
- product channel mapping schema
- online order schema
- webhook processing test
- integration runbook

### Risiko Sprint 5

### Risiko 1

- webhook duplicate membuat order ganda.

Mitigasi:

- gunakan external order id, event reference, dan idempotency store.

### Risiko 2

- mapping SKU salah mengganggu stok.

Mitigasi:

- order dengan mapping gagal ditahan untuk review, bukan diterapkan diam-diam.

## 15. Sprint 6: AI Analytics Dasar

### Tujuan

Menyediakan insight operasional awal dari data pusat tanpa memberi AI hak mengubah data bisnis.

### Scope

- AI worker/service skeleton
- data extraction dari central DB atau aggregate table
- low stock alert
- stockout prediction sederhana
- sales trend per branch
- sales trend per SKU/category
- slow moving dan fast moving analysis
- confidence score
- AI insight API
- AI insight UI

### Out of Scope

- natural language analytics
- automated restock action
- automated pricing
- model kompleks
- LLM wajib

### Workstream

1. AI Worker Foundation
2. Analytics Dataset Preparation
3. Low Stock Alert
4. Stockout Prediction
5. Trend and Movement Analysis
6. Insight Delivery

### Task

- bootstrap Python worker/service
- buat contract input/output AI insight
- buat scheduled job untuk generate insight
- implement low stock alert berdasarkan threshold
- implement stockout prediction sederhana berdasarkan sales velocity
- implement trend summary per branch dan SKU/category
- simpan insight ke central DB
- tampilkan `confidence_score`
- implement `GET /ai/insights`
- implement `GET /ai/insights/low-stock`
- implement `GET /ai/insights/stockout-predictions`
- tampilkan AI insight untuk HQ Admin dan Executive/Analyst

### Output

- alert stok menipis muncul
- prediksi stockout sederhana muncul
- trend summary dasar muncul
- insight punya confidence score
- AI tidak mengubah stok, harga, atau order

### Checklist Sprint 6

- [ ] AI worker skeleton aktif
- [ ] Dataset transaksi bisa dibaca
- [ ] Dataset inventory bisa dibaca
- [ ] Low stock alert aktif
- [ ] Stockout prediction sederhana aktif
- [ ] Trend per branch aktif
- [ ] Trend per SKU/category aktif
- [ ] Slow moving analysis aktif
- [ ] Fast moving analysis aktif
- [ ] Confidence score aktif
- [ ] Insight tersimpan ke DB pusat
- [ ] AI insights API aktif
- [ ] AI insights UI aktif
- [ ] AI job failure tercatat

Catatan status:

- AI worker skeleton sudah tersedia dari Sprint 0 sebagai fondasi runtime, tetapi pipeline AI insight Sprint 6 belum diimplementasikan. Karena checklist Sprint 6 mengacu pada fitur analytics aktif, item AI worker tetap belum ditandai selesai untuk sprint ini.

### Definition of Done Sprint 6

- insight dihasilkan dari data pusat yang sudah tersinkron
- AI insight tampil sebagai rekomendasi, bukan aksi otomatis
- setiap insight memiliki tipe, summary, confidence, generated_at, dan reference data minimum
- jika data belum cukup, sistem menampilkan status data belum siap

### Artifact Sprint 6

- AI worker skeleton
- insight schema
- stockout prediction baseline
- AI job runbook
- sample insight dataset

### Risiko Sprint 6

### Risiko 1

- prediksi salah karena data historis sedikit.

Mitigasi:

- tampilkan confidence score dan minimum data threshold.

### Risiko 2

- AI worker menambah kompleksitas runtime.

Mitigasi:

- batasi worker hanya untuk analytics dasar dan contract sederhana.

## 16. Sprint 7: MVP Hardening dan Release Readiness

### Tujuan

Menstabilkan MVP agar siap demo, UAT, dan validasi operasional.

### Scope

- end-to-end flow validation
- role permission review
- security baseline
- observability baseline
- backup/recovery notes
- seed demo lengkap
- smoke test dan regression test
- README final MVP
- runbook deployment/local ops
- bug fixing prioritas

### Out of Scope

- fitur baru besar
- marketplace tambahan
- AI lanjutan
- final production hardening enterprise-grade

### Workstream

1. E2E Flow Verification
2. Security and Permission Review
3. Observability and Error Handling
4. Demo Data and UAT Readiness
5. Documentation and Runbook
6. Release Candidate Stabilization

### Task

- validasi flow cashier end-to-end
- validasi flow supervisor inventory
- validasi flow HQ admin master data, sync, dan Shopee
- validasi flow executive dashboard dan AI
- review permission endpoint dan UI
- review branch scoping
- review audit log coverage
- setup Sentry/logging jika dipakai
- buat seed demo multi-branch
- buat smoke test Playwright untuk flow utama
- buat backend integration test untuk sync bundle
- finalisasi README dan runbook

### Output

- MVP release candidate siap
- demo data siap
- flow utama dapat diuji berulang
- bug kritis diketahui dan ditutup
- dokumentasi setup dan runbook cukup jelas

### Checklist Sprint 7

- [ ] Cashier E2E flow lolos
- [ ] Supervisor inventory flow lolos
- [ ] HQ admin master data flow lolos
- [ ] HQ admin Shopee flow lolos
- [ ] Executive dashboard flow lolos
- [ ] AI insight flow lolos
- [ ] Permission endpoint direview
- [ ] Branch scoping direview
- [ ] Audit coverage direview
- [ ] Sync failure handling direview
- [ ] Seed demo lengkap
- [ ] README MVP final
- [ ] Runbook local ops final
- [ ] Smoke test utama aktif
- [ ] Known critical bugs ditutup

### Definition of Done Sprint 7

- demo MVP bisa dijalankan dari clean setup
- semua role MVP punya flow yang bisa diuji
- tidak ada bug kritis pada checkout, local write, sync, dan login
- dokumentasi cukup untuk developer baru menjalankan project
- MVP siap masuk UAT atau demo stakeholder

### Artifact Sprint 7

- UAT checklist
- release candidate notes
- seed demo script
- smoke test suite
- runbook MVP
- known issues log

### Risiko Sprint 7

### Risiko 1

- terlalu banyak scope baru masuk saat hardening.

Mitigasi:

- freeze fitur besar dan fokus pada bug, test, dan readiness.

### Risiko 2

- demo gagal karena setup lokal rapuh.

Mitigasi:

- siapkan seed idempotent, `.env.example`, dan runbook langkah demi langkah.

## 17. Sprint 8: Post-MVP Expansion

### Tujuan

Menyiapkan pengembangan setelah MVP tervalidasi.

### Scope

- marketplace tambahan
- AI lanjutan
- replenishment recommendation
- export report CSV/XLSX/PDF
- improved conflict resolution
- payment gateway planning
- return/refund discovery
- performance optimization

### Out of Scope

- dilakukan sebelum MVP stabil
- perubahan besar pada POS core tanpa evaluasi data UAT

### Workstream

1. Marketplace Expansion
2. Advanced AI and Replenishment
3. Reporting Export
4. Conflict Resolution Upgrade
5. Payment and Return Discovery
6. Scale and Performance

### Output

- backlog post-MVP terprioritaskan
- keputusan marketplace berikutnya jelas
- rekomendasi restock mulai dirancang
- report export siap dikembangkan
- payment/return masuk discovery teknis dan produk

### Checklist Sprint 8

- [ ] Evaluasi hasil UAT MVP selesai
- [ ] Marketplace berikutnya dipilih
- [ ] Payment gateway discovery selesai
- [ ] Return/refund discovery selesai
- [ ] Replenishment recommendation dirancang
- [ ] Advanced AI backlog dibuat
- [ ] Export report backlog dibuat
- [ ] Performance bottleneck utama diukur
- [ ] Conflict resolution lanjutan dirancang

### Definition of Done Sprint 8

- post-MVP roadmap disepakati berdasarkan data pemakaian MVP
- tidak ada ekspansi yang mengorbankan stabilitas POS core
- backlog lanjutan memiliki prioritas, acceptance criteria, dan dependency yang jelas

## 18. Module Target per Tahapan

| Module                      | Sprint target                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| Auth                        | Sprint 0 skeleton, Sprint 1 backend usable, Sprint 3 frontend session, Sprint 7 review                |
| Users/Roles                 | Sprint 1 schema/seed/API, Sprint 3 role routing, Sprint 7 permission review                           |
| Branches/Registers          | Sprint 1 schema/API, Sprint 3 branch context                                                          |
| Products/Categories/Pricing | Sprint 1 schema/API, Sprint 3 POS read                                                                |
| POS Transactions            | Sprint 1 schema, Sprint 2 sync contract, Sprint 3 frontend core, Sprint 7 hardening                   |
| Payments                    | Sprint 1 schema, Sprint 2 sync contract, Sprint 3 frontend record                                     |
| Shifts                      | Sprint 1 schema, Sprint 2 sync contract, Sprint 3 frontend base                                       |
| Inventory                   | Sprint 1 schema, Sprint 2 ledger/sync, Sprint 3 local update, Sprint 4 reports                        |
| Sync                        | Sprint 0 skeleton, Sprint 2 full backend/local contract, Sprint 3 frontend status, Sprint 7 hardening |
| Dashboard                   | Sprint 4                                                                                              |
| Audit                       | Sprint 4, Sprint 7 review                                                                             |
| Shopee                      | Sprint 5                                                                                              |
| AI Insights                 | Sprint 6                                                                                              |
| Monitoring                  | Sprint 4 sync health, Sprint 5 integration health, Sprint 7 baseline                                  |

## 19. API Target per Tahapan

### Sprint 0

- `GET /health`
- `POST /auth/login` skeleton
- `GET /auth/me` skeleton
- `POST /sync/bundles` skeleton

### Sprint 1

- `POST /auth/login`
- `GET /auth/me`
- `GET /users`
- `GET /roles`
- `GET /products`
- `GET /categories`
- `GET /branches`
- `GET /registers`
- `GET /branches/{branch_id}/product-prices`

### Sprint 2

- `POST /sync/bundles`
- `POST /sync/events`
- `GET /sync/jobs`
- `GET /sync/logs`
- `GET /sync/master-data`
- `GET /sync/conflict-resolutions`

### Sprint 3

- local POS write path
- local checkout queue write
- frontend calls to `auth/me`, `products`, `categories`, `branches`, `registers`, and branch prices

### Sprint 4

- `GET /dashboard/branch`
- `GET /dashboard/central`
- `GET /reports/sales-summary`
- `GET /reports/inventory-alerts`
- `GET /audit/logs`
- `GET /monitoring/branches/sync-health`

### Sprint 5

- `POST /integrations/shopee/stores`
- `GET /integrations/shopee/stores`
- `POST /integrations/shopee/product-mappings`
- `GET /integrations/shopee/product-mappings`
- `GET /integrations/shopee/orders`
- `POST /webhooks/shopee/orders`
- `POST /integrations/shopee/jobs/{job_id}/retry`
- `GET /monitoring/integrations/shopee`

### Sprint 6

- `GET /ai/insights`
- `GET /ai/insights/low-stock`
- `GET /ai/insights/stockout-predictions`

## 20. Data Target per Tahapan

### Sprint 0

- users
- roles
- branches
- products
- categories
- sync_jobs skeleton
- sync_logs skeleton

### Sprint 1

- users
- roles
- branches
- registers
- products
- categories
- branch_product_prices
- inventory_balances central
- sales_transactions central schema
- sales_transaction_items central schema
- payments central schema
- shifts central schema
- audit_logs skeleton

### Sprint 2

- local user session schema
- local product cache schema
- local branch price cache schema
- local inventory_balances schema
- local sales_transactions schema
- local sales_transaction_items schema
- local payments schema
- local shifts schema
- local sync_queue schema
- central sales_transactions
- central sales_transaction_items
- central payments
- central stock_movements
- idempotency/events
- sync acknowledgement
- conflict records dasar

### Sprint 3

- local POS transaction data
- local cart/session state
- local sync queue records

### Sprint 4

- audit_logs
- dashboard aggregates
- report query views
- branch sync health snapshot

### Sprint 5

- marketplace_accounts
- marketplace_stores
- product_channel_mappings
- online_orders
- online_order_items
- webhook_events
- integration_jobs/logs

### Sprint 6

- ai_insights
- insight_generation_jobs
- analytics aggregates

## 21. Quality Gate per Sprint

| Sprint   | Quality gate minimum                                                             |
| -------- | -------------------------------------------------------------------------------- |
| Sprint 0 | install, lint/typecheck dasar, app/backend health smoke                          |
| Sprint 1 | Prisma validation, migration/seed check, backend auth/master data smoke          |
| Sprint 2 | local schema review, sync bundle integration test, idempotency test, retry test  |
| Sprint 3 | checkout lokal smoke, local DB write verification, sync queue write verification |
| Sprint 4 | dashboard role access test, audit log test                                       |
| Sprint 5 | webhook duplicate test, mapping error test, retry test                           |
| Sprint 6 | insight generation test, insufficient data test                                  |
| Sprint 7 | E2E role flow, regression smoke, release checklist                               |
| Sprint 8 | discovery artifacts dan backlog readiness                                        |

## 22. Rekomendasi Urutan Pengerjaan Keseluruhan

Urutan paling aman:

1. selesaikan Sprint 0 foundation
2. selesaikan backend API, Prisma schema, migration, dan seed inti
3. stabilkan local schema dan sync transaction bundle
4. buat POS local flow di frontend setelah API dan local contract jelas
5. bangun dashboard dari data pusat yang sudah tersinkron
6. integrasikan Shopee setelah product mapping dan stock model stabil
7. jalankan AI setelah data transaksi dan inventory sudah terkonsolidasi
8. lakukan hardening MVP sebelum ekspansi post-MVP

## 23. Risiko Lintas Sprint

### Risiko 1

- POS core terganggu oleh dashboard, integrasi, atau AI.

Mitigasi:

- pisahkan jalur checkout dari proses berat dan gunakan queue.

### Risiko 2

- sync offline-online tidak stabil.

Mitigasi:

- gunakan local queue persisten, idempotency, retry, replay, dan audit log sejak Sprint 2.

### Risiko 3

- data stok tidak konsisten.

Mitigasi:

- gunakan stock movement ledger, reason code, actor, dan central reconciliation.

### Risiko 4

- integrasi Shopee gagal atau duplicate.

Mitigasi:

- gunakan webhook idempotency, retry queue, dead-letter/error log, dan mapping review.

### Risiko 5

- AI insight terlalu dipercaya walau data belum cukup.

Mitigasi:

- tampilkan confidence score, minimum data threshold, dan label advisory.

### Risiko 6

- scope melebar sebelum MVP stabil.

Mitigasi:

- kunci out-of-scope MVP dan pindahkan ekspansi ke Sprint 8.

## 24. Checklist Keseluruhan MVP

- [x] Sprint 0 foundation selesai
- [x] Backend NestJS structure Sprint 0 dibuat
- [x] Backend module boundary awal dibuat
- [x] Backend API dan Prisma foundation selesai
- [x] Local data dan hybrid sync backend selesai
- [x] Frontend POS desktop selesai
- [x] POS checkout lokal berjalan
- [x] Product catalog dan branch price berjalan
- [x] Shift dasar berjalan
- [x] Inventory local update berjalan
- [x] Sync queue lokal berjalan
- [x] Sync bundle ke pusat berjalan
- [x] Retry/replay berjalan
- [x] Idempotency berjalan
- [ ] Dashboard cabang berjalan
- [ ] Dashboard pusat berjalan
- [x] Audit log dasar berjalan
- [x] Sync health monitoring berjalan
- [ ] Shopee store skeleton berjalan
- [ ] SKU mapping Shopee berjalan
- [ ] Shopee order import berjalan
- [ ] Integration error log berjalan
- [ ] AI low stock alert berjalan
- [ ] AI stockout prediction sederhana berjalan
- [ ] Role access diuji
- [ ] Branch scoping diuji
- [ ] E2E flow role utama diuji
- [ ] README dan runbook siap
- [ ] Seed demo lengkap

## 25. Artifact yang Sebaiknya Dihasilkan

- Sprint 0 foundation artifacts
- POS local transaction schema
- sync bundle schema dan sample payload
- OpenAPI/Swagger draft
- Prisma schema dan migrations
- SQLite local schema
- seed demo script
- dashboard API contract
- audit log schema
- Shopee integration runbook
- AI worker contract
- E2E smoke test suite
- UAT checklist
- MVP release notes

## 26. Kesimpulan

Roadmap sprint ini membagi implementasi Omnia menjadi tahapan yang menjaga prioritas utama produk: POS cabang harus stabil dan local-first, sementara sync, dashboard, Shopee, dan AI tumbuh di atas fondasi yang auditable dan asynchronous.

Target MVP bukan membangun semua fitur enterprise, tetapi membuktikan bahwa Omnia dapat menjalankan transaksi cabang, menyinkronkan data ke pusat, memberi visibilitas dashboard, menerima order Shopee, dan menghasilkan AI insight dasar tanpa mengganggu checkout.
