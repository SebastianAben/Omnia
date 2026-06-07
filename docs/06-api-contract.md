# API Contract

API Omnia memakai REST dengan prefix logis `/api/v1`. Respons disarankan memakai envelope:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Error memakai bentuk:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Auth

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| POST | `/auth/login` | Login, access token, dan refresh token. |
| POST | `/auth/refresh` | Rotasi refresh session dan menerbitkan token baru. |
| POST | `/auth/logout` | Mencabut refresh session. |
| GET | `/auth/me` | Current user context. |

MVP memakai bearer token HS256 dengan validasi signature, algoritma, claim, dan
masa berlaku. Refresh token bersifat opaque, hanya hash HMAC yang disimpan di
database, dirotasi sekali pakai, dan dapat dicabut melalui logout. Access token
lama tetap berlaku sampai expiry pendeknya.

## Master Data

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/users` | List user. |
| GET | `/roles` | List role. |
| GET | `/branches` | List branch. |
| GET | `/registers` | List register. |
| GET | `/categories` | List category. |
| GET | `/products` | List product. |
| GET | `/branches/:branchId/product-prices` | Branch pricing. |

Master data read membutuhkan bearer token. Daftar user, role, branch, dan
category dibatasi untuk HQ Admin. Register dan harga cabang mengikuti branch
scope user. Katalog POS hanya memakai harga aktif yang sedang berlaku.

## Inventory

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/inventory/balances` | Inventory balance. |
| GET | `/inventory/movements` | Stock movement. |
| GET | `/inventory/stock-movements` | Alias/compat stock movement. |

Inventory read membutuhkan bearer token dan mengikuti branch scope user.
Mutation inventory masuk melalui sync event `stock_movement.created`; backend
menolak stok negatif dan snapshot before/after yang tidak cocok.

## Sync

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| POST | `/sync/events` | Menerima event seperti shift dan stock movement. |
| POST | `/sync/bundles` | Menerima transaction bundle. |
| GET | `/sync/jobs` | Monitoring sync job. |
| GET | `/sync/logs` | Monitoring sync log. |

## Dashboard, Reports, Audit, Monitoring

Filter `from` dan `to` pada dashboard/report harus berupa ISO 8601 datetime
dengan timezone. Jika keduanya dikirim, `from` tidak boleh melewati `to`.

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/dashboard/branch` | KPI cabang. |
| GET | `/dashboard/central` | KPI pusat. |
| GET | `/reports/sales-summary` | Sales summary. |
| GET | `/reports/sales-summary/export` | Export sales summary CSV terbatas sesuai filter; header `X-Omnia-Truncated` menandai hasil terpotong. |
| GET | `/reports/inventory-alerts` | Inventory alerts. |
| GET | `/audit/logs` | Audit log. |
| GET | `/monitoring/branches/sync-health` | Branch sync health. |
| GET | `/monitoring/integrations/shopee` | Shopee integration health. |

## Shopee

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| POST | `/integrations/shopee/stores` | Connect/register store. |
| GET | `/integrations/shopee/stores` | List store. |
| POST | `/integrations/shopee/product-mappings` | Create/update SKU mapping. |
| GET | `/integrations/shopee/product-mappings` | List SKU mapping. |
| GET | `/integrations/shopee/orders` | List imported orders. |
| GET | `/integrations/shopee/orders/:online_order_id` | Detail order. |
| POST | `/integrations/shopee/jobs/:job_id/retry` | Retry integration job. |
| POST | `/webhooks/shopee/orders` | Webhook/import order. |

## AI

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET | `/ai/insights` | List AI insights. |
| GET | `/ai/insights/low-stock` | Low stock insights. |
| GET | `/ai/insights/stockout-predictions` | Stockout prediction sederhana. |

## Permission Boundary

- Cashier: POS, shift, receipt, sync status dasar.
- Supervisor: cashier flow, inventory adjustment, dashboard cabang, audit cabang.
- HQ Admin: central dashboard, master data, Shopee, monitoring, audit.
- Executive/Analyst: central dashboard dan AI insight.
