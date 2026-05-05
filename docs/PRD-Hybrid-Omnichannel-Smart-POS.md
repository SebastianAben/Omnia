# Product Requirements Document (PRD)

## 1. Informasi Dokumen

- Nama produk: Omnia
- Versi dokumen: 1.1
- Tanggal: 2026-04-28
- Status: Draft awal untuk alignment produk dan teknis
- Pemilik dokumen: Product / Founding Team

## 2. Ringkasan Eksekutif

Omnia adalah sistem `Hybrid Omnichannel Smart POS` untuk bisnis retail dan UMKM multi-cabang yang menggabungkan operasional kasir, kontrol stok, dashboard manajemen, integrasi marketplace, dan analytics berbasis AI dalam `1 aplikasi utama` dengan akses berbasis role.

Solusi yang dipilih adalah `hybrid`:

- POS cabang berjalan `local-first` agar transaksi tetap bisa berlangsung saat internet tidak stabil.
- Dashboard, sinkronisasi lintas cabang, integrasi marketplace, dan AI analytics diproses di pusat.
- Pengguna tetap merasakan `1 aplikasi yang sama`, tetapi sistem dibangun secara `modular` agar stabil, aman, dan scalable.

Pendekatan ini dipilih karena:

- Web murni berisiko mengganggu operasional kasir saat koneksi buruk.
- Desktop/local-only murni menyulitkan konsolidasi pusat, omnichannel, dan analytics.
- Hybrid memberi keseimbangan antara keandalan operasional dan kebutuhan integrasi bisnis modern.

## 3. Latar Belakang Masalah

Bisnis retail dan UMKM yang berkembang ke banyak cabang umumnya menghadapi masalah berikut:

- Transaksi cabang tercatat di sistem yang terpisah atau manual.
- Sinkronisasi stok antar cabang dan channel online sering terlambat.
- Owner kesulitan melihat performa bisnis lintas cabang secara real-time atau near real-time.
- Marketplace seperti Shopee sering berjalan terpisah dari operasional toko.
- Keputusan restock, promo, dan evaluasi performa masih banyak bergantung pada intuisi, bukan data.
- Sistem POS yang terlalu bergantung pada internet pusat berisiko mengganggu checkout di toko.

Omnia hadir untuk menjadi pusat operasional penjualan offline dan online, sekaligus sumber insight bisnis yang dapat ditindaklanjuti.

## 4. Visi Produk

Menjadi sistem POS omnichannel yang andal untuk operasional cabang, terintegrasi untuk manajemen pusat, dan cerdas untuk mendukung keputusan bisnis berbasis data.

## 5. Tujuan Produk

### 5.1 Tujuan Bisnis

- Menyediakan satu sistem terpadu untuk operasional offline dan online.
- Mengurangi kehilangan penjualan akibat stok yang tidak sinkron.
- Mempercepat pengambilan keputusan melalui dashboard dan AI insights.
- Meningkatkan akurasi pencatatan transaksi, stok, dan performa cabang.
- Menjadi fondasi produk yang dapat dikembangkan ke skala multi-cabang dan multi-channel.

### 5.2 Tujuan Pengguna

- Kasir dapat melakukan transaksi dengan cepat dan stabil.
- Supervisor dapat mengawasi stok dan operasional cabang dengan mudah.
- Admin pusat dapat mengelola katalog, harga per cabang, user, dan integrasi.
- Analyst atau executive dapat mengakses insight dan prediksi bisnis khusus.

## 6. Non-Goals

Hal-hal berikut tidak menjadi target utama pada fase awal:

- Full ERP / akuntansi lengkap.
- Procurement kompleks end-to-end.
- CRM dan loyalty enterprise-grade.
- Chat customer marketplace.
- Dynamic pricing otomatis lintas channel.
- AI yang melakukan perubahan operasional otomatis tanpa approval manusia.
- Multi-warehouse kompleks dengan routing fulfillment tingkat lanjut.
- Integrasi ke semua marketplace sekaligus pada MVP.

## 7. Solusi yang Dipilih

### 7.1 Model Solusi

Solusi utama adalah `1 aplikasi utama berbasis role` dengan arsitektur `hybrid local-first`.

Artinya:

- Semua fungsi berada di dalam satu produk/aplikasi yang sama.
- Menu dan fitur yang terlihat ditentukan oleh role pengguna yang login.
- Operasional POS cabang tetap diprioritaskan agar bekerja meski koneksi pusat tidak stabil.
- Dashboard, integrasi marketplace, sinkronisasi pusat, dan AI diproses terpisah di belakang layar.

