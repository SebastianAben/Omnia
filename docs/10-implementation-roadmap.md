# Implementation Roadmap

## Ringkasan Sprint

| Sprint | Fokus | Status |
| --- | --- | --- |
| 0 | Foundation | Selesai. |
| 1 | Backend API dan Prisma foundation | Selesai MVP, perlu hardening auth. |
| 2 | Local data dan hybrid sync backend | Selesai MVP, conflict resolver masih dasar. |
| 3 | Frontend POS desktop | Selesai MVP, UI belum final. |
| 4 | Dashboard, reporting, audit | Selesai read-only. |
| 5 | Shopee integration | Terimplementasi mock/sandbox-ready. |
| 6 | AI analytics dasar | Terimplementasi advisory. |
| 7 | MVP release readiness | Artifact siap, perlu runtime validation penuh. |
| 8 | Post-MVP expansion | Backlog/discovery, bukan implementasi besar. |

## Milestone Utama

1. Foundation runnable: monorepo, backend, desktop shell, DB, queue, seed, local DB.
2. Master data dan auth usable.
3. Local POS checkout dan sync queue.
4. Backend apply transaction bundle dan sync events.
5. Dashboard/report/audit dari central DB.
6. Shopee store, SKU mapping, order import, retry, monitoring.
7. AI low stock dan stockout prediction sederhana.
8. Smoke script dan release readiness checklist.

## Quality Gate

| Area | Gate |
| --- | --- |
| Foundation | install, env, build, health check. |
| Backend | Prisma validate, migration, seed, auth/master data smoke. |
| Sync | idempotency, duplicate, retry, replay, audit log. |
| POS | local DB write, checkout offline, receipt preview. |
| Dashboard | role access, read-only central DB query. |
| Shopee | duplicate webhook, mapping error, retry job. |
| AI | insufficient data handling, confidence/severity visible. |
| Release | `pnpm smoke:mvp`, UAT checklist, known issues reviewed. |
| Desktop package | Production Electron build membuka renderer, SQLite init, checkout lokal, dan sync replay berjalan tanpa `next dev`. |

## Release Readiness

Sebelum demo/UAT:

- PostgreSQL dan Redis aktif.
- Migration Sprint 0/5/6 diterapkan.
- Seed demo terbaru diterapkan.
- Backend dan desktop app dapat dijalankan dari clean setup.
- `pnpm typecheck`, `pnpm lint`, `pnpm build`, dan `pnpm smoke:mvp` berhasil.
- Desktop wrapper readiness di `14-desktop-wrapper-readiness.md` tervalidasi sebelum distribusi ke cabang.
- Permission dan branch scope direview.
- Known critical bugs kosong atau terdokumentasi.

## Post-MVP Backlog

Prioritas setelah UAT:

1. UAT feedback triage.
2. Reporting export CSV: basic sales summary CSV tersedia; XLSX masih backlog.
3. Replenishment recommendation.
4. Marketplace berikutnya.
5. Conflict resolution upgrade.
6. Payment gateway discovery.
7. Return/refund discovery.
8. Performance measurement dashboard.
