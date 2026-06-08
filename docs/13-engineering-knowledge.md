# Engineering Knowledge

Dokumen ini adalah acuan modularitas, efisiensi, performa, dan clean code untuk Omnia. Gunakan saat membuat kode baru, refactor, review performa, atau mengganti pendekatan teknis yang mulai tidak cukup.

## Prinsip Umum

- Utamakan behavior yang benar dan mudah diuji sebelum optimasi kompleks.
- Buat modul berdasarkan domain bisnis, bukan jenis file semata.
- Jaga boundary POS local-first: checkout tidak boleh bergantung pada dashboard, Shopee, AI, atau koneksi pusat.
- Hindari duplikasi logic bisnis; pindahkan logic berulang ke service/domain helper yang jelas.
- Buat code path kritis pendek, eksplisit, dan mudah diobservasi.
- Optimasi harus punya alasan: data volume, latency, memory, query cost, atau UX blocking.

## Modularitas Backend

Pola default NestJS:

```text
domain/
  domain.controller.ts
  domain.service.ts
  domain.dto.ts
  domain.module.ts
```

Gunakan modul per domain:

- `auth`
- `users`
- `roles`
- `branches`
- `registers`
- `products`
- `categories`
- `inventory`
- `sync`
- `dashboard`
- `reports`
- `audit`
- `monitoring`
- `integrations/shopee`
- `ai`

Aturan:

- Controller hanya menerima request, validasi input, dan memanggil service.
- Service menyimpan business logic.
- Prisma query yang kompleks sebaiknya dipisah ke private method atau query helper lokal.
- Gunakan transaction untuk write multi-table yang harus konsisten.
- Jangan membuat service lintas domain terlalu besar; jika service mulai punya lebih dari satu alasan berubah, pecah.

## Modularitas Frontend

Pola default:

```text
features/
  feature-name/
    feature-service.ts
    feature-workspace.tsx
    feature-types.ts
    feature-utils.ts
```

Aturan:

- Route page di `app/` sebaiknya tipis dan delegasi ke feature component.
- Server state memakai TanStack Query.
- UI/cart/session-like state memakai Zustand atau state lokal.
- API call dikumpulkan di service per feature.
- Komponen POS harus ringan, stabil ukurannya, dan tidak melakukan fetch berat di jalur checkout.
- Jangan memasukkan logic domain kompleks langsung di JSX.
- Fitur local-first harus memanggil Electron bridge, bukan akses SQLite/Node dari renderer.

## API Design

Aturan:

- Endpoint mengikuti resource/domain.
- Response memakai envelope konsisten.
- Error punya `code` dan `message`.
- Query parameter harus eksplisit untuk filter, pagination, dan date range.
- Endpoint read-heavy dashboard/report harus read-only dan tidak memicu side effect.
- Endpoint sync/webhook harus idempotent.

Untuk auth session:

- Access token dibuat pendek dan tetap stateless pada request path.
- Refresh token bersifat opaque dan hanya hash ber-secret yang disimpan.
- Rotasi refresh token harus atomik dan token lama hanya boleh dipakai sekali.
- Logout mencabut refresh session; access token lama berakhir lewat expiry pendek.

Jika endpoint mulai lambat:

1. Tambahkan pagination/limit.
2. Kurangi payload response.
3. Tambahkan index DB.
4. Pisahkan summary endpoint dari detail endpoint.
5. Pertimbangkan materialized aggregate/cache jika query tetap mahal.

## Database and Query Performance

Default:

- PostgreSQL pusat untuk data konsolidasi.
- SQLite lokal untuk POS local-first.
- Prisma untuk query typed.

Aturan:

- Tambahkan index untuk foreign key, filter umum, `created_at`, `branch_id`, status, dan idempotency key.
- Hindari N+1 query; gunakan include/select yang terukur.
- Gunakan `select` untuk mengambil field yang dibutuhkan saja.
- Batasi `findMany` dengan `take`, pagination, atau date range.
- Untuk dashboard/report besar, pertimbangkan aggregation table atau materialized view.
- Untuk write ledger inventory, jangan hanya update balance; tulis stock movement.

Jika Prisma kurang optimal:

