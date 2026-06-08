# Product Scope

## Ringkasan Produk

Omnia adalah Hybrid Omnichannel Smart POS untuk retail dan UMKM multi-cabang. Produk ini menyatukan POS cabang, inventory, dashboard pusat, integrasi marketplace, dan AI insight dalam satu aplikasi berbasis role.

Prinsip utama:

- POS cabang harus tetap berjalan saat offline.
- Data pusat dipakai untuk konsolidasi, dashboard, audit, Shopee, dan AI.
- Sync, dashboard, Shopee, dan AI tidak boleh mengganggu checkout kasir.
- AI hanya memberi rekomendasi, bukan mengubah data bisnis otomatis.

## Role MVP

| Role | Fokus |
| --- | --- |
| Cashier | Checkout POS, shift, receipt, sync status dasar. |
| Store Supervisor | Operasi cabang, inventory adjustment, dashboard cabang, audit cabang. |
| HQ Admin | Master data, dashboard pusat, sync monitoring, Shopee, audit. |
| Executive / Analyst | Dashboard pusat dan AI insight. |

## Scope MVP

MVP harus membuktikan bahwa Omnia dapat:

1. Menjalankan transaksi POS cabang secara local-first.
2. Menyimpan transaksi, payment, shift, dan stock movement ke local store.
3. Melakukan replay sync dari cabang ke backend pusat.
4. Menyediakan master data dasar: user, role, branch, register, category, product, price.
5. Mengelola inventory balance dan stock movement dasar.
6. Menampilkan dashboard cabang dan pusat dari data central DB.
7. Menerima order Shopee melalui webhook/import mock-first.
8. Memetakan SKU Shopee ke produk internal.
9. Menampilkan AI insight dasar seperti low stock dan stockout prediction sederhana.
10. Menyediakan audit log dan monitoring sync/integration.

## Out of Scope MVP

- Payment gateway langsung.
- Retur/refund kompleks.
- Accounting penuh.
- Multi-marketplace selain Shopee.
- Campaign/chat marketplace.
- Replenishment otomatis.
- AI auto-action untuk stok, harga, atau order.
- Mobile-first app.

## KPI MVP

| Area | Ukuran sukses |
| --- | --- |
| Operasional POS | Checkout tetap bisa dilakukan saat offline. |
| Reliability | Sync replay tidak menggandakan transaksi. |
| Inventory | Stock movement tercatat dan auditable. |
| Dashboard | HQ dapat melihat KPI dasar cabang/pusat. |
| Omnichannel | Order Shopee dummy/sandbox bisa masuk sebagai order internal. |
| AI | Insight tampil sebagai rekomendasi dengan confidence/status. |

## Risiko Produk

- Scope melebar sebelum POS stabil.
- Sync offline-online menghasilkan duplikasi atau data parsial.
- AI insight dipercaya berlebihan saat data belum cukup.
- Integrasi Shopee memengaruhi checkout.

Mitigasi utama: kunci scope MVP, pisahkan jalur checkout dari fitur berat, gunakan idempotency/audit log, dan jadikan Sprint 8 sebagai tempat ekspansi post-MVP.

