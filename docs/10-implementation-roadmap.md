# Implementation Roadmap

## Ringkasan Sprint

| Sprint | Fokus                              | Status                                                            |
| ------ | ---------------------------------- | ----------------------------------------------------------------- |
| 0      | Foundation                         | Selesai.                                                          |
| 1      | Backend API dan Prisma foundation  | Selesai MVP; access token dan refresh session sudah di-hardening. |
| 2      | Local data dan hybrid sync backend | Selesai MVP, conflict resolver masih dasar.                       |
| 3      | Frontend POS desktop               | Selesai MVP, UI belum final.                                      |
| 4      | Dashboard, reporting, audit        | Selesai read-only; filter tanggal tervalidasi.                    |
| 5      | Marketplace/Shopee removal         | Selesai untuk active runtime surface; legacy schema tetap inert.  |
| 6      | LLM insights                       | Selesai MVP; perlu live provider validation dengan API key asli.  |
| 7      | MVP release readiness              | Artifact siap, perlu runtime validation penuh.                    |
| 8      | Post-MVP expansion                 | Backlog/discovery, bukan implementasi besar.                      |

## Milestone Utama

1. Foundation runnable: monorepo, backend, desktop shell, DB, queue, seed, local DB.
2. Master data dan auth usable.
3. Local POS checkout dan sync queue.
4. Backend apply transaction bundle dan sync events.
5. Dashboard/report/audit dari central DB.
6. Shopee/marketplace surfaces removed from active MVP scope.
7. LLM low stock, stockout risk, sales trend, anomaly, dan rekomendasi operasional dengan structured output.
8. Smoke script dan release readiness checklist.

## Quality Gate

| Area                | Gate                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Foundation          | install, env, build, health check.                                                                                  |
| Backend             | Prisma validate, migration, seed, auth/master data smoke.                                                           |
| Sync                | idempotency, duplicate, retry, replay, audit log.                                                                   |
| POS                 | local DB write, checkout offline, receipt preview.                                                                  |
| Dashboard           | role access, read-only central DB query.                                                                            |
| Marketplace removal | tidak ada menu/API/smoke aktif untuk Shopee.                                                                        |
| LLM                 | missing API key, provider failure, malformed output, insufficient data, confidence/severity visible.                |
| Release             | `pnpm smoke:mvp`, UAT checklist, known issues reviewed.                                                             |
| Desktop package     | Production Electron build membuka renderer, SQLite init, checkout lokal, dan sync replay berjalan tanpa `next dev`. |

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
3. LLM prompt/version evaluation, live provider validation, dan cost/rate-limit observability.
4. Replenishment recommendation.
5. Marketplace discovery jika scope produk dibuka lagi.
6. Conflict resolution upgrade.
7. Payment gateway discovery.
8. Return/refund discovery.
9. Performance measurement dashboard.
