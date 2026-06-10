# Checklist Persiapan Vibes Coding

> Catatan scope terbaru 2026-06-09: checklist ini bersifat historis dan harus
> dibaca bersama `docs/10-implementation-roadmap.md`, `docs/12-actual-status.md`,
> dan `.agents/sessionImplementation.md`. Marketplace/Shopee tidak lagi masuk
> scope aktif MVP. AI/insight ditargetkan menjadi LLM provider integration,
> bukan rule-based-only.

Dokumen ini dipakai sebagai checklist persiapan sebelum memulai development agar proses build cepat, eksploratif, dan tetap terarah.

## 1. Arah Produk

- [ ] Tujuan produk sudah jelas dalam 1-2 kalimat.
- [ ] User utama sudah ditentukan.
- [ ] Masalah utama yang diselesaikan sudah jelas.
- [ ] Scope MVP sudah dipisahkan dari ide fase lanjut.
- [ ] Out of scope sudah ditulis jelas.

## 2. Keputusan Besar Sudah Dikunci

- [ ] Bentuk solusi utama sudah dipilih.
- [ ] Arsitektur utama sudah dipilih: web, desktop, hybrid, atau lainnya.
- [ ] Untuk project ini: `1 aplikasi utama berbasis role` sudah dikunci.
- [ ] Untuk project ini: `hybrid local-first POS` sudah dikunci.
- [ ] Marketplace pertama yang akan diintegrasikan sudah dipilih.
- [ ] AI pada fase awal hanya sebagai advisor, bukan auto-action.

## 3. Dokumen Dasar

- [ ] PRD sudah tersedia.
- [ ] Ringkasan MVP 1 halaman sudah dibuat.
- [ ] Use case utama per role sudah ditulis.
- [ ] Open questions sudah dikumpulkan.
- [ ] Asumsi-asumsi penting sudah dicatat.

## 4. User Flow

- [ ] Flow login per role sudah jelas.
- [ ] Flow transaksi kasir sudah jelas.
- [ ] Flow stok masuk/adjustment sudah jelas.
- [ ] Flow sinkronisasi offline ke online sudah jelas.
- [ ] Flow order marketplace masuk sudah jelas.
- [ ] Flow dashboard melihat performa sudah jelas.
- [ ] Flow AI alert atau prediction sudah jelas.

## 5. Arsitektur Sistem

- [ ] Diagram arsitektur tingkat tinggi sudah ada.
- [ ] Sudah jelas mana yang berjalan di cabang dan mana yang di pusat.
- [ ] Sudah jelas mana jalur transaksi dan mana jalur analytics.
- [ ] Sudah jelas mana proses synchronous dan asynchronous.
- [ ] Sudah jelas bagaimana sync, retry, dan conflict handling bekerja.

## 6. Data dan Database

- [ ] ERD awal sudah dibuat.
- [ ] Entitas utama sudah disepakati.
- [ ] Unique ID strategy sudah jelas.
- [ ] Stock movement model sudah jelas.
- [ ] Order offline dan online punya model data yang konsisten.
- [ ] Audit log sudah masuk desain awal.
- [ ] Data minimum untuk analytics sudah ditentukan.

## 7. Role dan Permission

- [ ] Daftar role final untuk MVP sudah ada.
- [ ] Hak akses per role sudah dirinci.
- [ ] Pembatasan per cabang sudah dipikirkan.
- [ ] Aksi sensitif yang butuh approval sudah ditentukan.
- [ ] Modul AI hanya tampil untuk role khusus.

## 8. UX/UI Direction

- [ ] Sitemap per role sudah ada.
- [ ] Menu kasir dipastikan tetap sederhana.
- [ ] Referensi desain sudah dikumpulkan.
- [ ] Wireframe layar utama sudah ada.
- [ ] Empty state, loading state, dan error state sudah dipikirkan.

## 9. Integrasi

- [ ] Marketplace pertama sudah dipilih.
- [ ] Payment dicatat dulu atau benar-benar terintegrasi sudah diputuskan.
- [ ] Hardware POS yang harus didukung sudah ditentukan.
- [ ] Kebutuhan barcode scanner dan printer sudah dipastikan.
- [ ] Webhook dan retry behavior sudah dipikirkan.

## 10. Persiapan AI

- [ ] Fitur AI MVP sudah dipilih.
- [ ] Data histori minimum yang dibutuhkan sudah dipahami.
- [ ] Output AI yang diinginkan sudah jelas.
- [ ] Confidence score atau label keyakinan akan ditampilkan.
- [ ] AI tidak mengubah data operasional otomatis.

## 11. Persiapan Repo

- [ ] Struktur folder awal sudah diputuskan.
- [ ] Naming convention sudah dipilih.
- [ ] Branching convention sudah dipilih.
- [ ] `.gitignore` sudah siap.
- [ ] `README` setup dasar sudah ada.
- [ ] `.env.example` sudah disiapkan.

## 12. Persiapan Engineering

- [ ] Tech stack sudah dipilih.
- [ ] State management approach sudah dipilih.
- [ ] API pattern sudah dipilih.
- [ ] Logging strategy sudah ditentukan.
- [ ] Error handling standard sudah ditentukan.
- [ ] Test strategy minimal sudah ada.
- [ ] Linting dan formatting sudah disiapkan.

## 13. Persiapan Data Dummy

- [ ] Dummy branches sudah ada.
- [ ] Dummy users per role sudah ada.
- [ ] Dummy products dan categories sudah ada.
- [ ] Dummy stock data sudah ada.
- [ ] Dummy transactions sudah ada.
- [ ] Dummy marketplace orders sudah ada.

## 14. Persiapan AI-Assisted Development

- [ ] Ada file konteks project untuk AI.
- [ ] Ada daftar keputusan yang tidak boleh diubah sembarangan.
- [ ] Ada daftar dependency yang dihindari.
- [ ] Task akan dipecah kecil-kecil, bukan terlalu besar.
- [ ] Ada checkpoint review berkala.

## 15. Delivery Planning

- [ ] Epic utama sudah dipecah.
- [ ] Backlog MVP sudah disusun.
- [ ] Prioritas sprint awal sudah jelas.
- [ ] Definition of done sudah ditentukan.
- [ ] Risiko teknis terbesar sudah diketahui.

## 16. Checklist Minimum Sebelum Mulai Ngoding

Checklist minimum berikut sebaiknya selesai sebelum coding dimulai:

- [ ] PRD final
- [ ] MVP final
- [ ] Arsitektur high-level
- [ ] ERD awal
- [ ] Role matrix
- [ ] User flow utama
- [ ] Stack decision
- [ ] Repo setup
- [ ] Dummy data
- [ ] Backlog sprint 1

## 17. Catatan Penggunaan

- Checklist ini dipakai sebagai acuan `Sprint 0`.
- Tidak semua item harus sempurna, tetapi item inti pada bagian checklist minimum sebaiknya tersedia sebelum implementation utama dimulai.
- Dokumen ini dapat diturunkan menjadi task board, backlog refinement, atau checklist progress tim.