### 7.2 Prinsip Arsitektur

- `One product experience`: user menggunakan satu aplikasi utama.
- `Role-based access`: fitur tampil sesuai peran dan otorisasi.
- `Local-first POS`: transaksi cabang tidak boleh bergantung penuh pada internet pusat.
- `Asynchronous sync`: sinkronisasi dilakukan di background, bukan menghambat kasir.
- `Modular architecture`: domain POS, dashboard, integration, dan AI dipisah secara logis.
- `Single business record`: pusat menjadi sumber konsolidasi final untuk laporan dan analytics.
- `AI as advisor`: AI memberi insight dan rekomendasi, bukan pengambil keputusan otomatis pada fase awal.

## 8. Persona Pengguna

### 8.1 Cashier

- Tujuan: melakukan checkout dengan cepat dan akurat.
- Kebutuhan: UI sederhana, scan produk cepat, pembayaran lancar, cetak struk, minim gangguan.
- Pain point: loading lambat, stok tidak sinkron, menu terlalu banyak.

### 8.2 Store Supervisor

- Tujuan: memastikan operasional cabang berjalan rapi.
- Kebutuhan: kontrol stok cabang, approval tertentu, ringkasan penjualan cabang, monitoring sync dasar.
- Pain point: mutasi stok tidak jelas, kesalahan kasir sulit ditelusuri.

### 8.3 HQ Admin

- Tujuan: mengelola bisnis lintas cabang dari pusat.
- Kebutuhan: master data, user management, harga per cabang, integrasi channel, monitoring cabang, reporting pusat.
- Pain point: perubahan data harus dilakukan per cabang, tidak terpusat.

### 8.4 Analyst / Executive

- Tujuan: mendapatkan insight bisnis dan rekomendasi aksi.
- Kebutuhan: trend analysis, prediction, anomaly detection, AI summary, lintas cabang dan channel.
- Pain point: laporan mentah terlalu banyak dan sulit disintesis.

## 9. Scope Produk

### 9.1 Empat Domain Utama

Omnia akan mencakup empat domain utama dalam satu aplikasi:

1. POS Core
2. Dashboard & Reporting
3. Omnichannel Integration
4. AI Analytics

### 9.2 Scope MVP

Fase MVP berfokus pada:

- Login dan role-based access.
- POS transaksi cabang.
- Master produk dasar.
- Manajemen stok dasar dan mutasi stok.
- Pembayaran dan pencatatan transaksi.
- Sinkronisasi transaksi cabang ke pusat.
- Dashboard dasar offline + online.
- Integrasi 1 marketplace, yaitu Shopee.
- Sync stok dasar.
- AI alert stok menipis dan prediksi stockout sederhana.

### 9.3 Scope Fase Lanjutan

- Tambahan marketplace.
- Forecast penjualan lebih canggih.
- Rekomendasi restock prioritas.
- Analisis promo dan rekomendasi bundling.
- Natural language analytics.
- Transfer stok antar cabang yang lebih kompleks.
- Integrasi payment gateway yang lebih luas.

## 10. Struktur Solusi Produk

Walaupun user melihat satu aplikasi, sistem dibagi menjadi modul internal berikut:

### 10.1 POS Module

Fungsi:

- transaksi penjualan
- scan barcode/QR
- pembayaran
- cetak struk
- buka/tutup kas
- transaksi offline sementara
- sinkronisasi transaksi ke pusat

### 10.2 Dashboard Module

Fungsi:

- laporan penjualan
- dashboard cabang dan pusat
- performa produk
- performa pembayaran
- performa cabang
- ringkasan multi-channel

### 10.3 Integration Module

Fungsi:

- mapping produk channel
- import order marketplace
- sinkron stok
- update status order
- monitoring webhook
- retry failure

### 10.4 AI Analytics Module

Fungsi:

- prediksi barang akan habis
- trend penjualan
- analisis performa cabang
- anomaly detection
- slow moving dan fast moving analysis
- AI-generated business summary

## 11. User Roles dan Hak Akses

### 11.1 Role Utama

Fokus role untuk MVP:

- Cashier
- Store Supervisor
- HQ Admin
- Executive / Analyst

Role tambahan dapat dipertimbangkan pada fase lanjutan bila kebutuhan operasional bertambah.

### 11.2 Matriks Akses Tingkat Tinggi

