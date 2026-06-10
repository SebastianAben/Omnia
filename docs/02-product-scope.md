# Product Scope

## Ringkasan Produk

Omnia adalah Hybrid Smart POS untuk retail dan UMKM multi-cabang. Produk ini menyatukan POS cabang, inventory, dashboard pusat, audit/monitoring, dan LLM insight dalam satu aplikasi berbasis role.

Prinsip utama:

- POS cabang harus tetap berjalan saat offline.
- Data pusat dipakai untuk konsolidasi, dashboard, audit, monitoring, dan LLM insight.
- Sync, dashboard, monitoring, dan LLM insight tidak boleh mengganggu checkout kasir.
- LLM hanya memberi rekomendasi, bukan mengubah data bisnis otomatis.

## Role MVP

| Role                | Fokus                                                                  |
| ------------------- | ---------------------------------------------------------------------- |
| Cashier             | Checkout POS, shift, receipt, sync status dasar.                       |
| Store Supervisor    | Operasi cabang, inventory adjustment, dashboard cabang, audit cabang.  |
| HQ Admin            | Master data, dashboard pusat, sync monitoring, audit, dan LLM insight. |
| Executive / Analyst | Dashboard pusat dan LLM insight.                                       |

## Scope MVP

MVP harus membuktikan bahwa Omnia dapat:

1. Menjalankan transaksi POS cabang secara local-first.
2. Menyimpan transaksi, payment, shift, dan stock movement ke local store.
3. Melakukan replay sync dari cabang ke backend pusat.
4. Menyediakan master data dasar: user, role, branch, register, category, product, price.
5. Mengelola inventory balance dan stock movement dasar.
6. Menampilkan dashboard cabang dan pusat dari data central DB.
7. Menampilkan LLM insight dari data pusat, seperti low stock, stockout risk, sales trend, anomaly, dan rekomendasi operasional.
8. Menyimpan reference data, severity, confidence, prompt/provider metadata, dan status generation untuk setiap insight.
9. Menyediakan audit log dan monitoring sync/LLM generation.

## Out of Scope MVP

- Payment gateway langsung.
- Retur/refund kompleks.
- Accounting penuh.
- Marketplace integration, termasuk Shopee.
- Campaign/chat marketplace.
- Replenishment otomatis.
- LLM auto-action untuk stok, harga, order, payment, atau master data.
- Mobile-first app.

## KPI MVP

| Area            | Ukuran sukses                                                                                |
| --------------- | -------------------------------------------------------------------------------------------- |
| Operasional POS | Checkout tetap bisa dilakukan saat offline.                                                  |
| Reliability     | Sync replay tidak menggandakan transaksi.                                                    |
| Inventory       | Stock movement tercatat dan auditable.                                                       |
| Dashboard       | HQ dapat melihat KPI dasar cabang/pusat.                                                     |
| LLM             | Insight tampil sebagai rekomendasi dengan confidence, reference data, dan generation status. |

## Risiko Produk

- Scope melebar sebelum POS stabil.
- Sync offline-online menghasilkan duplikasi atau data parsial.
- LLM insight dipercaya berlebihan saat data belum cukup.
- LLM provider gagal, lambat, atau mahal saat dipanggil tanpa cache/rate limit.
- Legacy marketplace schema yang masih inert dapat membingungkan scope MVP jika tidak dibedakan dari surface runtime aktif.

Mitigasi utama: kunci scope MVP, pisahkan jalur checkout dari fitur berat, gunakan idempotency/audit log, validasi structured output LLM, dan jadikan Sprint 8 sebagai tempat ekspansi post-MVP.
