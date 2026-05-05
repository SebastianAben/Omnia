# User Flow Utama

## 1. Informasi Dokumen

- Nama produk: Omnia
- Nama dokumen: User Flow Utama
- Versi: 1.0
- Tanggal: 2026-04-28
- Referensi:
  - `docs/PRD-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/MVP-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/High-Level-Architecture-Hybrid-Omnichannel-Smart-POS.md`

## 2. Tujuan Dokumen

Dokumen ini mendefinisikan user flow utama Omnia untuk fase MVP agar tim memiliki acuan yang konsisten untuk:

- desain UI/UX
- pembagian layar per role
- desain API
- desain sync
- penyusunan backlog development

Flow yang dibahas di dokumen ini mengikuti keputusan produk saat ini:

- satu aplikasi utama berbasis role
- POS hybrid local-first
- marketplace pertama Shopee
- semua cabang aktif dapat memenuhi order online
- tidak ada retur
- belum ada payment gateway langsung pada MVP
- konflik data akhir diputuskan pusat

## 3. Role MVP

Role yang dibahas:

- Cashier
- Store Supervisor
- HQ Admin
- Executive / Analyst

## 4. Prinsip User Flow

- Flow kasir harus pendek, cepat, dan minim distraksi.
- Flow supervisor harus fokus pada kontrol operasional cabang.
- Flow admin pusat harus fokus pada kontrol data dan visibilitas lintas cabang.
- Flow executive / analyst harus fokus pada insight, bukan operasional detail.
- Flow online dan AI tidak boleh menghambat checkout.
- Semua flow harus tetap memperhitungkan mode online dan offline.

## 5. Entry Flow: Login dan Routing Berdasarkan Role

### Tujuan

Mengarahkan user ke area kerja yang relevan sesuai role.

### Alur

1. User membuka aplikasi Omnia.
2. User memasukkan credential login.
3. Sistem memvalidasi akun dan role.
4. Sistem memuat cabang yang terkait dengan user.
5. Sistem memuat permission user.
6. Sistem mengarahkan user ke beranda yang sesuai role.

### Hasil Routing

- Cashier menuju `POS Workspace`
- Store Supervisor menuju `Branch Operations Dashboard`
- HQ Admin menuju `Central Control Dashboard`
- Executive / Analyst menuju `Executive Analytics Dashboard`

### Kondisi Khusus

- Jika koneksi ke pusat tidak tersedia tetapi user masih memiliki sesi lokal valid, aplikasi dapat membuka mode kerja lokal sesuai kebijakan.
- Jika user tidak memiliki akses ke cabang tertentu, data cabang tersebut tidak ditampilkan.

## 6. Flow 1: Transaksi Penjualan POS

### Role

- Cashier
- Store Supervisor
- HQ Admin jika diberi akses operasional

### Tujuan

Memproses transaksi penjualan dari cabang secara cepat dan aman.

### Alur Utama

1. User masuk ke modul POS.
2. User memilih atau scan produk.
3. Sistem menampilkan detail produk, harga per cabang, dan kuantitas.
4. User menambahkan produk ke cart.
5. User dapat mengubah kuantitas atau menghapus item dari cart.
6. User dapat menambahkan diskon item atau diskon transaksi jika diizinkan.
7. Sistem menghitung subtotal, diskon, pajak, dan total akhir.
8. User memilih metode pembayaran.
9. Sistem menampilkan flow konfirmasi pembayaran.
10. User mengonfirmasi transaksi selesai.
11. Sistem membuat record transaksi lokal.
12. Sistem mengurangi stok lokal cabang.
13. Sistem menandai status pembayaran transaksi.
14. Sistem membuat event sync.
15. Sistem mencetak atau menampilkan struk.

### Hasil

- transaksi berhasil tercatat
- stok lokal berkurang
- status pembayaran tercatat
- transaksi siap disinkronkan ke pusat

### Alternatif Flow

#### Jika item tidak ditemukan

1. User melakukan pencarian manual.
2. Jika tetap tidak ditemukan, transaksi tidak bisa menambahkan item tersebut.

#### Jika diskon tidak diizinkan

1. User mencoba memberi diskon.
2. Sistem menolak atau meminta approval sesuai permission.