| Modul / Fitur | Cashier | Supervisor | HQ Admin | Executive / Analyst |
| --- | --- | --- | --- | --- |
| POS transaksi | Ya | Ya | Ya | Tidak |
| Buka/tutup kas | Ya terbatas | Ya | Ya | Tidak |
| Adjustment stok cabang | Tidak | Ya | Ya | Tidak |
| Master produk | Tidak | Lihat terbatas | Ya | Lihat |
| Dashboard cabang | Tidak | Ya | Ya | Ya |
| Dashboard pusat | Tidak | Tidak | Ya | Ya |
| Integrasi marketplace | Tidak | Tidak | Ya | Lihat |
| AI analytics | Tidak | Tidak | Tergantung akses | Ya |
| User management | Tidak | Tidak | Ya | Tidak |
| Audit log | Tidak | Terbatas | Ya | Lihat |

### 11.3 Aturan Permission

- Permission harus dapat diatur per role.
- Permission harus dapat dibatasi per cabang.
- Fitur sensitif harus mendukung approval atau second authorization jika diperlukan.
- Role tertentu dapat memiliki akses baca tanpa akses ubah.

## 12. Kebutuhan Fungsional

### 12.1 Authentication dan Session

#### Tujuan

Memastikan hanya user berwenang yang mengakses modul sesuai haknya.

#### Kebutuhan

- User dapat login dengan username/email dan password.
- Sistem mendukung PIN cepat untuk role kasir jika diperlukan.
- Sistem menampilkan menu sesuai role.
- Sistem mendukung logout, session timeout, dan device binding opsional.
- Sistem mencatat login history dan aktivitas penting.

#### Acceptance Criteria

- User tanpa hak akses tidak dapat melihat menu terlarang.
- Perubahan role langsung memengaruhi akses pada login berikutnya.
- Aktivitas login dan gagal login tercatat.

### 12.2 POS Core

#### Tujuan

Mendukung transaksi toko fisik yang cepat, stabil, dan terdokumentasi.

#### Fitur

- pencarian produk
- scan barcode/QR
- cart management
- diskon item dan diskon transaksi
- pajak
- pencatatan metode pembayaran
- flow konfirmasi pembayaran
- status pembayaran transaksi
- split payment jika diperlukan
- suspend/resume cart opsional
- cetak struk
- open/close shift
- cash drawer summary

#### Acceptance Criteria

- Kasir dapat menyelesaikan transaksi tanpa bergantung pada dashboard atau AI.
- Sistem tetap dapat membuat transaksi saat koneksi ke pusat terputus.
- Nomor transaksi tetap unik dan dapat direkonsiliasi saat sync.
- Semua item transaksi tercatat lengkap dengan timestamp, cabang, user, dan informasi pembayaran tercatat.
- MVP tidak mewajibkan koneksi ke payment gateway untuk menyelesaikan flow transaksi.

### 12.3 Product Catalog

#### Tujuan

Menyediakan sumber data produk yang konsisten untuk semua cabang dan channel.

#### Fitur

- produk
- kategori
- SKU
- barcode
- varian
- satuan
- harga jual per cabang
- status aktif/nonaktif
- foto produk opsional
- pricing level lanjutan jika nanti dibutuhkan

#### Acceptance Criteria

- Produk dapat dipakai di POS, dashboard, dan integrasi channel.
- SKU internal tidak boleh ambigu.
- Produk nonaktif tidak muncul di transaksi baru.

### 12.4 Inventory Management

#### Tujuan

Menjaga akurasi stok cabang dan pusat.

#### Fitur

- stok per cabang
- mutasi stok
- stok masuk
- stok keluar dari transaksi
- adjustment stok
- stock opname dasar
- alert stok minimum
- histori mutasi
- update stok lokal saat offline

#### Acceptance Criteria

- Setiap perubahan stok memiliki reason code dan actor.
- Transaksi penjualan mengurangi stok sesuai item.
- Adjustment stok tercatat di audit log.

### 12.5 Branch Management

#### Tujuan

Mendukung operasional multi-cabang.

#### Fitur

- data cabang
- status cabang
- device/register per cabang
- jam operasional opsional
- assign user ke cabang
- konfigurasi minimal per cabang

#### Acceptance Criteria

- User hanya dapat mengakses cabang yang diizinkan.
- Data transaksi selalu terikat ke cabang asal.

### 12.6 Dashboard & Reporting

