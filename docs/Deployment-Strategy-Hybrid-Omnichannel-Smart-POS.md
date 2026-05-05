# Deployment Strategy

## 1. Informasi Dokumen

- Nama produk: Omnia
- Nama dokumen: Deployment Strategy
- Versi: 1.0
- Tanggal: 2026-05-05
- Tujuan: mengunci strategi deployment MVP agar local, preview, dan production dapat memakai konfigurasi environment tanpa mengubah kode.
- Referensi:
  - `docs/PRD-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/MVP-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/High-Level-Architecture-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/Technical-Stack-Decision-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/Sprint-Roadmap-Implementation-Hybrid-Omnichannel-Smart-POS.md`

## 2. Ringkasan Keputusan

Omnia memakai model deployment hybrid:

- frontend web Next.js disiapkan agar Vercel-ready
- desktop POS tetap memakai Electron dan UI yang sama
- backend NestJS berjalan di home server
- PostgreSQL dan Redis berjalan di home server atau host internal yang dikontrol sendiri
- SQLite tetap lokal di desktop app untuk POS local-first
- semua URL, origin, credential, dan mode runtime dikendalikan melalui environment variables

Tidak boleh ada production URL, database URL, Redis URL, secret, atau origin yang di-hardcode di source code.

## 3. Deployment Model

### 3.1 Frontend Web / Vercel

Frontend Next.js dapat dideploy ke Vercel untuk akses dashboard, admin, dan UI web jika dibutuhkan.

Ketentuan:

- frontend membaca backend URL dari `NEXT_PUBLIC_API_BASE_URL`
- frontend membaca mode environment dari `NEXT_PUBLIC_APP_ENV`
- frontend tidak menyimpan secret backend
- frontend tidak mengakses PostgreSQL atau Redis langsung
- preview dan production Vercel harus punya environment variable masing-masing

Contoh production:

```text
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://api.omnia.example.com/api/v1
```

Contoh local:

```text
NEXT_PUBLIC_APP_ENV=local
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
```

### 3.2 Desktop POS / Electron

Electron dipakai untuk POS cabang dan local-first workflow.

Ketentuan:

- desktop shell memakai UI Next.js yang sama
- local SQLite tetap menjadi sumber tulis utama untuk transaksi POS cabang
- desktop app tetap dapat mencatat transaksi saat backend tidak reachable
- sync akan memakai backend URL dari konfigurasi environment/runtime
- perangkat lokal seperti printer, scanner, dan cash drawer dikelola dari desktop layer

### 3.3 Backend / Home Server

Backend NestJS berjalan di home server sebagai pusat API, sync, auth, dashboard, Shopee integration, dan AI orchestration.

Ketentuan:

- backend diekspos melalui HTTPS reverse proxy
- backend domain harus stabil, misalnya `https://api.omnia.example.com`
- backend membaca CORS allowlist dari `CORS_ORIGINS`
- backend membaca database dari `DATABASE_URL`
- backend membaca Redis dari `REDIS_URL`
- health endpoint harus tersedia untuk deploy check dan monitoring

Komponen minimum di home server:

- NestJS API
- PostgreSQL
- Redis
- BullMQ worker atau worker process yang terhubung ke Redis
- AI worker jika sudah masuk sprint terkait
- reverse proxy HTTPS
- backup database
- log persistence

### 3.4 Local-First Sync

Deployment tidak boleh mengubah prinsip local-first.

Ketentuan:

- transaksi POS ditulis ke SQLite lokal terlebih dahulu
- backend unavailable tidak boleh memblokir checkout
- data lokal masuk sync queue
- saat koneksi tersedia, desktop app mengirim event ke backend
- backend melakukan validasi, deduplication, dan acknowledgement

## 4. Environment Contract

### 4.1 Frontend / Vercel

| Variable                                   | Required | Contoh                                 | Keterangan                        |
| ------------------------------------------ | -------- | -------------------------------------- | --------------------------------- |
| `NEXT_PUBLIC_APP_ENV`                      | Ya       | `local`, `preview`, `production`       | Mode frontend.                    |
| `NEXT_PUBLIC_API_BASE_URL`                 | Ya       | `https://api.omnia.example.com/api/v1` | Base URL backend API.             |
| `NEXT_PUBLIC_SYNC_STATUS_POLL_INTERVAL_MS` | Ya       | `15000`                                | Interval polling status sync.     |
| `NEXT_PUBLIC_SENTRY_DSN`                   | Tidak    | `https://...`                          | DSN Sentry frontend jika dipakai. |

### 4.2 Backend / Home Server

