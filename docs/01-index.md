# Omnia Documentation Index

Dokumentasi ini disusun sebagai source of truth ringkas untuk Omnia, Hybrid Omnichannel Smart POS berbasis local-first.

## Urutan Baca

| No | Dokumen | Fungsi |
| --- | --- | --- |
| 01 | `01-index.md` | Peta dokumentasi dan aturan pemeliharaan. |
| 02 | `02-product-scope.md` | Visi produk, role, scope MVP, out-of-scope, dan KPI. |
| 03 | `03-user-flows.md` | Flow operasional utama per role. |
| 04 | `04-system-architecture.md` | Arsitektur cabang, pusat, sync, Shopee, AI, dan deployment model. |
| 05 | `05-data-model.md` | Entitas data utama dan relasi domain. |
| 06 | `06-api-contract.md` | Endpoint MVP, format respons, auth, dan permission boundary. |
| 07 | `07-sync-specification.md` | Aturan offline-online, event, idempotency, retry, replay, dan conflict. |
| 08 | `08-technical-stack.md` | Stack final dan alasan pemilihan per layer. |
| 09 | `09-ui-design-guide.md` | Prinsip UI dan prioritas screen. |
| 10 | `10-implementation-roadmap.md` | Tahapan sprint, status, quality gate, dan post-MVP backlog. |
| 11 | `11-delivery-workflow.md` | Workflow agent/tim, report template, dan skill usage. |
| 12 | `12-actual-status.md` | Kondisi aktual implementasi, gap, dan rekomendasi berikutnya. |
| 13 | `13-engineering-knowledge.md` | Standar modularitas, clean code, performa, API, database, dan opsi refactor. |
| 14 | `14-desktop-wrapper-readiness.md` | Kesiapan Next.js app untuk dibungkus sebagai desktop app dengan SQLite lokal. |

## Aturan Dokumentasi

- Satu dokumen hanya punya satu fungsi utama sesuai judul.
- Hindari daftar referensi panjang di setiap file; gunakan index ini sebagai pintu masuk.
- Jika informasi berubah, update dokumen kanoniknya saja.
- Status implementasi aktual ditulis di `12-actual-status.md`, bukan disalin ke dokumen desain/arsitektur.
- Standar engineering lintas backend/frontend/API/database ditulis di `13-engineering-knowledge.md`.
- Kesiapan packaging desktop/Electron ditulis di `14-desktop-wrapper-readiness.md`.
- Roadmap dan backlog disatukan di `10-implementation-roadmap.md`.
- Detail yang terlalu panjang dipindahkan ke kode, test, atau issue/backlog, bukan digandakan di docs.
