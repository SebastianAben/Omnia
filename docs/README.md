# Omnia Documentation Index

Dokumen ini menjadi pintu masuk utama untuk membaca acuan Omnia. File yang bersifat duplikatif sudah dikonsolidasikan supaya setiap topik punya satu source of truth.

## Source of Truth

| Area                            | Dokumen utama                                                   | Fungsi                                                                                                                          |
| ------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Produk                          | `PRD-Hybrid-Omnichannel-Smart-POS.md`                           | Visi, masalah, role, scope produk, dan kebutuhan utama.                                                                         |
| MVP                             | `MVP-Hybrid-Omnichannel-Smart-POS.md`                           | Batas MVP, outcome, out of scope, dan acceptance criteria produk.                                                               |
| User flow                       | `User-Flow-Utama-Hybrid-Omnichannel-Smart-POS.md`               | Flow operasional utama per role.                                                                                                |
| Arsitektur                      | `High-Level-Architecture-Hybrid-Omnichannel-Smart-POS.md`       | Pembagian sistem cabang, pusat, sync, marketplace, dan AI.                                                                      |
| Data                            | `ERD-Awal-Hybrid-Omnichannel-Smart-POS.md`                      | Entitas logis dan relasi awal.                                                                                                  |
| Sync                            | `Sync-Specification-Detail-Hybrid-Omnichannel-Smart-POS.md`     | Aturan offline, event, retry, replay, idempotency, dan conflict handling.                                                       |
| API                             | `API-Contract-Hybrid-Omnichannel-Smart-POS.md`                  | Kontrak endpoint logis dan permission boundary.                                                                                 |
| Stack                           | `Technical-Stack-Decision-Hybrid-Omnichannel-Smart-POS.md`      | Keputusan teknologi dan alasan pemilihan.                                                                                       |
| UI                              | `DESIGN.md`                                                     | Panduan UI dan prompt library Google Stitch.                                                                                    |
| Delivery                        | `Sprint-Roadmap-Implementation-Hybrid-Omnichannel-Smart-POS.md` | Sprint plan, checklist persiapan, roadmap MVP, quality gate, dan artifact delivery.                                             |
| Sprint 1 backend knowledge      | `Sprint-1-Backend-Scalability-Modularity-Knowledge.md`          | Evaluasi modularitas NestJS, validasi Zod, Prisma schema/query, performa, dan keputusan kapan fitur perlu dipisah module.       |
| Sprint 3 frontend POS knowledge | `Sprint-3-Frontend-POS-Modularity-Knowledge.md`                 | Evaluasi baseline desktop app, hasil skill-scanner review, modularisasi POS, fungsi checkout lokal, dan prosedur sync queue UI. |
| Agent workflow                  | `Multi-Agent-Workflow-Hybrid-Omnichannel-Smart-POS.md`          | Pola kerja PM, worker, QA, reviewer, dan laporan akhir.                                                                         |
| Skill usage                     | `Skill-Guide-by-Sprint-Hybrid-Omnichannel-Smart-POS.md`         | Skill yang dipakai per sprint dan contoh prompt.                                                                                |
| Deployment                      | `Deployment-Strategy-Hybrid-Omnichannel-Smart-POS.md`           | Strategi local, preview, production, environment, CORS, dan health check.                                                       |
| Agent memory                    | `LLM-Memory.md`                                                 | Catatan status kerja terakhir untuk agent berikutnya.                                                                           |

## Dokumen yang Dikonsolidasikan

- `Roadmap-Lanjutan-MVP-Hybrid-Omnichannel-Smart-POS.md` digabung ke `Sprint-Roadmap-Implementation-Hybrid-Omnichannel-Smart-POS.md` karena isinya versi ringkas dari roadmap sprint.
- `Checklist-Persiapan-Vibes-Coding.md` digabung ke bagian checklist persiapan di `Sprint-Roadmap-Implementation-Hybrid-Omnichannel-Smart-POS.md`.
- Referensi lama ke `Sprint-0-Plan-Hybrid-Omnichannel-Smart-POS.md` dan `Sprint-0-Skills-Implementation-Hybrid-Omnichannel-Smart-POS.md` diganti ke dokumen yang benar.

## Urutan Baca yang Disarankan

1. Mulai dari PRD.
2. Baca MVP definition untuk batas implementasi.
3. Baca user flow dan architecture.
4. Baca ERD, sync specification, API contract, dan stack decision.
5. Gunakan sprint roadmap sebagai rencana kerja.
6. Gunakan design guide, deployment strategy, multi-agent workflow, dan skill guide sesuai kebutuhan task.

## Status Konsolidasi

Terakhir diperbarui: 2026-05-05.

Status Sprint 0 sudah tercatat sebagai fondasi runnable: monorepo, desktop shell, backend NestJS, Prisma/PostgreSQL, Redis/BullMQ, local SQLite schema, AI worker skeleton, seed dasar, dan smoke validation. Sprint 3 frontend POS sudah mulai dipisah secara modular dengan login UI, POS cart, payment confirmation dasar, checkout lokal sementara, receipt preview, shift state UI, dan sync status UI dasar. Fitur lanjutan yang masih perlu ditutup: auth session restore via `auth/me`, SQLite bridge nyata, shift event queue, sync replay otomatis, dashboard, Shopee integration, AI insights, CI/CD, dan UI final dari desain.