#### Jika pembayaran belum final

1. User memilih metode pembayaran.
2. Sistem menandai status pembayaran sesuai kondisi yang tersedia pada MVP.
3. Transaksi tetap tercatat dengan informasi pembayaran yang sesuai.

## 7. Flow 2: Transaksi Penjualan Saat Offline

### Role

- Cashier
- Store Supervisor

### Tujuan

Menjaga operasional cabang tetap berjalan saat koneksi ke pusat terputus.

### Alur Utama

1. User masuk ke modul POS.
2. Sistem mendeteksi koneksi pusat tidak tersedia.
3. Sistem menampilkan indikator mode offline.
4. User tetap membuat transaksi seperti biasa.
5. Sistem menyimpan transaksi di local store.
6. Sistem mengurangi stok lokal.
7. Sistem menandai transaksi sebagai `pending sync`.
8. Sistem memasukkan transaksi ke local sync queue.
9. Sistem tetap memungkinkan struk dicetak atau ditampilkan sesuai capability lokal.

### Saat Koneksi Kembali

1. Sistem mendeteksi koneksi tersedia kembali.
2. Sistem memulai replay sync queue.
3. Sistem mengirim transaksi dan stock movement ke pusat.
4. Sistem menerima status sukses atau gagal.
5. Sistem memperbarui status sync lokal.

### Hasil

- transaksi tidak hilang
- operasional tidak berhenti
- pusat menerima data setelah koneksi pulih

## 8. Flow 3: Buka dan Tutup Kas

### Role

- Cashier
- Store Supervisor
- HQ Admin jika memiliki hak akses

### Tujuan

Mencatat pergantian shift dan kontrol kas dasar.

### Flow Buka Kas

1. User login.
2. User membuka shift atau register.
3. User memasukkan saldo awal kas jika diperlukan.
4. Sistem mencatat waktu buka kas, user, dan cabang.
5. Sistem mengaktifkan sesi transaksi.

### Flow Tutup Kas

1. User memilih tutup shift atau tutup kas.
2. Sistem menampilkan ringkasan transaksi selama sesi.
3. User memeriksa ringkasan.
4. User mengonfirmasi penutupan.
5. Sistem mencatat waktu tutup, user, dan ringkasan sesi.
6. Sistem membuat event sync untuk data sesi bila diperlukan.

## 9. Flow 4: Stok Masuk Manual

### Role

- Store Supervisor
- HQ Admin

### Tujuan

Menambah stok cabang secara manual dalam MVP.

### Alur

1. User masuk ke modul inventory.
2. User memilih cabang yang diizinkan.
3. User memilih produk.
4. User memasukkan jumlah stok masuk.
5. User memilih atau mengisi alasan perubahan stok.
6. Sistem memperbarui stok lokal atau pusat sesuai konteks operasi.
7. Sistem membuat stock movement record.
8. Sistem membuat audit log.
9. Sistem menyiapkan event sync jika perubahan dilakukan dari sisi cabang.

### Hasil

- stok bertambah
- histori mutasi tercatat
- actor dan reason tersimpan

## 10. Flow 5: Adjustment Stok

### Role

- Store Supervisor
- HQ Admin

### Tujuan

Mengoreksi stok jika ditemukan selisih operasional.

### Alur

1. User membuka modul inventory.
2. User memilih produk dan cabang.
3. User melihat stok tercatat saat ini.
4. User memasukkan angka penyesuaian atau stok akhir.
5. User memberikan reason code atau catatan.
6. Sistem menghitung selisih.
7. Sistem memperbarui stok.
8. Sistem mencatat stock movement adjustment.
9. Sistem membuat audit log.
10. Sistem menyiapkan sinkronisasi ke pusat jika dilakukan dari cabang.

### Aturan

- adjustment harus selalu memiliki actor
- adjustment harus selalu memiliki alasan

## 11. Flow 6: Pengelolaan Master Produk

### Role

- HQ Admin

### Tujuan

Menyediakan data produk yang konsisten untuk seluruh cabang dan channel.

### Alur Tambah/Ubah Produk

1. HQ Admin membuka modul master produk.
2. HQ Admin menambah atau memilih produk yang ada.
3. HQ Admin mengisi atau mengubah data produk:
   - nama
   - kategori
   - SKU
   - barcode
   - varian dasar
   - status aktif/nonaktif
