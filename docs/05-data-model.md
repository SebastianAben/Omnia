# Data Model

Data model Omnia dibagi berdasarkan domain operasional. Implementasi aktual memakai Prisma dan PostgreSQL pusat; local store memakai SQLite untuk subset data operasional cabang.

## Domain dan Entitas

| Domain             | Entitas                                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Access             | `Role`, `User`, `AuthSession`                                                                                                 |
| Branch             | `Branch`, `Register`, `Shift`                                                                                                 |
| Product            | `Category`, `Product`, `ProductVariant`, `BranchProductPrice`                                                                 |
| Inventory          | `InventoryBalance`, `StockMovement`                                                                                           |
| POS                | `SalesTransaction`, `SalesTransactionItem`, `Payment`                                                                         |
| Legacy Marketplace | `SalesChannel`, `ChannelStore`, `ProductChannelMapping`, `OnlineOrder`, `OnlineOrderItem` sampai migration removal diputuskan |
| Legacy Integration | `WebhookEvent`, `IntegrationJob`, `IntegrationLog` sampai migration removal diputuskan                                        |
| LLM/AI             | `AiInsight`, `InsightGenerationJob`, provider/prompt metadata yang dibutuhkan                                                 |
| Sync               | `SyncJob`, `SyncLog`                                                                                                          |
| Audit              | `AuditLog`                                                                                                                    |

## Relasi Penting

- User memiliki role dan branch utama.
- User memiliki refresh session yang dapat dirotasi dan dicabut per device.
- Branch memiliki register, shift, inventory balance, price, dan transaksi.
- Product memiliki category, variant, branch price, inventory balance, dan stock movement.
- Sales transaction memiliki item dan payment.
- Stock movement menjadi ledger perubahan stok.
- Sync job memiliki banyak sync log.
- Marketplace/Shopee relation lama tidak lagi menjadi scope aktif MVP.
- Audit log menyimpan jejak aktivitas penting lintas modul.

## Aturan Data MVP

- Transaksi POS yang sudah dikonfirmasi lokal dianggap final secara operasional.
- Inventory balance adalah status; stock movement adalah sumber perubahan.
- Stock movement harus konsisten dengan `quantity_before`, `quantity_delta`,
  dan `quantity_after`; mutation yang membuat stok negatif ditolak.
- Tidak ada retur/refund kompleks pada MVP.
- Payment dicatat manual; belum ada payment gateway langsung.
- POS checkout baru bersifat paid-only: transaksi kasir yang disimpan dari POS
  harus memiliki pembayaran lunas dan `amount_received` yang mencukupi total.
  Status payment pending hanya dipertahankan sebagai kompatibilitas data lama
  atau schema non-POS legacy, bukan alur kasir aktif.
- Close shift lokal menyimpan snapshot rekonsiliasi: total sales, cash,
  non-cash, expected cash, closing cash, variance, dan metadata peringatan
  untuk transaksi lokal lama yang belum lunas jika masih ada.
- Sync harus idempotent agar replay tidak menggandakan data.
- LLM insight menyimpan severity, confidence, recommendation, reference data,
  provider/model metadata, prompt version, output validation status, dan status
  generation.

## Local Store

SQLite lokal menyimpan data minimum untuk cabang:

- transaksi POS
- item transaksi
- payment
- shift, termasuk snapshot rekonsiliasi close-shift
- stock movement
- inventory balance/cache
- sync queue
- cache master data minimum
