# Sync Specification Detail

## 1. Informasi Dokumen

- Nama produk: Omnia
- Nama dokumen: Sync Specification Detail
- Versi: 1.0
- Tanggal: 2026-04-28
- Referensi:
  - `docs/PRD-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/MVP-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/High-Level-Architecture-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/User-Flow-Utama-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/ERD-Awal-Hybrid-Omnichannel-Smart-POS.md`

## 2. Tujuan Dokumen

Dokumen ini mendefinisikan aturan sinkronisasi detail antara cabang dan pusat untuk MVP Omnia.

Fokus dokumen:

- alur sync transaksi dan stok
- perilaku online dan offline
- struktur event logis
- lifecycle status sync
- retry, replay, dan conflict handling
- boundary tanggung jawab cabang dan pusat

## 3. Prinsip Sinkronisasi

- Operasional POS tidak boleh menunggu sinkronisasi pusat.
- Semua write operasional cabang ditulis dulu ke local store.
- Sinkronisasi ke pusat dilakukan asynchronous.
- Semua event harus idempotent.
- Pusat adalah pengambil keputusan akhir saat konflik.
- Semua sync harus observable dan auditable.
- Sync harus mendukung recovery setelah cabang offline.

## 4. Ruang Lingkup Sync MVP

Sinkronisasi MVP mencakup:

- transaksi POS dari cabang ke pusat
- item transaksi dari cabang ke pusat
- payment record dari cabang ke pusat
- stock movement dari cabang ke pusat
- perubahan status shift dasar dari cabang ke pusat
- master data tertentu dari pusat ke cabang
- harga per cabang dari pusat ke cabang
- status integrasi dan hasil konsolidasi dari pusat ke cabang

Belum termasuk pada MVP:

- payment gateway callback sync
- retur
- sinkronisasi antar marketplace banyak channel
- conflict resolution otomatis yang kompleks

## 5. Arah Sinkronisasi

### 5.1 Branch to Center

Data utama yang dikirim dari cabang ke pusat:

- sales transaction
- sales transaction item
- payment record
- stock movement
- shift open/close event
- audit event lokal tertentu

### 5.2 Center to Branch

Data utama yang dikirim dari pusat ke cabang:

- master produk
- kategori
- harga per cabang
- status aktif/nonaktif produk
- hasil resolusi konflik
- status sync acknowledgement

### 5.3 Center Internal Sync

Di dalam pusat, data diteruskan ke:

- reporting jobs
- AI jobs
- Shopee integration jobs
- monitoring dan audit layer

## 6. Model Konseptual Sinkronisasi

Setiap perubahan penting di cabang menghasilkan dua hal:

1. perubahan data operasional lokal
2. event sinkronisasi

Artinya:

- transaksi dibuat lokal dulu
- stok lokal berubah dulu
- event sync dibuat setelah write lokal sukses

## 7. Entitas Sync Utama

Mengacu ke ERD awal, entitas sync utama pada MVP:

- `sales_transactions`
- `sales_transaction_items`
- `payments`
- `stock_movements`
- `shifts`
- `products`
- `branch_product_prices`
- `inventory_balances` untuk hasil konsolidasi tertentu

## 8. Unique ID Strategy

### 8.1 Global Entity ID

Setiap record utama harus memiliki identifier unik global.

Contoh:

- transaction_id
- stock_movement_id
- payment_id
- sync_job_id

Prinsip:

- ID dibentuk di sisi pembuat record
- ID tidak berubah setelah sync
- Pusat memakai ID ini untuk deduplication

### 8.2 Business Reference

Selain global ID, beberapa entitas memiliki business reference:

- transaction_no
- external_order_id Shopee
- branch code
- register code

Business reference dipakai untuk kebutuhan operasional dan pelacakan, tetapi deduplication utama tetap memakai global ID atau event ID.

### 8.3 Event ID

Setiap payload sync harus memiliki:

- event_id
- entity_type
- entity_id
- branch_id
- created_at
- event_version

Contoh:

- event_id: UUID
- entity_type: `sales_transaction`
- entity_id: UUID transaksi

## 9. Event Type pada MVP

Event logis minimum:

- `transaction.created`
- `transaction.voided`
- `payment.recorded`
- `stock_movement.created`
- `shift.opened`
- `shift.closed`
- `product.updated`
- `branch_price.updated`
- `conflict.resolved`

Catatan:

- Walau ada event `transaction.voided`, void flow tetap perlu diatur oleh permission.
- Retur tidak ada pada MVP.