| Variable               | Required | Contoh                                                 | Keterangan                        |
| ---------------------- | -------- | ------------------------------------------------------ | --------------------------------- |
| `APP_ENV`              | Ya       | `local`, `staging`, `production`                       | Mode backend.                     |
| `PORT`                 | Ya       | `4000`                                                 | Port internal backend.            |
| `PUBLIC_API_URL`       | Ya       | `https://api.omnia.example.com`                        | URL publik backend.               |
| `CORS_ORIGINS`         | Ya       | `https://omnia.vercel.app,http://localhost:3000`       | Allowlist origin frontend.        |
| `DATABASE_URL`         | Ya       | `postgresql://omnia:omnia@localhost:55433/omnia`       | Koneksi PostgreSQL local Docker.  |
| `REDIS_URL`            | Ya       | `redis://localhost:6379`                               | Koneksi Redis/BullMQ.             |
| `JWT_SECRET`           | Ya       | secret panjang                                         | Secret access token.              |
| `JWT_EXPIRES_IN`       | Ya       | `15m`                                                  | Masa berlaku access token.        |
| `REFRESH_TOKEN_SECRET` | Tidak    | secret panjang                                         | Wajib jika refresh token dipakai. |
| `SHOPEE_CLIENT_ID`     | Tidak    | `...`                                                  | Credential Shopee.                |
| `SHOPEE_CLIENT_SECRET` | Tidak    | `...`                                                  | Secret Shopee.                    |
| `SHOPEE_REDIRECT_URI`  | Tidak    | `https://api.omnia.example.com/api/v1/shopee/callback` | Redirect OAuth Shopee.            |
| `SENTRY_DSN`           | Tidak    | `https://...`                                          | DSN Sentry backend.               |
| `LOG_LEVEL`            | Ya       | `info`                                                 | Level logging.                    |

### 4.3 AI Worker

| Variable                | Required | Contoh                                           | Keterangan                   |
| ----------------------- | -------- | ------------------------------------------------ | ---------------------------- |
| `APP_ENV`               | Ya       | `local`, `staging`, `production`                 | Mode worker.                 |
| `DATABASE_URL`          | Ya       | `postgresql://omnia:omnia@localhost:55433/omnia` | Data source analytics local. |
| `REDIS_URL`             | Ya       | `redis://localhost:6379`                         | Queue source.                |
| `AI_WORKER_CONCURRENCY` | Ya       | `2`                                              | Jumlah job paralel.          |
| `LOG_LEVEL`             | Ya       | `info`                                           | Level logging.               |

## 5. CORS Strategy

Backend harus menolak origin yang tidak ada di `CORS_ORIGINS`.

Contoh local:

```text
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

Contoh production:

```text
CORS_ORIGINS=https://omnia.vercel.app,https://omnia-preview.vercel.app
```

Jika desktop Electron mengakses backend melalui local renderer origin yang berbeda, origin tersebut harus ditambahkan melalui environment, bukan di-hardcode.

## 6. URL dan Domain Strategy

Gunakan domain stabil untuk backend production:

```text
https://api.omnia.example.com
```

Gunakan Vercel domain atau custom domain untuk frontend:

```text
https://omnia.example.com
https://omnia.vercel.app
```

Aturan:

- frontend hanya tahu backend lewat `NEXT_PUBLIC_API_BASE_URL`
- backend hanya tahu frontend lewat `CORS_ORIGINS`
- Shopee callback memakai `SHOPEE_REDIRECT_URI`
- URL local, preview, staging, dan production tidak boleh dicampur dalam source code

## 7. Docker Compose Target

Sprint 0 sebaiknya menyiapkan Docker Compose minimal untuk local dan home server.

Service minimum:

- backend-api
- postgres
- redis
- worker jika BullMQ worker dipisah
- ai-worker setelah sprint AI dimulai

Docker Compose tidak wajib untuk Vercel frontend. Vercel cukup memakai project Next.js dengan environment variables.

## 8. Health Check dan Deployment Check

Backend wajib menyediakan endpoint:

```text
GET /api/v1/health
```

Response minimum:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "backend-api",
    "version": "0.1.0"
  }
}
```

Health check production harus digunakan oleh reverse proxy, deploy script, atau monitoring sederhana.

## 9. Sprint 0 Deployment Readiness

Sprint 0 dianggap deployment-ready jika:

- env contract tersedia dan dipakai oleh app skeleton
- `.env.example` mencakup frontend, backend, database, Redis, Shopee, Sentry, dan worker
- backend health endpoint tersedia
- frontend dapat diarahkan ke backend berbeda hanya dengan env
- CORS dikonfigurasi dari env
- tidak ada URL production di source code
- Docker Compose draft tersedia untuk backend, PostgreSQL, dan Redis
- README menjelaskan local dev dan production env setup

## 10. Validation Plan

Validasi dokumentasi:

- pastikan tidak ada instruksi hardcode backend URL
- pastikan semua deployment value memakai environment variables
- pastikan frontend Vercel dan backend home server terpisah jelas

Validasi implementasi Sprint 0 nanti:

- jalankan backend local dengan `.env`
- jalankan frontend dengan `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1`
- ganti `NEXT_PUBLIC_API_BASE_URL` ke domain backend home server tanpa mengubah kode
- pastikan CORS menerima origin Vercel production/preview yang didaftarkan
- pastikan CORS menolak origin yang tidak dikenal

## 11. Catatan Keamanan

- Jangan commit secret production.
- Gunakan `.env.local` untuk local development.
- Gunakan dashboard Vercel untuk env production/preview frontend.
- Gunakan secret manager, file env server yang aman, atau mekanisme deploy home server untuk backend secret.
- Batasi akses PostgreSQL dan Redis agar tidak terbuka publik.
- Expose hanya HTTPS reverse proxy untuk backend API.
