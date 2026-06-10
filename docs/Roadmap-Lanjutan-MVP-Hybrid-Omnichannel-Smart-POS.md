# Roadmap Lanjutan MVP

> Catatan scope terbaru 2026-06-09: dokumen ini adalah roadmap historis.
> Source of truth terbaru ada di `docs/10-implementation-roadmap.md`,
> `docs/12-actual-status.md`, dan `.agents/sessionImplementation.md`.
> Integrasi Shopee tidak lagi menjadi scope aktif MVP. Target AI berubah dari
> insight rule-based dasar menjadi LLM provider integration dengan structured
> output, API key server-side, dan advisory-only guardrails.

## 1. Informasi Dokumen

- Nama produk: Omnia
- Nama dokumen: Roadmap Lanjutan MVP
- Versi: 1.0
- Tanggal: 2026-05-05
- Tujuan akhir: membangun sistem POS hybrid omnichannel yang benar-benar bisa dijalankan dengan baik untuk kebutuhan MVP
- Referensi:
  - `docs/PRD-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/MVP-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/Sprint-0-Plan-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/High-Level-Architecture-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/ERD-Awal-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/Sync-Specification-Detail-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/API-Contract-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/Technical-Stack-Decision-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/Multi-Agent-Workflow-Hybrid-Omnichannel-Smart-POS.md`

## 2. Ringkasan Roadmap

Roadmap ini melanjutkan Sprint 0. Sprint 0 berfokus pada fondasi teknis, sedangkan sprint setelahnya berfokus pada fitur bisnis utama sampai Omnia bisa dipakai sebagai POS MVP yang runnable.

Target akhir MVP:

- aplikasi desktop Omnia dapat dibuka dan digunakan oleh role utama
- kasir dapat login, membuka shift, mencari produk, membuat transaksi, mencatat pembayaran, dan mencetak struk
- stok cabang otomatis berkurang dari transaksi dan dapat disesuaikan oleh supervisor
- transaksi tetap bisa dicatat saat offline melalui local database
- data transaksi dan stok dapat disinkronkan ke backend pusat saat koneksi kembali
- HQ dapat melihat dashboard dasar, mengelola master data, dan memantau status sync
- integrasi Shopee MVP dapat melakukan mapping SKU dan import order dasar
- LLM insight dapat menampilkan alert stok menipis, risiko stockout, tren penjualan, anomali, dan rekomendasi operasional dari data pusat

## 3. Prinsip Pengerjaan

- Selesaikan fondasi Sprint 0 sebelum masuk ke fitur bisnis besar.
- Prioritaskan POS core dan local-first workflow sebelum dashboard, Shopee, dan AI.
- Setiap sprint harus menghasilkan aplikasi yang tetap bisa dijalankan.
- Jangan membangun fitur lanjutan sebelum data model, sync, dan auth cukup stabil.
- Fokus MVP adalah alur operasional yang berjalan, bukan fitur enterprise lengkap.
- Setiap sprint memakai multi-agent workflow dengan PM sebagai orchestrator dan PM final report wajib di akhir pekerjaan.

## 4. Roadmap Sprint

### Sprint 0: Foundation dan Project Setup

Tujuan:

- menyiapkan fondasi repo, aplikasi, backend, database, auth skeleton, sync skeleton, dan developer workflow.

Scope utama:

- monorepo dan package management
- desktop app foundation
- backend API foundation
- PostgreSQL dan Prisma foundation
- SQLite local database foundation
- Redis dan BullMQ foundation
- auth skeleton
- sync skeleton
- seed data dasar
- README dan environment setup

Definition of Done:

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
- [x] CI/CD GitHub Actions sudah tersedia untuk validasi, build image backend, publish GHCR, dan deploy backend ke home server self-hosted runner.
- [ ] UI belum diimplementasikan dari Figma secara final.
- [ ] Auth masih demo-grade dan belum production-grade.
- [x] Sync apply logic untuk `transaction.bundle` sudah menyimpan transaksi, payment, stock movement, sync job, sync log, dan audit log ke backend pusat.
- [x] POS transaction lokal sudah tersedia melalui SQLite local-first dan sync queue.
- [x] Inventory adjustment MVP tersedia secara local-first dengan sync `stock_movement.created`.
- [ ] Fitur lanjutan POS, inventory stock opname kompleks, dashboard, Shopee, dan AI insight masih lanjut ke sprint berikutnya.

Catatan status:

- Implementasi saat ini sudah maju parsial ke Sprint 1-4, khususnya login demo, master data API, POS local-first, shift dasar, inventory adjustment MVP, receipt preview, sync status, replay transaksi/shift/stock movement, apply transaction bundle, apply shift event, dan apply stock movement event ke central DB.

### Sprint 1: Auth, Role, Master Data, dan Local Store

Tujuan:

- membuat user bisa login dan menyiapkan data dasar yang dibutuhkan POS.

Scope utama:

- implement login, logout, dan `auth/me`
- implement JWT access token dan guard backend
- implement role MVP: cashier, store supervisor, hq admin, executive analyst
- implement branch dan register dasar
- implement product, category, SKU, barcode, dan branch pricing dasar
- implement local SQLite schema untuk cache produk, harga, stok, session, dan sync queue
- implement seed role, user, branch, register, product, category, price, dan inventory
- implement layout aplikasi berbasis role

Deliverables:

- user dapat login dari desktop app
- menu tampil sesuai role
- data produk dan harga dapat dimuat untuk cabang
- local database sudah memiliki cache data minimum untuk POS

Definition of Done:

- login berhasil untuk semua role demo
- role guard backend berjalan
- frontend routing berbasis role berjalan
- seed data dapat dipakai untuk demo awal

Status implementasi saat ini:

- [x] Login desktop dan backend `POST /api/v1/auth/login` sudah berjalan untuk user demo.
- [x] `GET /api/v1/auth/me` sudah tersedia dengan bearer auth guard.
- [x] Token auth sudah membawa user, role, branch, dan expiry, tetapi implementasinya masih demo-grade/manual HMAC.
- [x] Role MVP sudah tersedia dari seed dan dipakai di session/layout dasar desktop.
- [x] Branch, register, product, branch price, dan inventory seed/master API dasar sudah tersedia.
- [x] Local SQLite schema sudah mencakup produk, inventory balance, transaksi, payment, stock movement, shift, dan sync queue.
- [ ] Permission matrix dan routing berbasis role belum production-grade.
- [ ] Logout/session lifecycle belum lengkap untuk kebutuhan produksi.

### Sprint 2: POS Core Online dan Transaksi Lokal

Tujuan:

- membuat alur kasir utama dapat digunakan untuk transaksi penjualan dasar.

Scope utama:

- implement layar POS kasir
- implement search produk dan input barcode manual
- implement cart management
- implement diskon item dan diskon transaksi sederhana
- implement pajak sederhana
- implement payment method record
- implement sales transaction, transaction item, dan payment record di local SQLite
- implement pengurangan stok lokal dari transaksi
- implement receipt preview atau print skeleton
- implement audit log lokal untuk transaksi

Deliverables:

- kasir dapat membuat transaksi dari produk seed
- transaksi tersimpan lokal
- stok lokal berkurang setelah transaksi
- struk dapat ditampilkan atau disiapkan untuk print

Definition of Done:

- satu flow checkout dapat selesai dari login sampai transaksi tersimpan
- transaksi tetap tercatat walau backend tidak tersedia
- data transaksi lokal dapat dilihat untuk kebutuhan debug/demo

Status implementasi saat ini:

- [x] Layar POS kasir sudah tersedia di desktop.
- [x] Search produk mendukung nama, SKU, barcode, dan kategori.
- [x] Cart management dasar sudah tersedia.
- [x] Diskon item dan pajak sederhana sudah dihitung di checkout lokal.
- [x] Payment method dan payment status sudah dicatat.
- [x] Sales transaction, transaction item, payment, dan stock movement sudah tersimpan di SQLite lokal.
- [x] Stok lokal berkurang dari transaksi POS.
- [x] Receipt preview/history lokal sudah tersedia.
- [x] Checkout sudah diwajibkan berada dalam shift aktif.
- [ ] Receipt print fisik belum tersedia.
- [ ] Audit log lokal khusus transaksi belum dibuat sebagai tabel/fitur terpisah.

### Sprint 3: Shift, Inventory, dan Operasional Cabang

Tujuan:

- melengkapi kebutuhan operasional harian cabang di sekitar kasir dan stok.

Scope utama:

- implement buka dan tutup kas atau shift
- implement validasi transaksi harus berada dalam shift aktif
- implement stok masuk manual
- implement stock adjustment
- implement stock movement history
- implement low stock threshold dasar
- implement halaman supervisor untuk ringkasan penjualan cabang dan stok kritis
- implement permission supervisor untuk adjustment stok

Deliverables:

- kasir dapat membuka dan menutup shift
- supervisor dapat melihat dan menyesuaikan stok cabang
- stock movement tercatat untuk transaksi dan adjustment

Definition of Done:

- semua perubahan stok menghasilkan stock movement
- shift aktif tercatat pada transaksi
- supervisor dapat melakukan adjustment tanpa akses fitur HQ penuh

Status implementasi saat ini:

- [x] Buka shift dan tutup shift dasar sudah tersedia di desktop.
- [x] Close shift memakai active shift ID dan tidak membuat shift baru saat tidak ada shift aktif.
- [x] POS checkout ditolak/disabled jika belum ada shift aktif.
- [x] Shift aktif tersimpan pada transaksi lokal.
- [x] Supervisor inventory page sudah tersedia untuk melihat stok, low stock watch, adjustment plus/minus, reason code, dan history lokal.
- [x] Stock adjustment lokal membuat stock movement dan mengubah inventory balance lokal.
- [x] Backend inventory balance dan stock movement history endpoint awal sudah tersedia.
- [ ] Permission supervisor masih berbasis UI/session dasar, belum full RBAC.
- [ ] Stock opname kompleks belum tersedia.
- [ ] Ringkasan penjualan cabang untuk supervisor belum menjadi dashboard/reporting penuh.

### Sprint 4: Sync Offline-Online

Tujuan:

- membuat data penting dari cabang dapat disinkronkan ke pusat secara asynchronous.

Scope utama:

- implement local sync event generation untuk transaction, payment, stock movement, dan shift
- implement local sync queue status: pending, queued, processing, synced, failed, conflict
- implement endpoint backend untuk menerima sync bundle
- implement idempotency berbasis event ID
- implement acknowledgement response
- implement retry dasar
- implement sync log di backend
- implement halaman sync status di desktop app
- implement conflict status dasar tanpa resolver kompleks

Deliverables:

- transaksi offline dapat masuk queue lokal
- saat online, event dapat dikirim ke backend
- backend dapat menyimpan data transaksi, payment, stock movement, dan shift dari sync
- status sync terlihat oleh user yang berwenang

Definition of Done:

- duplicate event tidak membuat data ganda
- event gagal bisa diretry
- event sukses berubah menjadi synced
- backend memiliki log penerimaan sync

Status implementasi saat ini:

- [x] Local sync event generation sudah tersedia untuk `transaction.bundle`, `shift.opened`, `shift.closed`, dan `stock_movement.created`.
- [x] Local sync queue sudah memiliki status `pending`, `queued`, `synced`, `failed`, dan `conflict` dengan retry metadata dasar.
- [x] Backend `POST /api/v1/sync/bundles` sudah menerima dan apply transaction bundle.
- [x] Backend `POST /api/v1/sync/events` sudah menerima dan apply shift serta stock movement event.
- [x] Idempotency berbasis `event_id`/idempotency key sudah diterapkan untuk transaction bundle, shift event, dan stock movement event.
- [x] Backend acknowledgement response dan update status lokal sudah tersedia.
- [x] Sync jobs dan sync logs backend sudah tersedia untuk monitoring awal.
- [x] Halaman sync status desktop sudah menampilkan ringkasan transaksi, shift, dan stock movement.
- [x] Duplicate event tidak membuat data ganda untuk event yang sudah didukung.
- [ ] Conflict resolver masih status dasar, belum ada UI resolver kompleks.
- [ ] Manual smoke offline-online penuh belum dijalankan setelah batch inventory terbaru.

### Sprint 5: Dashboard dan Reporting Dasar

Tujuan:

- menyediakan visibilitas awal untuk supervisor, HQ admin, dan executive analyst.

Scope utama:

- implement dashboard omzet harian, mingguan, dan bulanan
- implement jumlah transaksi
- implement top selling products
- implement slow moving products sederhana
- implement stok kritis
- implement performa per cabang
- implement performa per channel dasar
- implement filter periode dan cabang
- implement endpoint reporting backend

Deliverables:

- HQ dapat melihat ringkasan performa lintas cabang
- supervisor dapat melihat ringkasan cabangnya
- executive analyst dapat melihat dashboard read-only

Definition of Done:

- dashboard memakai data pusat hasil transaksi dan sync
- filter periode dan cabang berjalan
- role access dashboard sesuai PRD

### Sprint 6: Shopee Integration MVP

Tujuan:

- membuktikan alur omnichannel awal dengan satu marketplace, yaitu Shopee.

Scope utama:

- implement model sales channel, channel store, online order, online order item, dan product channel mapping
- implement UI mapping SKU Shopee ke SKU internal
- implement import order Shopee secara manual atau mockable untuk MVP
- implement update status order internal
- implement stock sync dasar ke Shopee sebagai skeleton atau adapter
- implement webhook/event handling skeleton
- implement retry dan error log integrasi dasar

