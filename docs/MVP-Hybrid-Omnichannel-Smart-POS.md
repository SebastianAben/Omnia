# MVP Document

## 1. Informasi Dokumen

- Nama produk: Omnia
- Nama dokumen: MVP Definition
- Versi: 1.0
- Tanggal: 2026-04-28
- Referensi utama: `docs/PRD-Hybrid-Omnichannel-Smart-POS.md`

## 2. Tujuan MVP

MVP Omnia bertujuan membuktikan bahwa satu aplikasi hybrid berbasis role dapat:

- menjalankan operasional POS cabang secara stabil
- mencatat stok dan mutasi stok secara akurat
- menyinkronkan data cabang ke pusat
- menampilkan dashboard dasar lintas cabang
- mengintegrasikan 1 marketplace, yaitu Shopee
- menghasilkan insight AI dasar untuk kebutuhan operasional awal

MVP ini belum ditujukan untuk menjadi sistem enterprise penuh. Fokusnya adalah membangun fondasi operasional yang valid, bisa dipakai, dan siap dikembangkan.

## 3. Ruang Lingkup MVP

### 3.1 Outcome yang Harus Tercapai

Setelah MVP selesai, bisnis harus bisa:

- melakukan transaksi penjualan dari POS cabang
- memperbarui stok otomatis dari transaksi penjualan
- tetap mencatat transaksi dan stok saat cabang offline
- menyinkronkan data transaksi dan stok ke pusat saat koneksi kembali
- melihat penjualan dasar dan kondisi stok dari dashboard pusat
- menerima order dari Shopee ke sistem internal
- memetakan SKU Shopee ke SKU internal
- menjalankan analisis dasar untuk stok menipis dan prediksi stockout sederhana

### 3.2 Prinsip MVP

- satu aplikasi utama
- role-based access
- hybrid local-first untuk POS
- pusat sebagai kontrol final saat terjadi konflik data
- semua cabang aktif bisa memenuhi order online
- tidak ada retur
- belum ada payment gateway langsung

## 4. Target Pengguna MVP

Role yang masuk MVP:

- Cashier
- Store Supervisor
- HQ Admin
- Executive / Analyst

## 5. In Scope MVP

### 5.1 Authentication dan Access

- login user
- role-based access
- pembatasan akses menu berdasarkan role
- session dasar
- login history dasar

### 5.2 POS Core

- transaksi penjualan
- pencarian produk
- scan barcode/QR
- cart management
- diskon item dan transaksi
- pajak
- pencatatan metode pembayaran
- flow konfirmasi pembayaran
- status pembayaran transaksi
- split payment jika diperlukan
- cetak struk
- buka/tutup kas dasar
- pencatatan transaksi saat offline

### 5.3 Product dan Pricing

- master produk
- kategori
- SKU
- barcode
- varian dasar
- harga jual per cabang
- status aktif/nonaktif produk

### 5.4 Inventory

- stok per cabang
- stok keluar dari transaksi
- stok masuk manual
- adjustment stok
- stock movement history
- alert stok minimum
- pencatatan stok lokal saat offline

### 5.5 Branch dan User Management

- data cabang
- assign user ke cabang
- register/device dasar per cabang
- role management dasar untuk role MVP

### 5.6 Sync dan Hybrid Operation

- local transaction queue
- local stock update saat offline
- retry sync saat online kembali
- status sync dasar
- log sync dasar
- conflict resolution dengan kontrol pusat

### 5.7 Dashboard dan Reporting

- omzet harian, mingguan, bulanan
- jumlah transaksi
- top selling products
- slow moving products
- stok kritis
- performa per cabang
- performa per channel
- performa metode pembayaran tercatat
- filter dasar per periode dan cabang

### 5.8 Shopee Integration

- koneksi akun/store Shopee
- mapping SKU Shopee ke SKU internal
- import order Shopee
- update status order internal
- sinkron stok dasar ke Shopee
- webhook/event handling dasar
- retry dan log error dasar

### 5.9 AI Analytics Dasar

- alert stok menipis
- prediksi stockout sederhana
- tren penjualan dasar per cabang
- tren penjualan dasar per SKU/kategori
- ringkasan insight singkat

### 5.10 Audit dan Logging Dasar

- log login
- log transaksi
- log void
- log perubahan harga
- log perubahan stok
- log sync

## 6. Out of Scope MVP

- retur
- refund
- payment gateway langsung
- multi-marketplace
- promo engine kompleks
- loyalty system
- procurement penuh
- akuntansi penuh
- multi-warehouse kompleks
- natural language analytics
- AI action otomatis
- rekomendasi promo otomatis
- dynamic pricing otomatis
- chat marketplace
- campaign management marketplace

## 7. User Flow Utama MVP

### 7.1 Flow Kasir

1. Kasir login.
2. Kasir mencari atau scan produk.
3. Produk masuk ke cart.
4. Diskon/pajak diterapkan jika perlu.
5. Kasir memilih metode pembayaran.
6. Sistem mencatat status pembayaran transaksi.
7. Transaksi disimpan lokal.
8. Stok lokal berkurang.
9. Jika online, data dikirim ke pusat.
10. Jika offline, data masuk queue untuk sinkronisasi berikutnya.

### 7.2 Flow Supervisor

1. Supervisor login.
2. Supervisor melihat penjualan cabang.
3. Supervisor melakukan stok masuk atau adjustment.
4. Sistem mencatat mutasi stok dan actor.
5. Jika online, data tersinkron ke pusat.
6. Jika offline, data ditandai pending sync.