## 10. Struktur Payload Logis

### 10.1 Envelope Standar

Setiap event sync minimal memiliki struktur logis:

- event_id
- event_type
- event_version
- branch_id
- source_system
- source_mode
- entity_type
- entity_id
- occurred_at
- produced_by_user_id opsional
- payload

### 10.2 Source System

Contoh:

- `branch_app`
- `central_service`
- `shopee_integration`

### 10.3 Source Mode

Contoh:

- `online`
- `offline_replay`

## 11. Lifecycle Status Sync

### 11.1 Status di Cabang

Status logis minimum untuk setiap event lokal:

- `pending`
- `queued`
- `processing`
- `synced`
- `failed`
- `conflict`

### 11.2 Status di Pusat

Status logis minimum pada penerimaan pusat:

- `received`
- `validated`
- `applied`
- `rejected`
- `duplicate_ignored`
- `conflict_detected`
- `resolved`

## 12. Alur Sync Branch to Center

### 12.1 Transaksi POS Saat Online

1. Kasir menyelesaikan transaksi.
2. Aplikasi menulis transaksi ke local database.
3. Aplikasi menulis item transaksi ke local database.
4. Aplikasi menulis payment record ke local database.
5. Aplikasi menulis stock movement ke local database.
6. Aplikasi membuat sync events terkait.
7. Event dimasukkan ke local sync queue.
8. Sync worker cabang mengirim event ke pusat.
9. Pusat memvalidasi event.
10. Pusat menerapkan perubahan ke central DB.
11. Pusat mengirim acknowledgement.
12. Status lokal berubah menjadi `synced`.

### 12.2 Transaksi POS Saat Offline

1. Kasir menyelesaikan transaksi.
2. Semua data ditulis ke local database.
3. Event dibuat dengan `source_mode = offline_replay`.
4. Event disimpan di local queue dengan status `pending`.
5. Saat koneksi kembali, sync worker memproses queue berdasarkan urutan.
6. Pusat menerima, memvalidasi, dan menerapkan event.
7. Status lokal berubah menjadi `synced` atau `failed` atau `conflict`.

## 13. Urutan Event yang Harus Dijaga

Untuk satu transaksi POS, urutan logis yang disarankan:

1. `transaction.created`
2. `payment.recorded`
3. `stock_movement.created`

Catatan:

- Secara implementasi payload bisa dibundling, tetapi pusat harus tetap bisa memahami dependensi logisnya.
- Jika dibundling, pusat tetap harus memproses bagian transaksi lebih dulu daripada penurunan stok yang terkait.

## 14. Bundling vs Single Event

### Pendekatan yang Disarankan untuk MVP

Untuk transaksi POS, gunakan `transaction bundle sync`.

Satu bundle dapat memuat:

- header transaksi
- item transaksi
- payment records
- stock movements terkait

Keuntungan:

- lebih mudah menjaga konsistensi transaksi
- lebih mudah replay saat offline
- lebih mudah audit satu transaksi penuh

Untuk update master data dari pusat, event bisa dikirim per entitas.

## 15. Alur Sync Center to Branch

### 15.1 Master Data Update

1. HQ Admin mengubah produk atau harga per cabang di pusat.
2. Pusat menyimpan perubahan.
3. Pusat membuat outbound sync event untuk cabang relevan.
4. Cabang mengambil atau menerima update.
5. Cabang memvalidasi versi update.
6. Cabang memperbarui cache lokal.
7. Cabang mengirim acknowledgement.

### 15.2 Conflict Resolution Update

1. Pusat menyelesaikan konflik.
2. Pusat membuat event `conflict.resolved`.
3. Cabang menerima hasil final.
4. Cabang menyesuaikan data lokal sesuai hasil pusat.

## 16. Data Versioning

Untuk entitas master tertentu, perlu metadata versi logis:

- version_no atau revision_no
- updated_at
- updated_by

Disarankan untuk:

- products
- branch_product_prices
- inventory_balances hasil konsolidasi tertentu

Tujuan:

- membantu mendeteksi update lama
- membantu penerapan aturan last known central state

## 17. Idempotency Rules

### 17.1 Aturan Umum

Pusat harus dapat menerima event yang sama lebih dari sekali tanpa menciptakan duplikasi data.

Cara logis:

- simpan `event_id`
- simpan `entity_id`
- simpan hash atau fingerprint jika perlu

### 17.2 Duplicate Handling