- Gunakan raw SQL selektif untuk query report kompleks.
- Simpan raw SQL di helper/service yang jelas.
- Tetap validasi input agar raw SQL tidak membuka injection risk.

## Sync Performance and Reliability

Aturan:

- Local queue harus persistent.
- Replay harus idempotent.
- Backend harus menulis sync job/log.
- Duplicate event harus dianggap controlled outcome, bukan crash.
- Event besar dikirim sebagai bundle dengan struktur jelas.
- Retry memakai metadata retry count dan last error.

Jika sync lambat:

1. Batch event yang aman dibatch.
2. Prioritaskan transaction bundle dan shift dibanding telemetry.
3. Kurangi payload master data.
4. Tambahkan acknowledgement ringan.
5. Pisahkan worker apply dari request path jika processing makin berat.

## UI Performance

Aturan:

- POS screen tidak boleh render list besar tanpa filter/search.
- Gunakan memoization hanya saat ada render cost nyata.
- Hindari refetch agresif; gunakan `staleTime` untuk dashboard/report.
- Loading, empty, dan error state harus ringan.
- Jangan memblokir checkout karena fetch dashboard/Shopee/AI gagal.
- Jangan membuat fitur POS yang hanya valid di browser; target cabang adalah desktop wrapper.

Jika UI lambat:

1. Cek render list dan component re-render.
2. Pindahkan derived calculation berat ke utility/memo.
3. Paginate/filter data.
4. Split component besar.
5. Hindari state global untuk state yang hanya dipakai lokal.

## Desktop Credential Storage

- Access dan refresh token Electron tidak boleh disimpan plaintext di
  `localStorage`.
- Renderer hanya mengakses session store melalui preload bridge yang sempit.
- Main process mengenkripsi token dengan Electron `safeStorage` sebelum menulis
  file di `app.getPath("userData")`.
- Jika enkripsi OS tidak tersedia, simpan token hanya di memory untuk session
  aktif dan jangan downgrade ke file plaintext.
- Browser fallback menyimpan token hanya di memory; token legacy di browser
  storage dibaca sekali lalu dihapus.

## Clean Code Rules

- Nama function harus menjelaskan aksi bisnis.
- Hindari function panjang; pecah jika membaca butuh scrolling berlebihan.
- Hindari boolean flag yang membuat behavior bercabang terlalu banyak.
- Komentar hanya untuk keputusan non-obvious, bukan menjelaskan syntax.
- Error handling harus memberi konteks operasional.
- Jangan menelan error tanpa log atau user-visible state.
- Test atau smoke harus mengikuti risk level perubahan.

## Refactor Triggers

Refactor saat salah satu terjadi:

- Satu service menangani beberapa domain.
- Query dashboard/report mulai lambat atau sering timeout.
- Duplikasi logic muncul di lebih dari dua tempat.
- Komponen frontend sulit dites atau punya terlalu banyak state.
- Sync handler punya banyak special case tanpa struktur.
- Permission checks tersebar tidak konsisten.

## Alternative Approaches

| Masalah | Pendekatan awal | Jika tidak cukup |
| --- | --- | --- |
| Dashboard lambat | Prisma aggregate/query langsung | Aggregation table/materialized view/cache |
| Sync request berat | Apply langsung di service | Queue worker async + acknowledgement |
| UI POS lambat | Component split dan local state | Virtualized list/search index lokal |
| Prisma query kompleks | `select/include` terukur | Raw SQL helper |
| Permission tersebar | Guard per endpoint | Policy service terpusat |
| AI worker ringan | Backend-generated insight | Dedicated Python service/job queue |
| Desktop packaging bermasalah | Electron + Next standalone server | Static export renderer jika route kompatibel |

## Review Checklist

Sebelum menyelesaikan task teknis:

- Apakah modul sesuai domain?
- Apakah POS local-first tetap aman?
- Apakah query punya filter/limit/index yang masuk akal?
- Apakah endpoint punya validation dan permission?
- Apakah sync/webhook idempotent?
- Apakah UI tidak melakukan fetch/render berat di jalur kritis?
- Apakah fitur local-first berjalan melalui Electron bridge dan siap dipaketkan?
- Apakah error penting dicatat?
- Apakah session handoff diperbarui?
