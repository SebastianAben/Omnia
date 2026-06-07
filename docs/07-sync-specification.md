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

`source_mode` yang dikirim ke backend memakai `online` atau
`offline_replay`. Status koneksi lokal `offline` harus dinormalisasi menjadi
`offline_replay` saat envelope disimpan.

Untuk event shift:

- `produced_by_user_id` harus sama dengan bearer user.
- Satu register hanya boleh memiliki satu shift `OPEN`.
- Close hanya valid untuk shift lokal/pusat yang masih `OPEN`.
- Duplicate event ID dikembalikan sebagai hasil idempotent.

## Transaction Bundle

Bundle transaksi harus berisi:

- transaction header
- transaction items
- payment records
- stock movements
- local metadata

Backend harus memproses bundle dalam satu alur logis dan menulis sync job/log/audit.

Validasi minimum bundle:

- cashier, register, branch, product, dan shift harus aktif serta konsisten
- waktu transaksi harus berada dalam rentang shift
- total header harus sama dengan agregasi item dan diskon
- pembayaran `paid` harus mencukupi total transaksi
- actor dan source ID stock movement harus cocok dengan transaksi
- agregasi kuantitas movement penjualan harus sama dengan item
- saldo stok pusat tidak boleh menjadi negatif

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

Retry lokal:

- replay hanya mengambil event due (`next_retry_at` kosong atau sudah lewat)
- batch replay dibatasi agar checkout tetap responsif
- failed replay memakai backoff dan menyimpan error terakhir
- queued event yang macet dipulihkan ke failed agar tidak hilang diam-diam

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
