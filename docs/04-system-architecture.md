# System Architecture

## Prinsip

Omnia memakai arsitektur hybrid local-first:

- Cabang menulis operasi POS ke SQLite lokal terlebih dahulu.
- POS cabang ditargetkan berjalan sebagai desktop app wrapper, bukan browser-only web app.
- Backend pusat menjadi sumber konsolidasi untuk dashboard, audit, Shopee, dan AI.
- Sync berjalan asynchronous dengan queue, retry, idempotency, dan audit log.
- Fitur berat tidak berada di jalur kritis checkout.

## Komponen

| Komponen | Fungsi |
| --- | --- |
| Desktop App | UI POS/backoffice berbasis Next.js yang dibungkus Electron. |
| Local Store | SQLite untuk transaksi, payment, stock movement, shift, cache master data, dan sync queue. |
| Backend API | NestJS API untuk auth, master data, sync, dashboard, Shopee, AI, audit, monitoring. |
| Central DB | PostgreSQL untuk data konsolidasi dan reporting. |
| Queue | Redis/BullMQ untuk sync, webhook, retry, dashboard/AI jobs. |
| Shopee Module | Store, SKU mapping, webhook import, integration health. |
| AI Module | Insight advisory dari data pusat. |

## Data Flow POS

1. Cashier membuat transaksi di desktop app.
2. Transaksi ditulis ke SQLite lokal.
3. App menambahkan event/bundle ke local sync queue.
4. Replay mengirim data ke backend pusat.
5. Backend mengaplikasikan data ke PostgreSQL secara idempotent.
6. Dashboard/report/AI membaca data pusat.

## Online vs Offline

Tetap berjalan offline:

- Login lokal/session yang masih valid.
- Product cache minimum.
- POS checkout.
- Shift dasar.
- Receipt preview.
- Local inventory adjustment.
- Sync queue write.

Terbatas saat offline:

- Dashboard pusat.
- Shopee integration.
- AI insight terbaru.
- Master data refresh.
- Monitoring pusat.

## Deployment Model

| Target | Model |
| --- | --- |
| Local development | Docker Compose untuk PostgreSQL/Redis, backend lokal, desktop app lokal. |
| Desktop POS | Electron app dengan SQLite lokal dan backend URL dari config. |
| Web/dashboard optional | Next.js dapat disiapkan Vercel-ready jika diperlukan. |
| Backend pusat | NestJS di home server/container dengan PostgreSQL dan Redis. |

Detail kesiapan wrapper desktop ada di `14-desktop-wrapper-readiness.md`.

## Security Boundary

- Semua endpoint sensitif memakai bearer token.
- Role dan branch scope harus divalidasi di backend.
- UI role-based hanya untuk UX, bukan kontrol keamanan utama.
- Audit log wajib untuk perubahan operasional penting.
