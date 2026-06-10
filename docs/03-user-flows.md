# User Flows

Dokumen ini merangkum flow operasional utama MVP. Detail UI mengikuti `09-ui-design-guide.md`; detail API mengikuti `06-api-contract.md`.

## Login dan Role Routing

1. User login.
2. Backend mengembalikan token, role, user context, dan branch context.
3. App mengarahkan user ke workspace sesuai role.
4. Sidebar hanya menampilkan menu yang relevan, tetapi authorization tetap harus dijaga backend.

## Cashier: POS Checkout

1. Cashier membuka POS.
2. Cashier mencari/scan produk.
3. App menambahkan item ke cart dan menghitung subtotal, diskon dasar, pajak jika ada, dan total.
4. Cashier mencatat pembayaran manual.
5. App menulis transaksi, item, payment, stock movement, dan sync queue ke SQLite lokal.
6. Receipt preview ditampilkan.
7. Jika online, data masuk replay sync; jika offline, status menjadi pending sync.

## Cashier: Shift

1. Cashier membuka shift dengan register dan opening cash.
2. Transaksi berjalan dalam konteks shift.
3. Sebelum close, app menampilkan preview rekonsiliasi dari SQLite lokal:
   total sales, cash, non-cash, expected cash, closing cash, dan variance.
4. Cashier menutup shift dengan closing cash setelah variance terlihat.
5. Event `shift.opened` dan `shift.closed` masuk sync queue; close event
   membawa metadata rekonsiliasi.

## Supervisor: Inventory Adjustment

1. Supervisor membuka inventory.
2. Supervisor memilih produk/cabang dan tipe movement.
3. App menulis stock movement lokal dan update local balance.
4. Event `stock_movement.created` masuk sync queue.
5. Backend pusat mengaplikasikan movement secara idempotent.

## HQ Admin: Master Data dan Monitoring

1. HQ Admin mengelola master data dasar.
2. HQ Admin memantau sync jobs/logs dan branch health.
3. HQ Admin melihat audit log.
4. Perubahan penting harus tercatat sebagai audit event.

## Dashboard

1. Supervisor melihat dashboard cabang.
2. HQ Admin dan Executive melihat dashboard pusat.
3. Dashboard membaca central DB, bukan local store cabang.
4. Cashier tidak boleh melihat dashboard pusat.

## Removed Marketplace Integration

Shopee dan marketplace integration tidak lagi menjadi flow aktif MVP. Menu,
endpoint, smoke check, dan copy produk terkait Shopee sudah dihapus dari active
surface; legacy schema marketplace tetap inert sampai data-retention cleanup
diputuskan.

## LLM Insights

1. HQ Admin atau Executive membuka LLM Insights.
2. User menjalankan atau membaca hasil generation terbaru.
3. Backend mengambil konteks central DB yang bounded: sales, inventory, sync, audit, dan branch context.
4. Backend memanggil LLM provider memakai API key server-side.
5. Backend memvalidasi structured output sebelum menyimpan insight.
6. Sistem menampilkan severity, confidence, rekomendasi, reference data, provider/model metadata, dan status generation.
7. LLM tidak mengubah stok, harga, order, payment, sync, atau master data.

## Sync Recovery

1. Saat koneksi kembali, app menjalankan replay queue.
2. Backend memvalidasi event/bundle.
3. Event yang sudah pernah diproses dikembalikan sebagai duplicate/idempotent success.
4. Error ditulis ke sync log untuk monitoring.
