# Sprint 1 Backend Scalability and Modularity Knowledge

## 1. Tujuan Dokumen

Dokumen ini mengecek ulang fondasi Sprint 1 Omnia dari sisi:

- modularitas NestJS
- validasi request dengan Zod dan class-validator
- desain Prisma schema
- pola query dan performa
- keputusan apakah fitur perlu dibuat lebih modular sekarang atau nanti

Dokumen ini memakai acuan kerja dari:

- `zod-validation-expert`
- `nestjs-expert`
- `prisma-expert`
- `docs/Sprint-Roadmap-Implementation-Hybrid-Omnichannel-Smart-POS.md`
- `docs/API-Contract-Hybrid-Omnichannel-Smart-POS.md`
- `docs/ERD-Awal-Hybrid-Omnichannel-Smart-POS.md`

## 2. Ringkasan Status Sprint 1

Sprint 1 sudah bergerak dari skeleton menuju backend foundation yang usable untuk master data dan auth awal.

Fitur yang sudah tersedia:

| Area | Status | Catatan |
| --- | --- | --- |
| Auth login | Usable awal | Login membaca user dari Prisma, verifikasi password scrypt, update `lastLoginAt`, dan mencatat audit log login. |
| Token auth | Usable awal | Token HMAC internal sederhana sudah diverifikasi oleh `AuthGuard`; belum memakai library JWT production-grade. |
| Users | Read API | `GET /api/v1/users` membaca user aktif dengan role dan branch. |
| Roles | Read API | `GET /api/v1/roles` membaca role aktif. |
| Branches | Read API | `GET /api/v1/branches` membaca branch aktif. |
| Registers | Read API | `GET /api/v1/registers` membaca register aktif dengan branch. |
| Categories | Read API | `GET /api/v1/categories` membaca category aktif. |
| Products | Read API | `GET /api/v1/products` membaca product aktif dengan category. |
| Branch prices | Read API | `GET /api/v1/branches/:branchId/product-prices` membaca harga aktif per cabang. |
| Sync event receive | Skeleton usable | `POST /api/v1/sync/events` menerima event tervalidasi dan enqueue ke BullMQ. |
| Prisma schema | Baik untuk MVP | Model utama, relation, enum, unique constraint, dan index dasar sudah ada. |
| Seed data | Cukup untuk demo Sprint 1 | Role MVP, user demo, branch, register, product, price, inventory, stock movement, sales channel, dan shift sudah dibuat. |

## 3. Evaluasi Modularitas NestJS

### 3.1 Struktur Saat Ini

Backend sudah memakai feature module per domain:

- `AuthModule`
- `UsersModule`
- `RolesModule`
- `BranchesModule`
- `RegistersModule`
- `CategoriesModule`
- `ProductsModule`
- `SyncModule`
- `QueueModule`
- `PrismaModule`
- `HealthModule`

Pola ini sudah modular untuk Sprint 1 karena controller, service, dan module dipisah per boundary bisnis.

### 3.2 Kualitas Module Boundary

| Module | Boundary saat ini | Penilaian |
| --- | --- | --- |
| Auth | Login, token verification, current user | Tepat, tetapi perlu dipisah lagi saat refresh token, permission, dan session management mulai kompleks. |
| Users/Roles | Master data user dan role | Tepat untuk read API Sprint 1. Untuk RBAC production, buat `PermissionsModule` atau `AccessControlModule`. |
| Branches/Registers | Struktur outlet dan terminal kasir | Tepat. Branch price saat ini ada di `BranchesService`, masih masuk akal karena route berbasis branch. |
| Products/Categories | Product catalog dan taxonomy | Tepat. Saat pricing makin kompleks, `PricingModule` sebaiknya dipisah dari `BranchesModule`. |
| Sync/Queue | Receive event dan enqueue job | Tepat. Saat apply event ke DB dibuat, pecah worker/processor dan conflict resolver. |
| Prisma | Database client provider | Tepat sebagai shared infrastructure module. |

### 3.3 Keputusan: Perlu Modular Lagi Sekarang?

Belum perlu memecah semua module lebih jauh. Untuk Sprint 1, struktur sekarang sudah cukup modular, mudah dibaca, dan tidak over-engineered.

Yang perlu disiapkan sebagai refactor point:

