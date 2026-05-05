# Sprint 3 Frontend POS Modularity Knowledge

## 1. Tujuan

Dokumen ini mencatat hasil pengecekan awal Sprint 3 dan knowledge teknis untuk implementasi frontend POS desktop Omnia.

Sprint 3 berfokus pada:

- login UI yang dapat memakai backend auth Sprint 1
- role-aware desktop shell
- product dan branch price read path
- cart state
- checkout lokal
- payment record
- stock movement payload
- local sync queue record
- sync status dasar

## 2. Skill Scanner Review

Workflow yang diminta: `skill-scanner`.

Hasil pengecekan lokal:

- Lokasi skill: `C:\Users\ASUS\.codex\skills\skill-scanner`
- Struktur tersedia: `SKILL.md`
- Struktur tidak tersedia: `scripts/` dan `references/`
- Dampak: static scanner `scripts/scan_skill.py` tidak dapat dijalankan dari instalasi lokal
- Review manual: instruksi `SKILL.md` hanya berisi workflow audit skill, tidak berisi instruksi membaca secret, memodifikasi konfigurasi agent, allowlist, shell config, git hook, atau remote code execution

Assessment:

- Risk level: Low
- Aman dipakai sebagai workflow manual
- Keterbatasan: hasil scan otomatis tidak tersedia karena script bundled tidak ikut terpasang

## 3. Baseline Sebelum Revisi

Folder `apps/desktop-app/app` sebelumnya berisi page-level placeholder:

- `app/page.tsx`: role landing placeholder
- `app/login/page.tsx`: form statis tanpa submit ke backend
- `app/pos/page.tsx`: POS placeholder tanpa cart state
- `app/sync-status/page.tsx`: sync status statis
- `app/layout.tsx`: root provider
- `app/globals.css`: global style dasar

Risiko baseline:

- page component menampung UI dan logika sekaligus bila langsung dikembangkan
- belum ada boundary domain untuk auth, POS, local-first, dan sync
- belum ada cart state reusable
- checkout belum menghasilkan local transaction atau sync queue payload
- sync status belum membaca antrean lokal

## 4. Struktur Modular Setelah Revisi

Struktur domain baru:

```text
apps/desktop-app/features/
  auth/
    auth-service.ts
    login-form.tsx
  local-first/
    local-checkout-repository.ts
  pos/
    cart-store.ts
    demo-catalog.ts
    pos-types.ts
    pos-utils.ts
    pos-workspace.tsx
    product-service.ts
  shell/
    branch-workspace.tsx
  shift/
    shift-panel.tsx
  receipts/
    receipt-list.tsx
  sync/
    sync-status-panel.tsx
    sync-summary.ts
```

Struktur shared baru:

```text
apps/desktop-app/lib/
  api-client.ts
  app-state.ts
```

Prinsip modularitas:

- `app/*/page.tsx` hanya menjadi route entry point
- domain logic POS tidak berada di route file
- state global shell dipisah dari cart state
- local checkout repository menjadi boundary sementara sebelum ada SQLite bridge Electron
- API client dibuat terpusat agar kontrak response envelope konsisten

## 5. Fungsi dan Fitur Utama

### 5.1 API Client

File: `apps/desktop-app/lib/api-client.ts`

Fungsi:

- `getApiBaseUrl()`
  - membaca `NEXT_PUBLIC_API_BASE_URL`
  - fallback ke `http://localhost:3001/api/v1`
- `apiFetch<T>()`
  - memanggil backend API
  - membaca standard response envelope `{ success, data, error }`
  - menambahkan bearer token bila tersedia
  - melempar `ApiClientError` untuk response gagal

Dipakai oleh:

- auth login
- product catalog loading
- branch price loading

### 5.2 App State Store

File: `apps/desktop-app/lib/app-state.ts`

Fungsi:

- menyimpan role aktif
- menyimpan branch dan register context
- menyimpan session user
- menyimpan status online, shift, dan pending sync count
- menyediakan `roleFromApi()` untuk mapping role backend ke role frontend

Pattern:

- Zustand memakai `subscribeWithSelector`
- state dan actions dipisah lewat interface
- komponen memakai selector individual untuk mengurangi render ulang

### 5.3 Auth Service dan Login Form

File:

- `apps/desktop-app/features/auth/auth-service.ts`
- `apps/desktop-app/features/auth/login-form.tsx`

Fungsi:

- `loginWithPassword()`
  - memanggil `POST /auth/login`
  - mengirim `username`, `password`, dan `device_id`
  - mengubah response backend menjadi `SessionUser` dan `BranchContext`
- `LoginForm`
  - form login client-side
  - menyimpan session ke app state
  - redirect ke `/pos` setelah login berhasil
  - menampilkan error bila backend belum tersedia atau credential salah

### 5.4 Product Read Path

File: `apps/desktop-app/features/pos/product-service.ts`

Fungsi:

- `loadPosCatalog(branchId)`
  - memanggil `GET /products`
  - memanggil `GET /branches/{branch_id}/product-prices`
  - menggabungkan product dan branch price menjadi `PosProduct`
- `loadFallbackCatalog()`
  - memakai `demoCatalog` saat backend belum tersedia

Catatan:

- stock lokal masih memakai fallback demo karena belum ada bridge baca SQLite dari renderer
- saat bridge SQLite tersedia, `stockOnHand` dan `minimumQuantity` perlu dibaca dari `inventory_balances_local`

### 5.5 Cart Store

File: `apps/desktop-app/features/pos/cart-store.ts`

Fungsi:

- `addProduct(product)`
- `decrementProduct(productId)`
- `removeProduct(productId)`
- `setLineDiscount(productId, discountTotal)`
- `clearCart()`
- `setPaymentMethod(method)`
- `setPaymentStatus(status)`
- `setAmountReceived(amount)`

Proteksi dasar:

- quantity tidak melebihi `stockOnHand`
- item dengan quantity nol otomatis keluar dari cart
- item discount dibatasi agar tidak melebihi subtotal baris item

### 5.6 POS Utility

File: `apps/desktop-app/features/pos/pos-utils.ts`

Fungsi:

- `formatRupiah(value)`
  - format uang IDR
- `calculateCartTotals(lines)`
  - hitung subtotal
  - hitung discount total
  - hitung pajak 11%
  - hitung grand total
- `filterCatalog(products, query)`
  - cari berdasarkan nama, SKU, barcode, dan kategori

### 5.7 Local Checkout Repository

File: `apps/desktop-app/features/local-first/local-checkout-repository.ts`

Fungsi:

- `saveCheckoutLocally(input)`
  - membuat local transaction record
  - membuat payment record
  - membuat stock movement payload
  - membuat sync queue record tipe `transaction.bundle`
  - menyimpan sementara ke `localStorage`
- `listLocalSyncQueue()`
  - membaca antrean sync lokal
- `listLocalTransactions()`
  - membaca transaksi lokal

Catatan penting:

- implementasi ini adalah boundary sementara untuk Sprint 3 UI
- schema target tetap `apps/desktop-app/local-store/schema.sql`
- storage final sebaiknya berpindah ke SQLite lewat Electron IPC/preload bridge
- bentuk payload sengaja mengikuti kontrak Sprint 2 `POST /sync/bundles`

### 5.8 POS Workspace

File: `apps/desktop-app/features/pos/pos-workspace.tsx`

Fitur:

- search barcode/SKU/nama produk
- product list API-first dengan fallback demo cache
- cart add/remove/decrement
- payment method selector
- payment status selector
- amount received dan change untuk payment confirmation dasar
- local checkout save
- update pending sync count di status bar
- pesan hasil checkout berisi transaction number dan event id

### 5.9 Shift Panel

File: `apps/desktop-app/features/shift/shift-panel.tsx`

Fitur:

- menampilkan branch/register context
- open shift dan close shift dasar melalui app state
- opening cash dan closing cash input UI
- pending sync warning sebelum handoff shift

Catatan:

- event shift belum ditulis ke SQLite/sync queue
- finalisasi perlu mengikuti kontrak generic sync event Sprint 2

### 5.10 Receipt List

File: `apps/desktop-app/features/receipts/receipt-list.tsx`

Fitur:

- membaca transaksi lokal
- menampilkan transaction number, waktu, payment method, item, subtotal, discount, tax, total, dan pending sync status
- menjadi receipt preview dasar setelah checkout

### 5.11 Sync Summary

File:

- `apps/desktop-app/features/sync/sync-summary.ts`
- `apps/desktop-app/features/sync/sync-status-panel.tsx`

Fungsi:

- membaca queue lokal
- menghitung pending dan failed count
- menampilkan status transaksi, inventory movement, dan master data cache
- menampilkan tabel queue lokal berisi event type, entity, created time, attempts, dan status

## 6. Prosedur Checkout Lokal

Urutan prosedur:

1. Kasir membuka `/pos`.
2. UI mencoba membaca product dan branch price dari backend.
3. Jika backend tidak tersedia, UI memakai demo cache agar checkout tetap bisa diuji.
4. Kasir mencari produk melalui barcode, SKU, nama, atau kategori.
5. Kasir menambah item ke cart.
6. Cart store menghitung quantity per item.
7. `calculateCartTotals()` menghitung subtotal, tax, dan grand total.
8. Kasir memilih metode pembayaran.
9. Kasir mengisi status payment dan amount received bila perlu.
10. `saveCheckoutLocally()` membuat:

- transaction header
- transaction items
- payment record
- stock movement payload
- sync queue record

11. Cart dikosongkan.
12. Status bar memperbarui jumlah pending sync.
13. `/receipts` dapat membaca transaksi lokal sebagai receipt preview.
14. `/sync-status` dapat membaca queue lokal dan menampilkan status pending.

## 7. Batasan Saat Ini

- local write masih memakai `localStorage`, belum SQLite native
- belum ada IPC bridge untuk operasi SQLite dari renderer
- belum ada replay otomatis ke `POST /sync/bundles`
- shift open/close baru mengubah app state, belum membuat shift event lokal
- receipt preview baru membaca transaksi lokal sementara
- belum ada test automated untuk checkout UI

## 8. Rekomendasi Lanjutan Sprint 3

Prioritas berikutnya:

1. Tambahkan Electron IPC/preload API untuk SQLite local store.
2. Pindahkan `saveCheckoutLocally()` dari `localStorage` ke SQLite transaction.
3. Tambahkan sync replay worker di renderer/main process.
4. Tambahkan shift open/close UI dan queue event.
5. Tambahkan receipt preview setelah checkout.
6. Tambahkan smoke test untuk flow add item, checkout, dan sync queue.

## 9. Quality Gate

Quality gate minimum Sprint 3:

- `pnpm --filter @omnia/desktop-app lint`
- `pnpm --filter @omnia/desktop-app typecheck`
- `pnpm --filter @omnia/desktop-app build`
- smoke manual:
  - buka `/pos`
  - add product
  - pilih payment method
  - save checkout
  - buka `/sync-status`
  - pastikan pending transaction bertambah