#### Tujuan

Menyediakan visibilitas bisnis yang cepat dan mudah dipahami.

#### Fitur dashboard awal

- omzet harian, mingguan, bulanan
- jumlah transaksi
- average basket size
- top selling products
- slow moving products
- stok kritis
- performa per cabang
- performa per channel
- performa metode pembayaran tercatat
- perbandingan periode

#### Fitur laporan

- filter tanggal
- filter cabang
- filter kategori
- filter channel
- export CSV/XLSX/PDF pada fase bertahap

#### Acceptance Criteria

- Dashboard pusat tidak membaca data langsung dari local cache cabang.
- Laporan dapat difilter setidaknya berdasarkan cabang dan periode.

### 12.7 Omnichannel / Marketplace Integration

#### Tujuan

Menghubungkan penjualan online dengan operasional dan stok internal.

#### Fitur MVP

- integrasi 1 marketplace: Shopee
- koneksi akun/store marketplace
- mapping SKU internal ke SKU marketplace
- import order marketplace
- update status order
- sinkron stok dasar
- log error sync
- retry otomatis
- alokasi pemenuhan order online dari semua cabang yang aktif

#### Acceptance Criteria

- Order marketplace dapat dipetakan ke format order internal.
- Kegagalan integrasi tidak mengganggu checkout POS.
- Error sync dapat dilihat admin.
- Sistem mendukung idempotent processing pada webhook/event yang sama.
- Semua cabang aktif dapat menjadi sumber pemenuhan order online tanpa aturan pembatasan khusus pada MVP.

### 12.8 AI Analytics

#### Tujuan

Mengubah data transaksi menjadi insight dan prediksi yang dapat ditindaklanjuti.

#### Fitur MVP

- prediksi stok habis sederhana
- trend penjualan per cabang
- trend penjualan per SKU/kategori
- slow moving vs fast moving
- alert penurunan performa
- narasi insight singkat

#### Fitur lanjut

- forecasting penjualan per SKU/per cabang
- anomaly detection yang lebih matang
- rekomendasi restock prioritas
- analisis kontribusi channel
- natural language query

#### Acceptance Criteria

- Hasil AI menampilkan label confidence atau tingkat keyakinan.
- AI tidak mengubah stok, harga, atau pesanan secara otomatis pada fase awal.
- Insight AI menggunakan data pusat yang sudah tersinkron.

### 12.9 Audit Log

#### Tujuan

Menyediakan jejak aktivitas untuk kontrol dan investigasi.

#### Fitur

- log login
- log transaksi
- log void
- log perubahan harga
- log perubahan stok
- log sync dan retry
- log perubahan mapping integrasi
- log perubahan role dan user

#### Acceptance Criteria

- Aktivitas sensitif dapat ditelusuri ke user, waktu, dan cabang.
- Audit log tidak dapat dihapus oleh role operasional biasa.

## 13. Kebutuhan Hybrid dan Sinkronisasi

### 13.1 Prinsip Offline/Online

- POS cabang harus tetap dapat bertransaksi saat koneksi ke pusat terputus.
- Data transaksi lokal, stok lokal, dan mutasi stok lokal harus disimpan aman sampai sinkronisasi berhasil.
- Saat online kembali, data harus dikirim ke pusat melalui mekanisme queue/replay.

### 13.2 Mode Operasi

#### Mode Online

- transaksi cabang tersimpan lokal dan dikirim ke pusat secara near real-time
- sinkron data master dapat berjalan
- dashboard pusat menerima data terbaru

#### Mode Offline

- transaksi tetap bisa dibuat di cabang
- stok dan mutasi stok tetap tercatat di cabang
- fitur yang butuh pusat dapat dibatasi
- status sync ditandai pending
- analytics global dan integrasi marketplace tidak aktif dari sisi cabang

### 13.3 Aturan Sinkronisasi

- Sinkronisasi harus asynchronous.
- Event harus idempotent.
- Setiap transaksi harus memiliki identifier unik global.
- Gagal sync harus masuk retry queue.
- Retry harus memiliki batas percobaan dan log error.
- Jika terjadi konflik antar cabang atau antara cabang dan pusat, keputusan final mengikuti kontrol pusat.

### 13.4 Konflik yang Harus Diantisipasi

- duplikasi event
- perubahan produk sebelum sync selesai
- cabang offline lama
- stok berubah di pusat dan cabang pada waktu berdekatan
- order online masuk saat cabang belum sync