| Kapan | Aksi modularisasi |
| --- | --- |
| Permission matrix mulai dipakai di endpoint | Tambah `AccessControlModule` berisi guards/decorators untuk role dan branch scope. |
| Branch price mulai punya create/update/history/approval | Pisahkan `PricingModule` dari `BranchesModule`. |
| Product makin banyak field, variant, barcode, dan search | Tambah repository/query helper khusus product catalog. |
| Sync mulai apply event ke central DB | Pisah `SyncProcessor`, `SyncEventRepository`, `ConflictResolverService`, dan `IdempotencyService`. |
| Dashboard/report mulai memakai agregasi berat | Pisah `ReportsModule` dan gunakan query teroptimasi/SQL view/materialized view bila perlu. |

## 4. Evaluasi Validasi Zod dan DTO

### 4.1 Pola Saat Ini

Saat ini backend memakai dua pola validasi:

- Zod untuk environment validation dan login schema.
- class-validator untuk `SyncEventDto`.
- Global `ValidationPipe` aktif di `main.ts`.
- `ZodValidationPipe` tersedia untuk schema Zod per route.

Pola ini berjalan, tetapi ada konsekuensi maintenance: tim harus menjaga dua gaya validasi sekaligus.

### 4.2 Penilaian

| Area | Penilaian |
| --- | --- |
| Environment validation | Baik. `safeParse` dipakai dan error dibuat fail-fast. |
| Login validation | Baik. `loginSchema` memakai Zod dan type inference. |
| Sync event validation | Cukup. class-validator valid, tetapi tipe event lebih mudah konsisten jika dipindah ke Zod enum/schema. |
| Error format | Cukup. `ZodValidationPipe` sudah mengembalikan `VALIDATION_ERROR`; class-validator error format masih mengikuti default NestJS. |

### 4.3 Rekomendasi Validasi

Untuk konsistensi jangka panjang, pilih satu pendekatan utama:

| Pilihan | Kapan dipakai | Rekomendasi Omnia |
| --- | --- | --- |
| Zod-first DTO | Jika ingin type inference kuat dan schema bisa dipakai ulang frontend/backend | Direkomendasikan untuk Omnia karena ada shared packages dan frontend desktop. |
| class-validator DTO | Jika ingin Swagger metadata otomatis lebih mudah | Boleh dipakai untuk endpoint yang butuh dokumentasi Swagger cepat, tetapi jangan campur tanpa aturan. |

Rekomendasi praktis:

- Jadikan Zod sebagai source of truth untuk request body dan query param baru.
- Simpan schema dekat domain, contoh `auth/dto.ts`, `sync/sync.schema.ts`, `products/products.schema.ts`.
- Gunakan `z.infer<typeof Schema>` untuk type service input.
- Buat response mapper terpisah bila payload mulai kompleks.
- Jika Swagger schema otomatis penting, tambahkan class DTO khusus dokumentasi atau gunakan adapter yang konsisten.

## 5. Evaluasi Prisma Schema

### 5.1 Kekuatan Schema Saat Ini

Schema sudah cukup kuat untuk MVP karena:

- model inti sudah mencakup role, user, branch, register, category, product, price, inventory, stock movement, shift, transaction, payment, sales channel, sync job, sync log, dan audit log
- enum dipakai untuk status yang fixed
- unique constraint tersedia untuk identifier penting seperti `username`, `email`, `branch.code`, `product.sku`, `product.barcode`, `sync_logs.event_id`, dan `sync_logs.idempotency_key`
- composite unique tersedia untuk relasi yang tidak boleh dobel seperti `branchId + code`, `branchId + productId`, dan `productId + variantName + variantValue`
- index dasar tersedia untuk relation key dan query umum
- `@@map` menjaga nama tabel database tetap snake_case

### 5.2 Area yang Sudah Scalable untuk MVP

| Area | Alasan |
| --- | --- |
| Branch scoped data | Banyak model utama punya `branchId`, cocok untuk multi-cabang. |
| Product pricing per branch | `BranchProductPrice` terpisah dari `Product`, cocok untuk harga beda per cabang. |
| Inventory ledger | `InventoryBalance` dan `StockMovement` dipisah, cocok untuk audit stok. |
| Offline sync | `SyncJob` dan `SyncLog` sudah punya status, idempotency, payload, dan event metadata. |
| Auditability | `AuditLog` tersedia untuk perubahan penting. |