4. HQ Admin menetapkan harga per cabang.
5. Sistem memvalidasi keunikan SKU dan konsistensi data.
6. Sistem menyimpan perubahan ke pusat.
7. Sistem mendistribusikan pembaruan ke cabang terkait.
8. Cabang memperbarui cache lokal saat sinkronisasi.

### Hasil

- data produk konsisten
- harga per cabang tersedia
- produk siap dipakai di POS dan Shopee mapping

## 12. Flow 7: Dashboard Cabang

### Role

- Store Supervisor
- HQ Admin
- Executive / Analyst dengan akses yang sesuai

### Tujuan

Melihat performa operasional cabang secara cepat.

### Alur

1. User masuk ke dashboard.
2. User memilih cabang dan periode jika diizinkan.
3. Sistem menampilkan KPI utama:
   - omzet
   - jumlah transaksi
   - top selling
   - slow moving
   - stok kritis
   - performa metode pembayaran tercatat
4. User dapat mengganti filter periode.
5. User dapat masuk ke detail data tertentu jika diizinkan.

### Hasil

- user mendapat gambaran cepat kondisi cabang

## 13. Flow 8: Dashboard Pusat

### Role

- HQ Admin
- Executive / Analyst

### Tujuan

Melihat performa lintas cabang dan lintas channel dari pusat.

### Alur

1. User login ke aplikasi.
2. User masuk ke `Central Control Dashboard` atau `Executive Analytics Dashboard`.
3. Sistem memuat data agregat dari pusat.
4. User melihat ringkasan:
   - omzet total
   - performa per cabang
   - performa per channel
   - stok kritis lintas cabang
   - alert sinkronisasi
5. User memfilter data berdasarkan periode atau cabang.
6. User membuka insight AI jika diizinkan.

### Hasil

- user mendapat visibilitas bisnis tingkat pusat

## 14. Flow 9: Koneksi Shopee Store

### Role

- HQ Admin

### Tujuan

Menghubungkan Shopee sebagai channel online pertama.

### Alur

1. HQ Admin membuka modul integrasi.
2. HQ Admin memilih integrasi Shopee.
3. HQ Admin memulai proses koneksi akun/store.
4. Sistem memvalidasi koneksi.
5. Sistem menyimpan informasi store Shopee.
6. Sistem menandai status integrasi aktif.

### Hasil

- akun/store Shopee terhubung ke sistem pusat

## 15. Flow 10: Mapping SKU Shopee ke SKU Internal

### Role

- HQ Admin

### Tujuan

Memastikan order Shopee dapat diterjemahkan ke katalog internal.

### Alur

1. HQ Admin membuka modul product-channel mapping.
2. Sistem menampilkan daftar SKU/internal products dan daftar produk Shopee.
3. HQ Admin memilih pasangan mapping yang sesuai.
4. Sistem memvalidasi bahwa SKU internal aktif dan dapat dijual.
5. Sistem menyimpan mapping.
6. Sistem mencatat audit log perubahan mapping.

### Hasil

- order Shopee bisa diubah ke format order internal
- sinkron stok dasar ke Shopee dapat berjalan

## 16. Flow 11: Order Shopee Masuk ke Sistem

### Role

- Sistem
- HQ Admin sebagai reviewer

### Tujuan

Menerima order Shopee dan mencatatnya ke pusat tanpa mengganggu POS.

### Alur Sistem

1. Shopee mengirim event/webhook order.
2. Integration service menerima event.
3. Sistem memeriksa validitas dan idempotency event.
4. Sistem mencari mapping SKU.
5. Sistem membentuk order internal.
6. Sistem menandai cabang aktif sebagai kandidat pemenuhan order.
7. Sistem memperbarui data order online di pusat.
8. Sistem memperbarui status dan log integrasi.
9. Jika perlu, sistem memicu sinkron stok ke channel.

### Jika Mapping Tidak Ditemukan

1. Sistem menandai order sebagai membutuhkan perhatian.
2. Sistem mencatat error.
3. HQ Admin melihat order/error di dashboard integrasi.

### Hasil

