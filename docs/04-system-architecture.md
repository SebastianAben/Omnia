# System Architecture

## Prinsip

Omnia memakai arsitektur hybrid local-first:

- Cabang menulis operasi POS ke SQLite lokal terlebih dahulu.
- POS cabang ditargetkan berjalan sebagai desktop app wrapper, bukan browser-only web app.
- Backend pusat menjadi sumber konsolidasi untuk dashboard, audit, monitoring, dan LLM insight.
- Sync berjalan asynchronous dengan queue, retry, idempotency, dan audit log.
- Fitur berat tidak berada di jalur kritis checkout.

## Komponen

| Komponen                  | Fungsi                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Desktop App               | UI POS/backoffice berbasis Next.js yang dibungkus Electron.                                |
| Local Store               | SQLite untuk transaksi, payment, stock movement, shift, cache master data, dan sync queue. |
| Backend API               | NestJS API untuk auth, master data, sync, dashboard, LLM insight, audit, monitoring.       |
| Central DB                | PostgreSQL untuk data konsolidasi dan reporting.                                           |
| Queue                     | Redis/BullMQ untuk sync, retry, dashboard/LLM jobs.                                        |
| LLM Module                | Insight generation dari data pusat melalui provider LLM dan structured output validation.  |
| Legacy Marketplace Module | Marketplace schema lama dibuat inert; active Shopee module/routes/UI sudah dihapus.        |

## Data Flow POS

1. Cashier membuat transaksi di desktop app.
2. Transaksi ditulis ke SQLite lokal.
3. App menambahkan event/bundle ke local sync queue.
4. Replay mengirim data ke backend pusat.
5. Backend mengaplikasikan data ke PostgreSQL secara idempotent.
6. Dashboard/report/LLM membaca data pusat.

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
- LLM insight terbaru.
- Master data refresh.
- Monitoring pusat.

## Deployment Model

| Target                 | Model                                                                    |
| ---------------------- | ------------------------------------------------------------------------ |
| Local development      | Docker Compose untuk PostgreSQL/Redis, backend lokal, desktop app lokal. |
| Desktop POS            | Electron app dengan SQLite lokal dan backend URL dari config.            |
| Web/dashboard optional | Next.js dapat disiapkan Vercel-ready jika diperlukan.                    |
| Backend pusat          | NestJS di home server/container dengan PostgreSQL dan Redis.             |

Detail kesiapan wrapper desktop ada di `14-desktop-wrapper-readiness.md`.

## Security Boundary

- Semua endpoint sensitif memakai bearer token.
- Role dan branch scope harus divalidasi di backend.
- UI role-based hanya untuk UX, bukan kontrol keamanan utama.
- Audit log wajib untuk perubahan operasional penting.