### 5.3 Risiko Schema untuk Scale Berikutnya

| Risiko | Dampak | Rekomendasi |
| --- | --- | --- |
| Soft-delete filter belum punya composite index `isActive + order field` | List data aktif bisa melambat saat data membesar | Tambah index bertahap seperti `[isActive, name]`, `[isActive, code]`, atau `[branchId, isActive]` sesuai query nyata. |
| `SalesTransaction.transactionNo` global unique | Jika nomor transaksi dibuat per branch/register, global unique bisa terlalu ketat atau format harus selalu global | Pertimbangkan `@@unique([branchId, registerId, transactionNo])` saat Sprint POS nyata. |
| Branch price hanya unique `branchId + productId` | Tidak mendukung histori harga aktif per periode | Jika butuh histori, ubah menjadi price history dengan constraint aktif-periode atau table terpisah. |
| `payload Json` di `SyncLog` bisa besar | Query log bisa berat dan storage cepat membesar | Simpan payload ringkas, archive payload lama, atau pindahkan payload besar ke object storage/reference. |
| Auth token/session belum dimodelkan | Revocation/logout multi-device belum kuat | Tambah `UserSession` atau `RefreshToken` saat auth production-grade. |

## 6. Evaluasi Query dan Performa

### 6.1 Query Saat Ini

Read API saat ini memakai `findMany`, `where: { isActive: true }`, `orderBy`, dan beberapa `include`.

Pola ini aman untuk seed/demo dan data kecil. Untuk produksi, perlu peningkatan:

- pagination untuk list endpoint
- `select` eksplisit daripada `include: true`
- filter query param yang tervalidasi
- index sesuai pola filter dan sorting

### 6.2 Rekomendasi per Endpoint

| Endpoint | Kondisi sekarang | Rekomendasi performa |
| --- | --- | --- |
| `GET /users` | `include role, branch` lalu map manual | Gunakan `select`, tambah pagination, filter role/branch, index `[isActive, fullName]`. |
| `GET /roles` | List kecil | Tetap sederhana; role biasanya kecil dan bisa dicache. |
| `GET /branches` | List branch aktif | Tambah `select`; index `[isActive, code]` jika branch bertambah banyak. |
| `GET /registers` | Include branch dan order by branch code | Gunakan `select`; pertimbangkan query berbasis `branchId` untuk UI cabang. |
| `GET /categories` | List aktif | Tambah `select`; jika category tree besar, buat endpoint tree/cache. |
| `GET /products` | Include category | Tambah pagination/search, `select`, filter category, index search lanjutan untuk SKU/barcode/name. |
| `GET /branches/:branchId/product-prices` | Filter branch + active + product active | Tambah `select`, pagination/search, dan index `[branchId, isActive]` bila data harga besar. |
| `POST /sync/events` | Enqueue by idempotency key | Baik untuk skeleton; perlu persist `SyncLog` sebelum/bersamaan enqueue agar recovery lebih kuat. |

### 6.3 Pola Query yang Direkomendasikan

Gunakan `select` untuk mencegah over-fetching:

```typescript
const products = await prisma.product.findMany({
  where: { isActive: true },
  orderBy: { name: "asc" },
  take: limit,
  skip: offset,
  select: {
    id: true,
    sku: true,
    barcode: true,
    name: true,
    unit: true,
    category: {
      select: {
        id: true,
        name: true,
      },
    },
  },
});
```

Gunakan pagination contract seragam:

```typescript
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});
```

## 7. Dokumentasi Fungsi dan Fitur yang Digunakan

### 7.1 NestJS

| Fitur | Dipakai di | Fungsi |
| --- | --- | --- |
| `@Module` | Semua `*.module.ts` | Mengelompokkan controller/provider per domain. |
| `@Controller` | Semua `*.controller.ts` | Mendefinisikan route HTTP. |
| `@Injectable` | Semua service | Menjadikan class provider yang bisa diinjeksi. |
| Dependency Injection | Service constructor | Menghubungkan service dengan Prisma, Queue, Auth, dan Config tanpa instansiasi manual. |
| `@UseGuards` | Sync controller dan auth route tertentu | Melindungi endpoint dengan token auth. |
| `OnModuleDestroy` | `PrismaService`, `QueueService` | Menutup koneksi database/queue saat app berhenti. |
| `ConfigModule.forRoot` | `AppModule` | Memuat dan memvalidasi environment secara global. |
| Global prefix | `main.ts` | Menetapkan base path `/api/v1`. |
| SwaggerModule | `main.ts` | Membuka dokumentasi API di `/api/v1/docs`. |