- order Shopee masuk ke sistem pusat
- error integrasi dapat ditindaklanjuti tanpa mengganggu checkout

## 17. Flow 12: Monitoring Sinkronisasi Cabang

### Role

- Store Supervisor
- HQ Admin

### Tujuan

Mengetahui apakah data cabang sudah tersinkron dengan benar.

### Alur

1. User membuka status sinkronisasi.
2. Sistem menampilkan:
   - status online/offline cabang
   - jumlah pending sync
   - sync terakhir berhasil
   - error sync jika ada
3. User meninjau anomali atau backlog.
4. HQ Admin atau supervisor melakukan tindakan lanjutan sesuai proses operasional.

### Hasil

- keterlambatan sinkronisasi dapat diketahui lebih cepat

## 18. Flow 13: Konflik Data dan Kontrol Pusat

### Role

- HQ Admin
- Sistem

### Tujuan

Menangani konflik data dengan aturan pusat sebagai kontrol akhir.

### Contoh Kasus

- cabang A dan B mengubah data yang saling memengaruhi
- cabang lama offline lalu mengirim data yang bertabrakan dengan data pusat

### Alur Tingkat Tinggi

1. Sistem mendeteksi konflik saat proses sinkronisasi.
2. Sistem menandai record sebagai conflict case.
3. Sistem mencegah penyelesaian otomatis jika tidak aman.
4. Sistem menerapkan aturan pusat sebagai keputusan final.
5. Sistem mencatat keputusan dan audit log.
6. Cabang menerima hasil konsolidasi saat sinkronisasi berikutnya.

### Hasil

- keputusan final konsisten
- konflik tidak diselesaikan diam-diam tanpa jejak

## 19. Flow 14: AI Alert Stok Menipis

### Role

- HQ Admin
- Executive / Analyst

### Tujuan

Membantu user mendeteksi produk yang perlu perhatian operasional.

### Alur

1. Background job membentuk data agregat dari pusat.
2. AI analytics service mengevaluasi stok dan pola penjualan.
3. Sistem menghasilkan daftar produk dengan alert stok menipis.
4. User membuka modul dashboard/AI insight.
5. Sistem menampilkan produk, cabang terkait, dan tingkat urgensi.

### Hasil

- user lebih cepat mengenali potensi stockout

## 20. Flow 15: AI Prediksi Stockout Sederhana

### Role

- HQ Admin
- Executive / Analyst

### Tujuan

Memberi prediksi awal barang yang akan habis berdasarkan histori yang tersedia.

### Alur

1. Sistem membaca histori penjualan dan stok pusat.
2. Sistem menghitung prediksi dasar untuk stok habis.
3. Sistem menampilkan hasil prediksi per produk/per cabang jika relevan.
4. Sistem menampilkan confidence atau indikator keyakinan.
5. User menggunakan insight ini sebagai dasar keputusan manual.

### Hasil

- user mendapatkan rekomendasi yang dapat ditindaklanjuti
- tidak ada perubahan otomatis pada stok atau order

## 21. Flow 16: Logout

### Role

- Semua role

### Tujuan

Menutup sesi user dengan aman.

### Alur

1. User memilih logout.
2. Sistem menutup sesi aktif.
3. Sistem menyimpan perubahan lokal yang belum difinalisasi sesuai aturan.
4. Sistem kembali ke layar login.

## 22. Rangkuman Flow Prioritas Sprint Awal

Flow yang paling penting untuk diwujudkan lebih dulu:

1. login dan role routing
2. transaksi penjualan POS online
3. transaksi penjualan POS offline
4. stok keluar dari transaksi
5. stok masuk dan adjustment
6. sync queue dan replay
7. dashboard pusat dasar
8. koneksi Shopee dan SKU mapping
9. order Shopee masuk
10. alert stok menipis

## 23. Kesimpulan

User flow utama Omnia dirancang untuk menjaga keseimbangan antara:

- kecepatan operasional di cabang
- kontrol pusat atas data dan integrasi
- visibilitas bisnis lintas cabang
- insight AI yang mendukung keputusan

Dokumen ini menjadi landasan untuk tahap berikutnya, terutama:

- wireframe
- sitemap final
- API contract
- sync specification
- backlog sprint
