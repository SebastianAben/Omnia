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
3. Cashier menutup shift dengan closing cash.
4. Event `shift.opened` dan `shift.closed` masuk sync queue.

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

## Shopee Integration

1. HQ Admin menghubungkan store Shopee.
2. HQ Admin membuat SKU mapping ke produk internal.
3. Webhook/order import diterima backend.
4. Backend menyimpan webhook event, integration job/log, order, dan item.
5. Duplicate webhook tidak boleh membuat order ganda.
6. Job gagal dapat diretry.

## AI Insights

1. HQ Admin atau Executive membuka AI Insights.
2. Sistem menampilkan low stock, stockout prediction, severity, confidence, dan reference data.
3. AI tidak mengubah stok, harga, atau order.

## Sync Recovery

1. Saat koneksi kembali, app menjalankan replay queue.
2. Backend memvalidasi event/bundle.
3. Event yang sudah pernah diproses dikembalikan sebagai duplicate/idempotent success.
4. Error ditulis ke sync log untuk monitoring.