### 7.2 Zod

| Fitur | Dipakai di | Fungsi |
| --- | --- | --- |
| `z.object` | env dan auth dto | Membuat schema runtime. |
| `z.enum` | env validation | Membatasi nilai fixed seperti `APP_ENV` dan `LOG_LEVEL`. |
| `z.coerce.number` | env validation | Mengubah string env `PORT` menjadi number sebelum validasi. |
| `safeParse` | env validation dan `ZodValidationPipe` | Validasi tanpa try/catch dan menghasilkan error terstruktur. |
| `z.infer` | `LoginDto`, `ValidatedEnvironment` | Menghasilkan TypeScript type dari schema runtime. |

### 7.3 Prisma

| Fitur | Dipakai di | Fungsi |
| --- | --- | --- |
| `PrismaClient` | `PrismaService` | Client database utama. |
| `findMany` | List endpoint | Membaca data list. |
| `findFirst` / `findUnique` | Auth dan seed | Mencari record spesifik. |
| `upsert` | Seed | Membuat seed idempotent agar bisa dijalankan berulang. |
| `include` | List dengan relation | Mengambil relation terkait; perlu diganti `select` saat data membesar. |
| `@@index` | `schema.prisma` | Mempercepat query filter/sort tertentu. |
| `@@unique` | `schema.prisma` | Menjaga constraint data bisnis. |
| `Decimal` | price, stock, payment | Menjaga presisi angka uang dan quantity. |
| `Json` | sync payload | Menyimpan event payload fleksibel. |

### 7.4 BullMQ / Redis

| Fitur | Dipakai di | Fungsi |
| --- | --- | --- |
| `Queue` | `QueueService` | Mengantrikan sync event agar diproses async. |
| `jobId` | `enqueueSyncEvent` | Menjadi idempotency key agar event dobel tidak diproses sebagai job berbeda. |
| `removeOnComplete` / `removeOnFail` | Queue options | Menahan jumlah job history agar Redis tidak cepat membengkak. |

## 8. Keputusan Arsitektur untuk Knowledge Base

### 8.1 Yang Tetap Sederhana Dulu

Tetap sederhana pada Sprint 1:

- read-only master data service
- role list
- branch/register/product/category list
- seed data demo
- basic auth guard

Alasannya: domain belum kompleks dan kebutuhan utama Sprint 1 adalah foundation yang mudah dipakai frontend dan POS local cache.

### 8.2 Yang Harus Modular Saat Mulai Kompleks

Wajib dipisah saat fitur bertambah:

- permission dan branch scope guard
- pricing history dan approval
- product search/catalog cache
- sync apply processor
- idempotency persistence
- transaction/payment/stock write flow
- report aggregation
- Shopee webhook processor

### 8.3 Target Refactor Sprint 1 Berikutnya

Prioritas teknis berikutnya:

1. Standarkan request validation ke Zod-first untuk endpoint baru.
2. Tambahkan pagination/query schema untuk list endpoint yang bisa membesar.
3. Ganti `include: true` menjadi `select` eksplisit.
4. Tambahkan permission/branch scope guard sebelum write endpoint dibuka.
5. Tambahkan model session/refresh token jika auth akan dipakai lebih serius.
6. Simpan sync event ke `SyncLog` sebelum enqueue agar recovery lebih reliable.
7. Tambahkan test service untuk auth, master data list, dan sync enqueue.

## 9. Kesimpulan

Data model dan module Sprint 1 sudah cukup scalable dan modular untuk MVP foundation. Tidak perlu memecah semua domain sekarang.

Namun, untuk performa terbaik saat data mulai besar, Sprint 1 perlu dilanjutkan dengan pagination, `select` eksplisit, index berdasarkan query nyata, validasi Zod yang konsisten, dan guard permission/branch scope. Modularisasi lanjutan sebaiknya dilakukan saat domain mulai punya write flow, history, approval, processor async, atau aggregation berat.
