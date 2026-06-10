# Actual Status

Tanggal review: 2026-06-09.

## Kondisi Umum

Omnia berada pada fase MVP release candidate secara kode. Integrasi Shopee sudah dihapus dari surface aktif dan AI rule-based sudah diganti menjadi LLM Insights berbasis provider Gemini dengan structured output. Fitur POS, inventory, sync, dashboard/reporting, audit, dan desktop runtime tetap menjadi baseline MVP; release readiness belum production-ready sampai validasi runtime penuh, hardening auth/permission, live LLM provider validation, dan UAT selesai.

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
- Monitoring branch sync health.
- Active Shopee backend/frontend/env/smoke surface sudah dihapus; legacy marketplace schema masih dipertahankan inert sampai keputusan data-retention cleanup.
- LLM Insights: generation manual, persisted insight, role-based wording, structured output validation, cooldown/cache, dan advisory-only guardrails.
- Swagger/OpenAPI setup.

Desktop app:

- Next.js + Electron shell.
- Access dan refresh token disimpan terenkripsi melalui Electron `safeStorage`;
  browser fallback hanya menyimpan token di memory.
- Role-based sidebar.
- Routes: login, workspace, POS, shift, inventory, receipts, sync status, audit, dan LLM Insights.
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
- Shopee sudah dihapus dari active backend/frontend/smoke/env surface; legacy schema marketplace masih dipertahankan inert.
- LLM provider integration sudah ada, tetapi masih perlu live Gemini validation dengan `LLM_API_KEY` production/UAT.
- Conflict resolver masih dasar dan belum punya UI.
- Central sync jobs/logs/branch-health UI masih perlu diperdalam untuk
  supervisor/HQ.
- Test otomatis untuk LLM missing-key, malformed output, unsafe output, role-based wording, cooldown cache, dan forbidden role sudah ada; DB-backed integration smoke masih perlu dijalankan.
- Migration Sprint 5/6 harus dipastikan sudah diterapkan di environment target.
- Python AI worker masih ringan/dry-run; logic LLM utama saat ini berada di backend.

## Gap Dokumentasi yang Sudah Dirapikan

- PRD, MVP, dan user flow dikonsolidasikan agar tidak saling mengulang.
- Roadmap lanjutan, Sprint 7 readiness, dan Sprint 8 backlog diringkas dalam roadmap kanonik.
- LLM memory dan report panjang diganti dengan status aktual ringkas ini.
- Skill guide dan multi-agent workflow disatukan sebagai delivery workflow.

## Rekomendasi Berikutnya

1. Jalankan validasi clean setup: install, infra up, migrate, seed, local DB init, backend, desktop, smoke.
2. Validasi runtime login/refresh/logout dan secure token persistence di Electron.
3. Tambahkan branch-scope guard dan permission test.
4. Jalankan live Gemini validation dengan `LLM_API_KEY`, cooldown/cache aktif, dan dataset seed/representatif.
5. Tambahkan DB-backed integration test untuk sync idempotency, dashboard forbidden role, LLM provider failure, dan insufficient data.
6. Evaluasi apakah legacy marketplace schema perlu migration cleanup setelah data-retention diputuskan; jangan membuka kembali marketplace/Shopee tanpa keputusan scope baru.
7. Finalisasi UI dari Figma/Stitch.
8. Validasi packaged Electron app agar POS SQLite berjalan tanpa `next dev`.
9. Bekukan scope sampai UAT selesai.
