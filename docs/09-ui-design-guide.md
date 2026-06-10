# UI Design Guide

## Tujuan

UI Omnia harus terasa seperti aplikasi operasional retail: cepat, jelas, padat, dan tidak mengganggu kerja kasir. POS adalah workflow prioritas, bukan halaman marketing.

## Prinsip Visual

- Layout ringkas dan mudah dipindai.
- Navigasi role-based.
- Status online/offline dan sync selalu mudah terlihat.
- Cashier flow harus minim distraksi.
- Dashboard boleh lebih analitis, tetapi tetap read-only dan cepat.
- Gunakan icon untuk navigasi/action yang familiar.
- Hindari UI dekoratif yang memperlambat operasional.

## Prioritas Screen

1. Login.
2. App shell role-based.
3. POS checkout.
4. Payment confirmation.
5. Receipt preview.
6. Shift open/close.
7. Inventory adjustment.
8. Sync status.
9. Dashboard branch/central.
10. LLM insights.
11. Audit log.

## Role UI

| Role       | Menu utama                                                      |
| ---------- | --------------------------------------------------------------- |
| Cashier    | POS, Shift, Receipts, Sync.                                     |
| Supervisor | Dashboard cabang, POS, Shift, Inventory, Receipts, Sync, Audit. |
| HQ Admin   | Dashboard pusat, LLM Insights, Sync, Audit, POS preview.        |
| Executive  | Dashboard pusat, LLM Insights, Sync, Audit.                     |

## Implementation Notes

- UI role-based hanya menyembunyikan menu; backend tetap wajib enforce permission.
- Dashboard membaca central DB/API, bukan local SQLite.
- POS checkout harus tetap bisa dipakai tanpa dashboard/LLM aktif.
- POS checkout kasir hanya menampilkan pembayaran lunas; jangan expose status
  pembayaran Pending di POS karena alurnya belum memiliki penyelesaian order.
- App shell desktop harus menjaga sidebar tetap setinggi viewport; scroll
  halaman terjadi di area konten utama, bukan pada sidebar atau body.
- Figma/Stitch boleh menjadi acuan visual, tetapi tidak boleh melanggar prinsip local-first.

## UI Gap Aktual

- UI sudah fungsional, tetapi belum pixel-perfect dari Figma/Stitch.
- Receipt printing nyata belum selesai.
- Conflict resolver UI belum tersedia.
