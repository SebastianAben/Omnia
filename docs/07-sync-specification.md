# Sync Specification

## Tujuan

Sync menghubungkan operasi local-first cabang dengan backend pusat tanpa mengganggu checkout. Semua event harus auditable, replayable, dan idempotent.

## Scope MVP

Event/bundle minimum:

- `transaction.bundle`
- `shift.opened`
- `shift.closed`
- `stock_movement.created`

Out-of-scope MVP:

- Sync real-time penuh.
- Conflict resolver kompleks.
- Retur/refund.
- Payment gateway reconciliation.

## Event Envelope

Field minimum:

- `event_id`
- `event_type`
- `event_version`
- `branch_id`
- `source_system`
- `source_mode`
- `entity_type`
- `entity_id`
- `occurred_at`
- `payload`

## Transaction Bundle

Bundle transaksi harus berisi:

- transaction header
- transaction items
- payment records
- stock movements
- local metadata

Backend harus memproses bundle dalam satu alur logis dan menulis sync job/log/audit.

## Idempotency

Aturan:

- `event_id` atau `bundle_id` tidak boleh diproses dua kali sebagai data baru.
- Duplicate valid dikembalikan sebagai success/idempotent result.
- Entity final seperti transaksi completed tidak boleh dioverwrite sembarang.
- Webhook Shopee duplicate tidak boleh membuat order ganda.

## Retry dan Replay

Cabang:

1. Event ditulis ke local sync queue.
2. Jika gagal, status tetap pending/failed dengan retry metadata.
3. Saat online, queue direplay berdasarkan prioritas dan waktu.
4. Error disimpan untuk UI sync status.

Pusat:

1. Validasi payload.
2. Cek idempotency.
3. Apply data.
4. Tulis sync job, sync log, dan audit log.
5. Enqueue acknowledgement/job lanjutan jika diperlukan.

## Conflict Rules

MVP mengenali conflict minimum:

- transaksi duplicate
- stock movement duplicate
- payload invalid
- branch/product/register tidak dikenal
- event lebih lama dari state pusat yang sudah final

Pendekatan MVP: deteksi, log, dan expose untuk monitoring. Resolver UI manual masuk hardening/post-MVP.

## Monitoring

Minimum metrics:

- pending sync count
- failed sync count
- last successful sync
- duplicate event count
- branch offline duration
- integration job failures