### 13.5 Batasan Hybrid

- Offline mode tidak menjamin semua fitur tetap tersedia.
- Cabang bukan sumber pelaporan final lintas bisnis.
- Sinkronisasi real-time penuh bukan target MVP.

## 14. Batasan Produk

### 14.1 Batasan Fungsional

- Semua fungsi berada di 1 aplikasi, tetapi UI dan akses dibatasi berdasarkan role.
- Modul AI dan dashboard tidak boleh mengganggu alur transaksi kasir.
- Integrasi marketplace tidak dipanggil secara blocking dari layar checkout.
- Fase awal hanya mendukung 1 marketplace, yaitu Shopee.
- MVP tidak mencakup mekanisme retur.

### 14.2 Batasan Teknis

- Satu aplikasi secara produk, modular secara teknis.
- POS core harus tetap berfungsi jika dashboard atau AI service bermasalah.
- Query laporan berat harus dipisah dari jalur transaksi.
- Background jobs wajib dipakai untuk sync, agregasi, dan analytics.

### 14.3 Batasan AI

- AI berperan sebagai advisor, bukan executor.
- Insight AI bergantung pada kualitas dan kelengkapan data.
- Produk dengan histori penjualan minim mungkin memiliki prediksi yang lemah.

### 14.4 Batasan Integrasi

- Tidak semua marketplace dibangun pada MVP.
- Sinkron harga dua arah bukan prioritas fase awal.
- Chat marketplace, ads, dan campaign management tidak masuk MVP.

## 15. Kebutuhan Data Tingkat Tinggi

### 15.1 Entitas Inti

- users
- roles
- permissions
- branches
- registers
- products
- product_variants
- categories
- inventory_balances
- stock_movements
- sales_transactions
- sales_transaction_items
- payments
- shifts
- sales_channels
- marketplace_accounts
- marketplace_stores
- product_channel_mappings
- online_orders
- online_order_items
- sync_jobs
- sync_logs
- webhook_events
- ai_insights
- audit_logs

### 15.2 Data Minimum untuk Analytics

- timestamp transaksi
- cabang
- channel
- SKU
- qty
- harga jual
- diskon
- payment method
- status transaksi
- status pembayaran
- stok sebelum/sesudah bila tersedia

## 16. Kebutuhan Non-Fungsional

### 16.1 Performance

- Checkout harus terasa cepat dan responsif.
- Aksi kasir utama tidak boleh menunggu pemrosesan analytics atau marketplace.
- Dashboard harus memuat KPI utama dalam waktu yang wajar pada data yang sudah diagregasi.

### 16.2 Reliability

- Transaksi tidak boleh hilang saat koneksi pusat putus.
- Sistem harus mendukung retry sync otomatis.
- Harus ada recovery mechanism untuk perangkat yang kembali online.

### 16.3 Security

- Password harus disimpan dengan hashing yang kuat.
- Session management harus aman.
- Role dan permission harus diterapkan di backend, bukan hanya di UI.
- Audit log untuk aksi sensitif wajib ada.
- Data akses lintas cabang harus dibatasi.

### 16.4 Scalability

- Sistem harus mendukung penambahan cabang tanpa redesign total.
- Integrasi marketplace tambahan harus bisa ditambahkan tanpa mengubah POS core.
- AI services harus bisa berkembang terpisah dari checkout flow.

### 16.5 Observability

- Error log terpusat
- health monitoring cabang/device
- monitoring queue/sync
- alert untuk sync gagal, branch offline, dan backlog job

### 16.6 Maintainability

- Kode dibagi modular per domain.
- Domain POS tidak boleh tercampur dengan query report berat.
- Integrasi pihak ketiga diisolasi di layer integration.

## 17. Integrasi Eksternal

### 17.1 Marketplace

Target fase awal:

- Shopee

Kemampuan:

- autentikasi koneksi
- import order
- sync stok
- status order update
- webhook

### 17.2 Payment

Target:

- pencatatan cash dan non-cash
- flow pembayaran tercatat di transaksi
- abstraction layer untuk gateway agar tidak terkunci pada satu provider saat fase lanjutan

Catatan:

- MVP tidak mewajibkan integrasi payment gateway langsung.
- Integrasi payment online penuh dapat dilakukan bertahap.
- Offline payment rules harus jelas jika nanti digunakan.

### 17.3 Perangkat POS

Target dukungan:

- barcode scanner
- printer thermal
- cash drawer
- display customer opsional

