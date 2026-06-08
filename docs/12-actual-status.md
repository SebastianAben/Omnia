# Actual Status

Tanggal review: 2026-06-07.

## Kondisi Umum

Omnia berada pada fase MVP release candidate secara kode dan dokumentasi. Fitur utama dari Sprint 0 sampai Sprint 7 sudah tersedia secara fungsional, tetapi belum production-ready sampai validasi runtime penuh, hardening auth/permission, migration target, dan UAT selesai.

## Sudah Ada

Backend:

- NestJS modular app.
- Auth login dan `auth/me`.
- Rotating refresh session dan logout revocation.
- Master data API: users, roles, branches, registers, categories, products, branch prices.
- Inventory balances dan stock movements.
- Sync events dan transaction bundles.
- Sync jobs/logs.
- Dashboard branch/central.
- Reports sales summary, validasi date window, bounded CSV export dengan proteksi formula dan peringatan truncation, serta inventory alerts.
- Audit logs.
- Monitoring branch sync health dan Shopee health.
- Shopee store, SKU mapping, order import, webhook, retry job.
- AI insights, low stock, stockout prediction.
- Swagger/OpenAPI setup.

Desktop app:

- Next.js + Electron shell.
- Access dan refresh token disimpan terenkripsi melalui Electron `safeStorage`;
  browser fallback hanya menyimpan token di memory.
- Role-based sidebar.
- Routes: login, workspace, POS, shift, inventory, receipts, sync status, audit, Shopee, AI.
- Local checkout repository dan SQLite schema.
- POS checkout lokal dengan validasi ulang total, shift, dan stok di Electron
  main process.
- Receipt preview menyimpan nominal diterima dan kembalian.
- Shift open/close dasar.
- Inventory adjustment lokal dengan guard stok negatif dan ledger before/after.
- Sync replay untuk transaction bundle, shift, dan stock movement dengan batch
  bounded, retry backoff, next retry, dan error metadata lokal.
- Browser biasa sudah diperlakukan sebagai fallback/non-local-store mode; local SQLite membutuhkan Electron bridge.

Infrastructure:

- pnpm monorepo.
- Shared packages: config, types, utils, ui.
- Docker Compose PostgreSQL/Redis.
- Backend Dockerfile dan home-server deploy compose.
- GitHub Actions CI/deploy.
- Smoke script MVP.

## Belum Selesai / Perlu Hardening

- Runtime login, refresh rotation, logout revocation, dan secure token persistence
  masih perlu divalidasi langsung di Electron.
- Permission dan branch scope perlu audit runtime menyeluruh.
- UI belum final/pixel-perfect dari Figma/Stitch.
- Production packaging Next.js + Electron belum tervalidasi penuh; wrapper readiness perlu mengikuti `14-desktop-wrapper-readiness.md`.
- Receipt print nyata belum ada.
- Conflict resolver masih dasar dan belum punya UI.
- Central sync jobs/logs/branch-health UI masih perlu diperdalam untuk
  supervisor/HQ.
- Test otomatis untuk role access, Shopee duplicate, dan AI insufficient data
  masih perlu ditambah; guardrail bundle transaksi utama sudah diuji.
- Migration Sprint 5/6 harus dipastikan sudah diterapkan di environment target.
- Shopee perlu validasi credential/sandbox nyata.
- Python AI worker masih ringan/dry-run; logic AI utama masih di backend.

## Gap Dokumentasi yang Sudah Dirapikan

- PRD, MVP, dan user flow dikonsolidasikan agar tidak saling mengulang.
- Roadmap lanjutan, Sprint 7 readiness, dan Sprint 8 backlog diringkas dalam roadmap kanonik.
- LLM memory dan report panjang diganti dengan status aktual ringkas ini.
- Skill guide dan multi-agent workflow disatukan sebagai delivery workflow.

## Rekomendasi Berikutnya

1. Jalankan validasi clean setup: install, infra up, migrate, seed, local DB init, backend, desktop, smoke.
2. Validasi runtime login/refresh/logout dan secure token persistence di Electron.
3. Tambahkan branch-scope guard dan permission test.
4. Tambahkan integration test untuk sync idempotency, Shopee duplicate webhook, dashboard forbidden role, dan AI insufficient data.
5. Finalisasi UI dari Figma/Stitch.
6. Validasi packaged Electron app agar POS SQLite berjalan tanpa `next dev`.
7. Bekukan scope sampai UAT Sprint 7 selesai.