Deliverables:

- HQ admin dapat membuat mapping SKU channel
- order Shopee dapat masuk ke sistem internal melalui flow MVP
- order online dapat dikaitkan dengan produk internal dan branch fulfillment

Definition of Done:

- order Shopee dummy atau sandbox dapat diproses ke model internal
- mapping SKU mencegah order masuk tanpa produk internal yang jelas
- error integrasi tercatat

### Sprint 7: AI Insights Dasar

Tujuan:

- menyediakan insight operasional sederhana berbasis data transaksi dan stok.

Scope utama:

- implement worker AI atau analytics service dasar
- implement low stock alert
- implement prediksi stockout sederhana berdasarkan stok saat ini dan rata-rata penjualan
- implement tren penjualan per cabang
- implement tren penjualan per SKU atau kategori
- implement ringkasan insight singkat
- implement endpoint dan UI AI insights untuk role yang berwenang

Deliverables:

- executive analyst dapat melihat insight stok menipis
- HQ dapat melihat prediksi stockout sederhana
- insight tidak mengubah data operasional otomatis

Definition of Done:

- insight dapat dihitung dari seed/demo data
- hasil insight memiliki timestamp dan sumber data
- UI membedakan insight, alert, dan data operasional biasa

### Sprint 8: Hardening, Testing, dan Demo Readiness

Tujuan:

- memastikan MVP stabil, bisa dijalankan ulang, dan siap didemokan.

Scope utama:

- implement test penting untuk auth, POS transaction, inventory movement, dan sync
- implement error handling dan empty state utama
- implement loading state utama
- implement validation pada endpoint dan form penting
- implement logging dasar yang konsisten
- rapikan README local setup
- siapkan seed demo lengkap
- siapkan runbook demo
- siapkan build desktop app MVP
- lakukan UI polish secukupnya untuk POS, dashboard, sync status, dan inventory

Deliverables:

- aplikasi dapat dijalankan dari setup bersih
- flow demo utama terdokumentasi
- build MVP dapat dibuat
- risiko bug utama pada POS dan sync sudah diuji

Definition of Done:

- developer baru bisa menjalankan project dari README
- flow kasir utama lolos test manual
- flow offline-online sync lolos test manual
- build desktop MVP berhasil dibuat

## 5. Urutan Prioritas Fitur

Prioritas 1:

- auth dan role access
- master product, branch, price, dan inventory
- POS checkout lokal
- stock movement
- local-first transaction
- sync transaction dan stock movement ke backend

Prioritas 2:

- shift management
- dashboard dasar
- sync status
- reporting cabang dan pusat
- seed demo lengkap

Prioritas 3:

- Shopee MVP
- AI insights dasar
- hardening, testing, dan packaging

## 6. Batasan MVP

Tidak dikerjakan pada roadmap MVP ini:

- retur dan refund
- payment gateway langsung
- loyalty system
- promo engine kompleks
- procurement penuh
- akuntansi penuh
- multi-marketplace
- chat marketplace
- AI auto-action
- dynamic pricing otomatis
- conflict resolution otomatis kompleks

## 7. Acceptance Criteria Akhir MVP

MVP dianggap selesai jika:

- aplikasi desktop dapat dijalankan untuk demo operasional cabang
- kasir dapat login, membuka shift, membuat transaksi, mencatat pembayaran, dan melihat struk
- transaksi dan stok tetap tercatat saat backend tidak tersedia
- transaksi offline dapat tersinkron ke backend saat koneksi tersedia
- stok cabang berubah otomatis dari transaksi dan adjustment
- HQ dapat mengelola data dasar produk, harga, cabang, dan user
- dashboard dasar dapat menampilkan performa penjualan dan stok
- Shopee order MVP dapat masuk ke sistem internal melalui mapping SKU
- LLM insight dapat menampilkan stok menipis, risiko stockout, tren penjualan, anomali, dan rekomendasi operasional dari data pusat
- README dan seed data cukup untuk menjalankan demo dari awal

## 8. Catatan Implementasi

- Roadmap ini adalah panduan sprint lanjutan, bukan pengganti PRD atau API contract.
- Jika Sprint 0 belum selesai, jangan langsung masuk Sprint 2 atau lebih jauh.
- Jika waktu terbatas, selesaikan Prioritas 1 terlebih dahulu karena itu inti dari POS yang bisa berjalan.
- Shopee dan AI boleh ditunda setelah POS, inventory, dan sync stabil.