Jika event dengan `event_id` yang sama diterima kembali:

- jangan terapkan ulang perubahan
- catat sebagai `duplicate_ignored`
- kembalikan acknowledgement aman ke pengirim

### 17.3 Entity-Level Protection

Jika event_id berbeda tetapi entity dan state perubahan ternyata identik:

- pusat dapat menandai untuk pemeriksaan logis atau dedup lanjutan sesuai aturan implementasi

## 18. Validation Rules Saat Event Masuk ke Pusat

Pusat minimal memvalidasi:

- branch_id valid
- entity_type valid
- entity_id valid
- schema payload valid
- referensi user/register/branch konsisten
- referensi product ada
- harga dan quantity tidak melanggar rule dasar
- event belum pernah diterapkan

Jika validasi gagal:

- event ditolak
- status jadi `failed` atau `rejected`
- error dicatat di sync log

## 19. Conflict Detection Rules

Konflik minimal yang harus dikenali di MVP:

- data cabang terlambat dan bertabrakan dengan keputusan pusat
- update stok atau data master datang dari cabang setelah pusat sudah memutuskan versi final lain
- dua cabang mengirim perubahan yang memengaruhi state pusat yang sama secara bertentangan

### Aturan Final

- pusat memiliki keputusan final
- cabang tidak menyelesaikan konflik secara mandiri
- hasil konflik harus dicatat dan dikirim balik ke cabang

## 20. Retry Strategy

### 20.1 Retry di Cabang

Retry dilakukan untuk:

- timeout koneksi
- server pusat tidak tersedia
- response sementara gagal

Retry tidak langsung dilakukan tanpa batas.

Minimum fields pada retry state:

- attempt_count
- last_attempt_at
- next_retry_at
- last_error_code

### 20.2 Retry Policy Logis

Disarankan:

- retry cepat untuk beberapa percobaan awal
- retry bertahap lebih jarang setelah beberapa kali gagal
- event tetap tinggal di queue sampai sukses, conflict, atau dipindahkan ke failed review

### 20.3 Retry di Pusat

Retry di pusat berlaku untuk:

- Shopee webhook processing
- outbound branch data updates
- reporting jobs
- AI jobs

## 21. Replay Strategy

Saat cabang kembali online:

1. sistem mendeteksi koneksi pulih
2. queue lokal dibaca berdasarkan urutan dibuat
3. event dikirim satu per satu atau per bundle
4. setiap hasil ack memperbarui status queue
5. jika ada event conflict, event berikutnya dapat ditahan jika perlu bergantung pada implementasi domain

Prinsip:

- replay harus deterministik
- urutan transaksi satu cabang harus stabil

## 22. Acknowledgement Model

Pusat minimal mengembalikan:

- event_id
- entity_id
- result_status
- processed_at
- message opsional

Contoh `result_status`:

- synced
- duplicate_ignored
- failed_validation
- conflict

## 23. Sync Queue Behavior di Cabang

### 23.1 Queue Rules

- queue harus persisten
- queue tidak boleh hilang saat aplikasi restart normal
- queue harus dapat menampung transaksi offline
- queue harus dapat difilter berdasarkan status

### 23.2 Queue Priority

Disarankan prioritas:

1. transaction bundles
2. stock adjustments
3. shift events
4. non-critical audit or auxiliary sync

## 24. Master Data Sync Rules

### 24.1 Produk

- pusat adalah sumber utama
- cabang menerima perubahan produk
- cabang tidak menjadi editor utama produk pada MVP

### 24.2 Harga Per Cabang

- pusat adalah sumber utama
- harga per cabang dikirim ke cabang terkait
- cabang menggunakan harga terbaru yang sudah tersinkron

### 24.3 Kategori

- pusat adalah sumber utama

## 25. Inventory Sync Rules

### 25.1 Local Update First

Setelah transaksi cabang:

- stok lokal berubah segera
- pusat menerima stock movement melalui sync

### 25.2 Central Consolidation

Pusat:

- menerima stock movement
- memperbarui ledger pusat
- memperbarui snapshot stok pusat per cabang

### 25.3 Conflict Rule

Jika snapshot lokal dan pusat berbeda karena konflik:

- pusat menjadi keputusan final
- cabang menerima hasil konsolidasi pusat pada sync berikutnya

## 26. Transaction Sync Rules

### 26.1 Transaction Completeness

Satu transaksi dianggap lengkap untuk sync jika minimal memiliki:

