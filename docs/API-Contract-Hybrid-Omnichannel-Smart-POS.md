# API Contract

## 1. Informasi Dokumen

- Nama produk: Omnia
- Nama dokumen: API Contract
- Versi: 1.0
- Tanggal: 2026-04-28
- Referensi:
  - `docs/PRD-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/MVP-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/High-Level-Architecture-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/ERD-Awal-Hybrid-Omnichannel-Smart-POS.md`
  - `docs/Sync-Specification-Detail-Hybrid-Omnichannel-Smart-POS.md`

## 2. Tujuan Dokumen

Dokumen ini mendefinisikan kontrak API logis untuk MVP Omnia agar:

- frontend aplikasi utama
- local sync layer
- central backend
- Shopee integration service
- dashboard dan AI layer

memiliki boundary yang jelas dan konsisten.

Dokumen ini adalah kontrak fungsional tingkat aplikasi. Dokumen ini belum menentukan:

- framework backend
- format OpenAPI final
- tipe data final per bahasa pemrograman
- aturan keamanan jaringan tingkat infrastruktur

## 3. Prinsip API

- API pusat menjadi antarmuka resmi ke layanan pusat.
- Operasional cabang tetap dapat berjalan lokal saat offline.
- Semua endpoint pusat harus aman terhadap duplicate request pada alur sinkronisasi.
- Role dan permission harus dicek di backend, bukan hanya di UI.
- Endpoint transaksi dan endpoint reporting harus dipisah secara logis.
- API harus mendukung branch-scoped access.

## 4. Konvensi Umum

### 4.1 Base Path

Contoh base path logis:

```text
/api/v1
```

### 4.2 Content Type

Gunakan:

```text
application/json
```

### 4.3 Time Format

Gunakan ISO 8601 untuk semua datetime.

### 4.4 Resource ID

Setiap entitas utama memakai ID unik global.

Contoh:

- user_id
- branch_id
- product_id
- sales_transaction_id
- sync_job_id

### 4.5 Standard Response Envelope

Respons API pusat disarankan memakai envelope standar:

```json
{
  "success": true,
  "message": "optional human-readable message",
  "data": {},
  "meta": {}
}
```

Jika gagal:

```json
{
  "success": false,
  "message": "validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  }
}
```

### 4.6 Pagination

