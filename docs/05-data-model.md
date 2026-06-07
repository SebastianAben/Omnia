# Data Model

Data model Omnia dibagi berdasarkan domain operasional. Implementasi aktual memakai Prisma dan PostgreSQL pusat; local store memakai SQLite untuk subset data operasional cabang.

## Domain dan Entitas

| Domain | Entitas |
| --- | --- |
| Access | `Role`, `User` |
| Branch | `Branch`, `Register`, `Shift` |
| Product | `Category`, `Product`, `ProductVariant`, `BranchProductPrice` |
| Inventory | `InventoryBalance`, `StockMovement` |
| POS | `SalesTransaction`, `SalesTransactionItem`, `Payment` |
| Omnichannel | `SalesChannel`, `ChannelStore`, `ProductChannelMapping`, `OnlineOrder`, `OnlineOrderItem` |
| Integration | `WebhookEvent`, `IntegrationJob`, `IntegrationLog` |
| AI | `AiInsight`, `InsightGenerationJob` |
| Sync | `SyncJob`, `SyncLog` |
| Audit | `AuditLog` |

## Relasi Penting

- User memiliki role dan branch utama.
- Branch memiliki register, shift, inventory balance, price, dan transaksi.
- Product memiliki category, variant, branch price, inventory balance, dan stock movement.
- Sales transaction memiliki item dan payment.
- Stock movement menjadi ledger perubahan stok.
- Sync job memiliki banyak sync log.
- Shopee order tersambung ke channel store dan item order.
- Product channel mapping menghubungkan SKU marketplace ke produk internal.
- Audit log menyimpan jejak aktivitas penting lintas modul.

## Aturan Data MVP

- Transaksi POS yang sudah dikonfirmasi lokal dianggap final secara operasional.
- Inventory balance adalah status; stock movement adalah sumber perubahan.
- Tidak ada retur/refund kompleks pada MVP.
- Payment dicatat manual; belum ada payment gateway langsung.
- Sync harus idempotent agar replay tidak menggandakan data.
- AI insight menyimpan severity, confidence, reference data, dan status generation.

## Local Store

SQLite lokal menyimpan data minimum untuk cabang:

- transaksi POS
- item transaksi
- payment
- shift
- stock movement
- inventory balance/cache
- sync queue
- cache master data minimum

