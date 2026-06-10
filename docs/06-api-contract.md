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

| Method | Endpoint        | Fungsi                                             |
| ------ | --------------- | -------------------------------------------------- |
| POST   | `/auth/login`   | Login, access token, dan refresh token.            |
| POST   | `/auth/refresh` | Rotasi refresh session dan menerbitkan token baru. |
| POST   | `/auth/logout`  | Mencabut refresh session.                          |
| GET    | `/auth/me`      | Current user context.                              |

MVP memakai bearer token HS256 dengan validasi signature, algoritma, claim, dan
masa berlaku. Refresh token bersifat opaque, hanya hash HMAC yang disimpan di
database, dirotasi sekali pakai, dan dapat dicabut melalui logout. Access token
lama tetap berlaku sampai expiry pendeknya.

## Master Data

| Method | Endpoint                             | Fungsi          |
| ------ | ------------------------------------ | --------------- |
| GET    | `/users`                             | List user.      |
| GET    | `/roles`                             | List role.      |
| GET    | `/branches`                          | List branch.    |
| GET    | `/registers`                         | List register.  |
| GET    | `/categories`                        | List category.  |
| GET    | `/products`                          | List product.   |
| GET    | `/branches/:branchId/product-prices` | Branch pricing. |

Master data read membutuhkan bearer token. Daftar user, role, branch, dan
category dibatasi untuk HQ Admin. Register dan harga cabang mengikuti branch
scope user. Katalog POS hanya memakai harga aktif yang sedang berlaku.

## Inventory

| Method | Endpoint                     | Fungsi                       |
| ------ | ---------------------------- | ---------------------------- |
| GET    | `/inventory/balances`        | Inventory balance.           |
| GET    | `/inventory/movements`       | Stock movement.              |
| GET    | `/inventory/stock-movements` | Alias/compat stock movement. |

Inventory read membutuhkan bearer token dan mengikuti branch scope user.
Mutation inventory masuk melalui sync event `stock_movement.created`; backend
menolak stok negatif dan snapshot before/after yang tidak cocok.

## Sync

| Method | Endpoint        | Fungsi                                           |
| ------ | --------------- | ------------------------------------------------ |
| POST   | `/sync/events`  | Menerima event seperti shift dan stock movement. |
| POST   | `/sync/bundles` | Menerima transaction bundle.                     |
| GET    | `/sync/jobs`    | Monitoring sync job.                             |
| GET    | `/sync/logs`    | Monitoring sync log.                             |

## Dashboard, Reports, Audit, Monitoring

Filter `from` dan `to` pada dashboard/report harus berupa ISO 8601 datetime
dengan timezone. Jika keduanya dikirim, `from` tidak boleh melewati `to`.

| Method | Endpoint                            | Fungsi                                                                                                |
| ------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| GET    | `/dashboard/branch`                 | KPI cabang.                                                                                           |
| GET    | `/dashboard/central`                | KPI pusat.                                                                                            |
| GET    | `/reports/sales-summary`            | Sales summary.                                                                                        |
| GET    | `/reports/sales-summary/export`     | Export sales summary CSV terbatas sesuai filter; header `X-Omnia-Truncated` menandai hasil terpotong. |
| GET    | `/reports/inventory-alerts`         | Inventory alerts.                                                                                     |
| GET    | `/audit/logs`                       | Audit log.                                                                                            |
| GET    | `/monitoring/branches/sync-health`  | Branch sync health.                                                                                   |
| GET    | `/monitoring/llm/generation-health` | LLM generation health/status.                                                                         |

## Removed Shopee / Marketplace API

Shopee endpoints are no longer part of active MVP contract. Existing
`/integrations/shopee/*`, `/webhooks/shopee/*`, and Shopee monitoring routes
must be removed from implementation or explicitly treated as legacy until
deleted.

## LLM Insights

| Method | Endpoint                            | Fungsi                                  |
| ------ | ----------------------------------- | --------------------------------------- |
| GET    | `/ai/insights`                      | List persisted LLM insights.            |
| POST   | `/ai/insights/generate`             | Trigger bounded LLM insight generation. |
| GET    | `/ai/insights/low-stock`            | Low stock LLM insight view/filter.      |
| GET    | `/ai/insights/stockout-predictions` | Stockout risk LLM insight view/filter.  |
| GET    | `/ai/generation-jobs`               | LLM generation job history/status.      |

LLM endpoints require bearer token and are restricted to HQ Admin and
Executive/Analyst roles. Provider API keys are server-side only. Responses must
include reference data and generation metadata; malformed provider output is
rejected instead of persisted.

## Permission Boundary

- Cashier: POS, shift, receipt, sync status dasar.
- Supervisor: cashier flow, inventory adjustment, dashboard cabang, audit cabang.
- HQ Admin: central dashboard, master data, monitoring, audit, dan LLM insight.
- Executive/Analyst: central dashboard dan LLM insight.