Untuk list endpoint:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total_items": 120,
    "total_pages": 6
  }
}
```

### 4.7 Idempotency

Endpoint sync dan endpoint integrasi tertentu harus mendukung:

- `Idempotency-Key` pada header, atau
- `event_id` di body request

## 5. Authentication dan Authorization

### 5.1 Auth Model

MVP memakai session token atau bearer token.

Header:

```text
Authorization: Bearer <token>
```

### 5.2 Branch Scope

Backend harus mengecek:

- role user
- branch access
- permission aksi

### 5.3 Role MVP

- Cashier
- Store Supervisor
- HQ Admin
- Executive / Analyst

## 6. Modul API

Kontrak API dibagi ke modul berikut:

1. Auth
2. Users and Roles
3. Branches and Registers
4. Products and Pricing
5. Inventory
6. POS Transactions
7. Payments
8. Shifts
9. Sync
10. Dashboard and Reports
11. Shopee Integration
12. AI Insights
13. Audit and Monitoring

## 7. Auth API

### 7.1 Login

`POST /api/v1/auth/login`

Tujuan:

- login user ke sistem pusat saat koneksi tersedia

Request:

```json
{
  "username": "demo.user",
  "password": "secret-password",
  "device_id": "branch-a-register-01"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "jwt-or-session-token",
    "user": {
      "id": "usr_001",
      "full_name": "Demo User",
      "role_code": "cashier",
      "branch_id": "br_001"
    },
    "permissions": [],
    "branches": []
  }
}
```

### 7.2 Logout

`POST /api/v1/auth/logout`

Tujuan:

- mengakhiri sesi user

### 7.3 Get Session

`GET /api/v1/auth/me`

Tujuan:

- memuat profil user aktif dan permission

## 8. Users and Roles API

### 8.1 List Users

`GET /api/v1/users`

Role:

- HQ Admin

Filter:

- branch_id
- role_code
- is_active

### 8.2 Create User

`POST /api/v1/users`

Role:

- HQ Admin

Request fields logis:

- full_name
- username atau email
- role_id
- branch_id
- password
- is_active

### 8.3 Update User

`PATCH /api/v1/users/{user_id}`

### 8.4 List Roles

`GET /api/v1/roles`

Tujuan:

- memuat role aktif untuk kebutuhan manajemen user dan permission view

## 9. Branches and Registers API

### 9.1 List Branches

`GET /api/v1/branches`

Role:

- semua role sesuai scoping

### 9.2 Get Branch Detail

`GET /api/v1/branches/{branch_id}`

### 9.3 List Registers

`GET /api/v1/registers`

Filter:

- branch_id

### 9.4 Create Register

`POST /api/v1/registers`

Role:

- HQ Admin

## 10. Products and Pricing API

### 10.1 List Products

`GET /api/v1/products`

Query params:

- search
- category_id
- is_active
- updated_after

Response item minimum:

```json
{
  "id": "prd_001",
  "sku": "SKU-001",
  "name": "Produk A",
  "barcode": "8999999999999",
  "category_id": "cat_001",
  "is_active": true
}
```

### 10.2 Get Product Detail

`GET /api/v1/products/{product_id}`

### 10.3 Create Product

`POST /api/v1/products`

Role:

- HQ Admin

Request fields logis:

- sku
- name
- category_id
- barcode
- unit
- description
- is_active

### 10.4 Update Product

`PATCH /api/v1/products/{product_id}`

### 10.5 List Categories

`GET /api/v1/categories`

### 10.6 Set Branch Price

`PUT /api/v1/branches/{branch_id}/product-prices/{product_id}`

Role:

- HQ Admin

Request:

```json
{
  "selling_price": 15000,
  "effective_from": "2026-04-28T00:00:00Z"
}
```

### 10.7 List Branch Prices

`GET /api/v1/branches/{branch_id}/product-prices`

## 11. Inventory API

### 11.1 List Inventory Balances

`GET /api/v1/inventory/balances`

Query params:

- branch_id
- product_id
- low_stock_only
- updated_after

### 11.2 Get Inventory Balance

`GET /api/v1/inventory/balances/{balance_id}`

### 11.3 Create Stock In

`POST /api/v1/inventory/stock-movements/stock-in`

Role:

- Store Supervisor
- HQ Admin

Request:

```json
{
  "branch_id": "br_001",
  "product_id": "prd_001",
  "quantity": 20,
  "reason_code": "manual_stock_in",
  "notes": "restock awal"
}
```

### 11.4 Create Stock Adjustment

`POST /api/v1/inventory/stock-movements/adjustment`

Role:

- Store Supervisor
- HQ Admin

Request:

```json
{
  "branch_id": "br_001",
  "product_id": "prd_001",
  "quantity_delta": -2,
  "reason_code": "stock_opname_adjustment",
  "notes": "selisih opname"
}
```

### 11.5 List Stock Movements

`GET /api/v1/inventory/stock-movements`

Query params:

- branch_id
- product_id
- movement_type
- from
- to

## 12. POS Transactions API

### 12.1 Create Sales Transaction

`POST /api/v1/pos/transactions`

Catatan:

- Endpoint ini dipakai saat aplikasi online penuh ke pusat.
- Pada mode hybrid MVP, kebanyakan transaksi tetap ditulis lokal dulu lalu dikirim melalui sync API.

Request:

```json
{
  "transaction_no": "TRX-BR001-000001",
  "branch_id": "br_001",
  "register_id": "reg_001",
  "shift_id": "sft_001",
  "cashier_user_id": "usr_001",
  "transaction_datetime": "2026-04-28T10:00:00Z",
  "subtotal_amount": 30000,
  "discount_amount": 2000,
  "tax_amount": 2800,
  "total_amount": 30800,
  "payment_status": "paid",
  "transaction_status": "completed",
  "source_mode": "online",
  "items": [
    {
      "product_id": "prd_001",
      "unit_price": 15000,
      "quantity": 2,
      "discount_amount": 2000,
      "tax_amount": 2800,
      "line_total": 30800
    }
  ],
  "payments": [
    {
      "payment_method_code": "cash",
      "amount": 30800,
      "payment_status": "paid"
    }
  ]
}
```

### 12.2 List Sales Transactions

`GET /api/v1/pos/transactions`

Query params:

- branch_id
- cashier_user_id
- from
- to
- transaction_status
- payment_status

### 12.3 Get Sales Transaction Detail

`GET /api/v1/pos/transactions/{transaction_id}`

### 12.4 Void Sales Transaction

`POST /api/v1/pos/transactions/{transaction_id}/void`

Role:

- Store Supervisor
- HQ Admin

Request:

```json
{
  "reason_code": "operator_error",
  "notes": "item salah input"
}
```

Catatan:

- Void flow ada, retur tidak ada.

## 13. Payments API

### 13.1 Record Payment

`POST /api/v1/payments`

Tujuan:

- mencatat pembayaran transaksi jika dibutuhkan terpisah dari create transaction

Request:

```json
{
  "sales_transaction_id": "trx_001",
  "payment_method_code": "cash",
  "amount": 30800,
  "payment_status": "paid",
  "payment_reference": null,
  "notes": "pembayaran tunai"
}
```

### 13.2 List Payments

`GET /api/v1/payments`

Filter:

- sales_transaction_id
- branch_id
- payment_method_code
- payment_status

## 14. Shifts API

### 14.1 Open Shift

`POST /api/v1/shifts/open`

Request:

```json
{
  "branch_id": "br_001",
  "register_id": "reg_001",
  "opened_by_user_id": "usr_001",
  "opening_cash_amount": 100000
}
```

### 14.2 Close Shift

`POST /api/v1/shifts/{shift_id}/close`

Request:

```json
{
  "closed_by_user_id": "usr_001",
  "closing_cash_amount": 350000
}
```

### 14.3 List Shifts

`GET /api/v1/shifts`

Filter:

- branch_id
- register_id
- status
- from
- to

## 15. Sync API

Modul ini adalah modul paling penting untuk arsitektur hybrid.

### 15.1 Push Sync Bundle

`POST /api/v1/sync/bundles`

Tujuan:

- mengirim bundle transaksi dan event lokal dari cabang ke pusat

Request logis:

```json
{
  "event_id": "evt_001",
  "event_type": "transaction.bundle",
  "event_version": 1,
  "branch_id": "br_001",
  "source_system": "branch_app",
  "source_mode": "offline_replay",
  "occurred_at": "2026-04-28T10:00:00Z",
  "produced_by_user_id": "usr_001",
  "payload": {
    "transaction": {},
    "items": [],
    "payments": [],
    "stock_movements": []
  }
}
```

Response:

```json
{
  "success": true,
  "data": {
    "event_id": "evt_001",
    "result_status": "synced",
    "processed_at": "2026-04-28T10:00:03Z"
  }
}
```

### 15.2 Push Generic Sync Event

`POST /api/v1/sync/events`

Tujuan:

- mengirim event non-bundle seperti stock adjustment atau shift event

### 15.3 Get Sync Job Status

`GET /api/v1/sync/jobs/{sync_job_id}`

### 15.4 List Sync Jobs

`GET /api/v1/sync/jobs`

Filter:

- branch_id
- status
- job_type

### 15.5 List Sync Logs

`GET /api/v1/sync/logs`

Filter:

- sync_job_id
- branch_id
- log_level

### 15.6 Pull Master Data Changes

`GET /api/v1/sync/master-data`

Query params:

- branch_id
- updated_after

Response minimum:

```json
{
  "success": true,
  "data": {
    "products": [],
    "categories": [],
    "branch_prices": []
  }
}
```

### 15.7 Get Conflict Resolutions

`GET /api/v1/sync/conflict-resolutions`

Query params:

- branch_id
- resolved_after

## 16. Dashboard and Reports API

### 16.1 Get Branch Dashboard

`GET /api/v1/dashboard/branch`

Query params:

- branch_id
- from
- to

Response fields minimum:

- omzet
- jumlah_transaksi
- top_selling
- slow_moving
- stok_kritis
- payment_method_summary

### 16.2 Get Central Dashboard

`GET /api/v1/dashboard/central`

Role:

- HQ Admin
- Executive / Analyst

### 16.3 Get Sales Summary Report

`GET /api/v1/reports/sales-summary`

Filter:

- branch_id
- from
- to
- sales_channel

### 16.4 Get Inventory Alert Report

`GET /api/v1/reports/inventory-alerts`

Filter:

- branch_id
- low_stock_only

## 17. Shopee Integration API

### 17.1 Connect Shopee Store

`POST /api/v1/integrations/shopee/stores`

Role:

- HQ Admin

Request fields logis:

- store_name
- external_store_id
- auth_payload atau credential_reference

### 17.2 List Shopee Stores

`GET /api/v1/integrations/shopee/stores`

### 17.3 Create Product Mapping

`POST /api/v1/integrations/shopee/product-mappings`

Request:

```json
{
  "channel_store_id": "chs_001",
  "product_id": "prd_001",
  "external_product_id": "shp_prod_123",
  "external_sku": "SKU-SHP-123"
}
```

### 17.4 List Product Mappings

`GET /api/v1/integrations/shopee/product-mappings`

Filter:

- channel_store_id
- product_id
- mapping_status

### 17.5 List Online Orders

`GET /api/v1/integrations/shopee/orders`

Filter:

- order_status
- payment_status
- from
- to

### 17.6 Get Online Order Detail

`GET /api/v1/integrations/shopee/orders/{online_order_id}`

### 17.7 Shopee Webhook Receiver

`POST /api/v1/webhooks/shopee/orders`

Catatan:

- Endpoint ini dipakai oleh Shopee integration flow.
- Perlu validasi signature atau mekanisme autentikasi webhook sesuai implementasi teknis.

Response minimum:

```json
{
  "success": true,
  "message": "webhook accepted"
}
```

### 17.8 Retry Failed Shopee Job

`POST /api/v1/integrations/shopee/jobs/{job_id}/retry`

Role:

- HQ Admin

## 18. AI Insights API

### 18.1 Get AI Insights

`GET /api/v1/ai/insights`

Role:

- HQ Admin
- Executive / Analyst

Filter:

- branch_id
- insight_type
- generated_after

### 18.2 Get Low Stock Alerts

`GET /api/v1/ai/insights/low-stock`

### 18.3 Get Stockout Predictions

`GET /api/v1/ai/insights/stockout-predictions`

Response item minimum:

```json
{
  "id": "ai_001",
  "branch_id": "br_001",
  "product_id": "prd_001",
  "insight_type": "stockout_prediction",
  "title": "Produk A berpotensi habis",
  "summary": "Prediksi stok habis dalam 3 hari",
  "confidence_score": 0.72,
  "generated_at": "2026-04-28T11:00:00Z"
}
```

## 19. Audit and Monitoring API

### 19.1 List Audit Logs

`GET /api/v1/audit/logs`

Role:

- HQ Admin
- Executive / Analyst read-only jika diizinkan

Filter:

- branch_id
- user_id
- entity_type
- action
- from
- to

### 19.2 Get Branch Sync Health

`GET /api/v1/monitoring/branches/sync-health`

Response minimum:

- branch_id
- branch_name
- is_online
- pending_sync_count
- last_successful_sync_at
- failed_sync_count

### 19.3 Get Integration Health

`GET /api/v1/monitoring/integrations/shopee`

## 20. Error Code Contract

Error code minimum yang disarankan:

- `AUTH_INVALID_CREDENTIALS`
- `AUTH_UNAUTHORIZED`
- `AUTH_FORBIDDEN`
- `VALIDATION_ERROR`
- `RESOURCE_NOT_FOUND`
- `DUPLICATE_EVENT`
- `SYNC_CONFLICT`
- `SYNC_FAILED`
- `INTEGRATION_MAPPING_NOT_FOUND`
- `INTEGRATION_WEBHOOK_INVALID`
- `AI_DATA_NOT_READY`
- `INTERNAL_SERVER_ERROR`

Contoh response error:

```json
{
  "success": false,
  "message": "sync conflict detected",
  "error": {
    "code": "SYNC_CONFLICT",
    "details": [
      {
        "field": "entity_id",
        "message": "central state is newer than branch replay"
      }
    ]
  }
}
```

## 21. Permission Boundary per Endpoint

Ringkasan minimum:

- Cashier:
  - login
  - lihat profile sendiri
  - transaksi POS
  - shift open/close sesuai hak
  - sync yang berasal dari transaksi cabang

- Store Supervisor:
  - semua hak kasir yang relevan
  - stock in
  - stock adjustment
  - lihat dashboard cabang
  - lihat status sync cabang

- HQ Admin:
  - master data
  - harga per cabang
  - user management
  - dashboard pusat
  - Shopee integration
  - audit dan monitoring
  - conflict review

- Executive / Analyst:
  - dashboard pusat
  - report
  - AI insights
  - read-only data tertentu sesuai kebijakan

## 22. Offline Consideration

Karena sistem hybrid:

- tidak semua flow akan selalu memanggil API pusat secara langsung
- beberapa operasi dilakukan lokal dulu lalu dikirim via sync endpoint

Implikasi:

- create transaction API pusat bukan satu-satunya jalur pencatatan transaksi
- sync API adalah kontrak paling penting untuk integrasi cabang ke pusat

## 23. OpenAPI Drafting Notes

Saat dokumen ini diturunkan ke spesifikasi OpenAPI nanti, tim perlu menambahkan:

- schema object detail
- enum resmi
- field required vs optional
- example payload lebih lengkap
- auth scheme detail
- rate limiting policy

## 24. Prioritas Endpoint Sprint Awal

Endpoint yang paling penting dibangun lebih dulu:

1. `POST /auth/login`
2. `GET /auth/me`
3. `GET /products`
4. `GET /branches/{branch_id}/product-prices`
5. `POST /sync/bundles`
6. `GET /sync/jobs`
7. `GET /dashboard/branch`
8. `GET /dashboard/central`
9. `POST /integrations/shopee/product-mappings`
10. `GET /ai/insights/low-stock`

## 25. Kesimpulan

API contract ini menetapkan batas yang jelas antara:

- aplikasi cabang
- sync layer
- backend pusat
- dashboard
- Shopee integration
- AI insights

Dengan dokumen ini, tim sudah memiliki dasar kuat untuk lanjut ke:

1. OpenAPI spec atau API schema formal
2. technical design backend
3. pembagian task implementasi frontend, backend, dan sync layer