## 18. KPI Produk

### 18.1 KPI Operasional

- persentase transaksi berhasil
- waktu rata-rata checkout
- jumlah transaksi yang tertunda sinkron
- tingkat keberhasilan sync
- jumlah insiden konflik stok

### 18.2 KPI Bisnis

- pertumbuhan omzet
- penurunan stockout
- akurasi stok
- kontribusi channel online
- kecepatan identifikasi slow moving items

### 18.3 KPI AI

- tingkat penggunaan fitur insight
- akurasi prediksi stockout
- jumlah rekomendasi yang ditindaklanjuti
- waktu analisis yang dihemat untuk admin pusat atau executive

## 19. MVP dan Prioritas Fase

### 19.1 MVP

#### In scope

- role-based login
- POS transaksi
- master produk
- stok dan mutasi stok dasar
- shift kasir dasar
- sinkronisasi transaksi cabang ke pusat
- dashboard penjualan dasar
- integrasi 1 marketplace: Shopee
- sync stok dasar
- alert stok minimum
- prediksi stockout sederhana

#### Out of scope

- AI action otomatis
- multi-marketplace penuh
- promo engine kompleks
- procurement penuh
- akuntansi penuh
- loyalty kompleks

### 19.2 Roadmap Bertahap

#### Fase 1

- POS core
- user/role
- produk dan stok dasar
- transaksi dan payment record tanpa payment gateway

#### Fase 2

- hybrid sync
- dashboard cabang dan pusat
- audit log

#### Fase 3

- marketplace integration pertama
- channel reporting
- error monitoring integrasi

#### Fase 4

- AI analytics dasar
- stockout prediction
- trend summary

#### Fase 5

- marketplace tambahan
- AI lanjutan
- replenishment recommendation

## 20. Risiko Utama dan Mitigasi

### 20.1 Risiko Operasional

- Risiko: transaksi terhenti saat koneksi buruk.
- Mitigasi: local-first POS, offline transaction queue.

### 20.2 Risiko Data

- Risiko: stok tidak konsisten.
- Mitigasi: stock movement ledger, sync log, conflict monitoring, buffer stock rules.

### 20.3 Risiko Integrasi

- Risiko: webhook duplicate atau API marketplace gagal.
- Mitigasi: idempotency key, retry queue, dead-letter handling, error dashboard.

### 20.4 Risiko Produk

- Risiko: 1 aplikasi menjadi terlalu kompleks.
- Mitigasi: role-based UI, feature gating, modular architecture.

### 20.5 Risiko AI

- Risiko: insight salah karena data kotor.
- Mitigasi: data cleaning, threshold minimum data, confidence score, approval manusia.

## 21. Asumsi dan Ketergantungan

### 21.1 Asumsi

- Sistem ditujukan untuk bisnis dengan satu atau banyak cabang.
- Cabang memiliki perangkat POS sendiri.
- Tidak semua cabang memiliki koneksi internet stabil sepanjang waktu.
- Marketplace akan diintegrasikan bertahap.
- Tim siap memisahkan kebutuhan operasional dan analytics.

### 21.2 Ketergantungan

- keputusan stack teknologi
- keputusan perangkat POS
- keputusan marketplace pertama
- kebijakan pricing dan stok per cabang
- desain role/permission final
- kesiapan data historis untuk AI

## 22. Open Questions

- Payment gateway online akan masuk pada fase berapa setelah MVP?
- Seberapa jauh offline mode harus mendukung transaksi non-cash?

## 23. Kesimpulan

PRD ini menetapkan Omnia sebagai `1 aplikasi utama` dengan `akses berbasis role` dan arsitektur `hybrid local-first` yang paling sesuai untuk kebutuhan POS multi-cabang, omnichannel, dan AI analytics.

Keputusan produk kunci yang dikunci dalam dokumen ini:

- Satu aplikasi untuk seluruh domain pengguna.
- POS core menjadi prioritas operasional tertinggi.
- Dashboard, marketplace, dan AI berada dalam ekosistem yang sama tetapi dipisah secara modular.
- Sinkronisasi dan integrasi berjalan asynchronous.
- AI berfungsi sebagai pemberi insight, bukan pengambil keputusan otomatis pada fase awal.

Dokumen ini dapat digunakan sebagai dasar untuk:

- pembahasan stakeholder
- turunan scope MVP
- perancangan ERD
- penyusunan arsitektur sistem
- pembuatan backlog sprint