### 7.3 Flow HQ Admin

1. HQ Admin login.
2. HQ Admin mengelola master produk dan harga per cabang.
3. HQ Admin memantau dashboard pusat.
4. HQ Admin melihat status sync cabang.
5. HQ Admin mengelola mapping SKU Shopee.
6. Jika ada konflik data antar cabang, keputusan final mengikuti data dan kontrol pusat.

### 7.4 Flow Executive / Analyst

1. Executive atau Analyst login.
2. User melihat dashboard pusat.
3. User melihat alert stok menipis.
4. User melihat prediksi stockout sederhana.
5. User membaca insight tren penjualan dasar.

### 7.5 Flow Order Shopee

1. Order masuk dari Shopee.
2. Sistem menerima event/webhook.
3. SKU Shopee dipetakan ke SKU internal.
4. Order dikonversi menjadi order internal.
5. Sistem menandai cabang aktif sebagai kandidat pemenuhan.
6. Stok pusat dan status order diperbarui sesuai aturan MVP.
7. Jika gagal, event masuk retry/log error.

## 8. Acceptance Criteria MVP

### 8.1 Operasional POS

- Kasir dapat menyelesaikan transaksi tanpa modul dashboard atau AI.
- POS tetap dapat mencatat transaksi saat koneksi pusat terputus.
- Data transaksi offline tidak hilang setelah koneksi kembali.

### 8.2 Inventory

- Transaksi penjualan selalu mengurangi stok cabang yang relevan.
- Adjustment stok selalu memiliki actor dan reason.
- Stok lokal tetap tercatat saat offline.

### 8.3 Sync

- Transaksi dan mutasi stok yang offline dapat tersinkron saat online kembali.
- Setiap transaksi memiliki identifier unik.
- Sync gagal dapat dilihat melalui log/status dasar.
- Konflik antar cabang mengikuti keputusan pusat.

### 8.4 Dashboard

- HQ Admin dapat melihat data penjualan dasar per cabang.
- Dashboard tidak membaca langsung dari penyimpanan lokal cabang.

### 8.5 Shopee Integration

- Sistem dapat menerima order dari Shopee.
- SKU Shopee dapat dipetakan ke SKU internal.
- Sinkron stok dasar ke Shopee berjalan.
- Error integrasi tercatat.

### 8.6 AI Analytics

- Sistem dapat menghasilkan alert stok menipis.
- Sistem dapat menampilkan prediksi stockout sederhana.
- Insight ditampilkan sebagai rekomendasi, bukan aksi otomatis.

## 9. Batasan Operasional MVP

- hanya 1 marketplace: Shopee
- tidak ada retur
- tidak ada payment gateway langsung
- offline mode fokus pada penjualan POS dan stok lokal
- dashboard pusat bukan alat transaksi
- AI tidak mengubah data operasional
- semua cabang aktif dapat memenuhi order online
- konflik data akhir diputuskan oleh pusat

## 10. Data Minimum yang Harus Tersedia

- user
- role
- cabang
- register
- produk
- kategori
- SKU
- harga per cabang
- stok per cabang
- mutasi stok
- transaksi penjualan
- item transaksi
- metode pembayaran tercatat
- status pembayaran
- channel penjualan
- order Shopee
- mapping SKU channel
- sync status/log
- audit log dasar

## 11. KPI Keberhasilan MVP

### 11.1 KPI Produk

- transaksi POS berhasil tercatat
- sinkronisasi transaksi dasar berhasil
- order Shopee berhasil masuk ke sistem
- alert stok menipis muncul dari data aktual

### 11.2 KPI Operasional

- tidak ada kehilangan transaksi saat offline
- penurunan mismatch stok dasar
- waktu checkout tetap cepat
- error integrasi bisa dideteksi dan ditindaklanjuti

### 11.3 KPI Adopsi

- role kasir dapat menggunakan flow transaksi tanpa hambatan besar
- HQ Admin dapat membaca dashboard tanpa bergantung ke laporan manual
- Executive / Analyst dapat melihat insight dasar yang relevan

## 12. Risiko Utama MVP

- sinkronisasi offline-online tidak stabil
- konflik stok antar cabang
- mapping SKU Shopee salah
- performa POS terganggu jika domain lain terlalu berat
- insight AI kurang akurat jika data historis belum cukup

## 13. Mitigasi MVP

- gunakan queue untuk sync
- gunakan unique ID dan idempotency
- gunakan audit log untuk transaksi dan stok
- pisahkan proses berat dari jalur checkout
- jadikan AI hanya sebagai advisory layer
- sediakan monitoring error integrasi dasar

## 14. Deliverables Sebelum Development Penuh

Sebelum implementasi MVP dimulai, sebaiknya tersedia:

- arsitektur high-level
- ERD awal
- sync specification
- user flow final
- sitemap/wireframe utama
- keputusan stack teknologi
- backlog sprint 1

## 15. Kesimpulan

MVP Omnia difokuskan untuk membangun fondasi yang benar:

- POS hybrid yang tetap jalan saat offline
- stok dan transaksi yang konsisten
- dashboard pusat yang berguna
- integrasi Shopee sebagai channel online pertama
- AI analytics dasar yang bisa membantu keputusan operasional

MVP ini sengaja dibatasi agar tim dapat memvalidasi model operasional utama sebelum memperluas sistem ke payment gateway penuh, marketplace tambahan, dan analytics yang lebih canggih.