- header transaksi
- minimal satu item
- total final
- payment status
- branch_id
- register_id
- cashier_user_id
- transaction_datetime

### 26.2 Transaction Finality

Pada MVP, transaksi POS yang sudah dikonfirmasi di cabang dianggap final secara operasional lokal.

Pusat:

- menerima
- mengonsolidasikan
- dapat menandai conflict jika data tidak valid atau bertabrakan

## 27. Payment Record Sync Rules

Karena MVP belum memakai payment gateway langsung:

- payment hanya dicatat sebagai record transaksi
- record payment ikut bundle transaksi atau dikirim berdekatan
- pusat menyimpan payment method dan payment status sebagai data operasional

Contoh status:

- pending
- paid
- partially_paid

## 28. Shift Sync Rules

Saat shift dibuka atau ditutup:

- event shift disimpan lokal
- event dikirim ke pusat
- pusat menyimpan histori shift untuk audit dan reporting dasar

## 29. Shopee Integration Sync Rules

### 29.1 Inbound from Shopee

1. Shopee mengirim webhook ke pusat.
2. Pusat memvalidasi webhook.
3. Pusat memeriksa idempotency berdasarkan external_order_id dan event reference yang sesuai.
4. Pusat memetakan SKU channel ke produk internal.
5. Pusat membuat `online_order` dan `online_order_items`.
6. Pusat memicu update stok atau status terkait sesuai rule MVP.

### 29.2 Outbound to Shopee

Outbound minimum MVP:

- sinkron stok dasar
- update status order jika memang diimplementasikan pada scope teknis

### 29.3 Error Handling

Jika mapping SKU tidak ditemukan:

- event tidak boleh mengganggu POS
- order ditandai butuh perhatian
- error dicatat

## 30. Failure Scenarios

### 30.1 Cabang Offline Lama

Risiko:

- queue menumpuk
- pusat sudah memiliki keputusan yang lebih baru

Perlakuan:

- replay tetap dilakukan
- pusat melakukan validasi conflict
- pusat mengirim hasil final ke cabang

### 30.2 Event Duplicate

Perlakuan:

- abaikan penerapan ulang
- log duplicate
- kembalikan ack aman

### 30.3 Invalid Payload

Perlakuan:

- reject event
- simpan error log
- tandai job failed

### 30.4 Partial Apply Risk

Perlakuan:

- untuk transaction bundle, pusat harus memproses dalam unit yang konsisten
- jika gagal, status harus jelas agar dapat diretry atau direview

## 31. Auditability Requirements

Setiap sync minimal harus dapat ditelusuri ke:

- branch_id
- event_id
- entity_type
- entity_id
- produced_by_user_id bila ada
- occurred_at
- received_at
- result_status

## 32. Monitoring Requirements

Metrik minimum yang perlu dipantau:

- jumlah pending queue per cabang
- last successful sync per cabang
- failed sync count
- conflict count
- duplicate event count
- Shopee import failures
- outbound update failures

## 33. SLA Operasional Internal yang Disarankan

Untuk MVP, target logis internal:

- transaksi lokal tercatat langsung tanpa menunggu pusat
- sync saat online terjadi secepat mungkin setelah event dibuat
- pending sync harus terlihat jelas oleh operasional
- failed sync harus dapat ditindaklanjuti lewat log/status

## 34. Rekomendasi Implementasi Tingkat Tinggi

- gunakan queue persisten di cabang
- gunakan bundle sync untuk transaksi
- gunakan idempotency store di pusat
- gunakan ack yang eksplisit
- pisahkan sync cabang dan integrasi Shopee
- log semua failure dan conflict

## 35. Open Points untuk Tahap Lanjut

Hal yang bisa diperdalam sesudah dokumen ini:

- format payload final per endpoint
- apakah sync cabang bersifat push, pull, atau hybrid untuk tiap jenis data
- apakah conflict tertentu bisa di-auto-resolve aman
- apakah master data perlu checksum atau snapshot comparison
- apakah inventory perlu reserved stock model

## 36. Kesimpulan

Spesifikasi sync ini menetapkan fondasi penting Omnia:

- cabang selalu menulis lokal dulu
- pusat menjadi konsolidator dan pengambil keputusan final
- transaksi dan stok disinkron secara asynchronous
- idempotency, retry, replay, dan observability wajib ada sejak awal

Dengan dokumen ini, tim sudah memiliki dasar yang cukup kuat untuk melanjutkan ke:

1. API contract
2. technical design backend/local storage
3. task breakdown engineering untuk sync layer
