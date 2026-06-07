# Omnia Agent PRD

## 1. Product Summary

Omnia adalah Hybrid Omnichannel Smart POS untuk retail dan UMKM multi-cabang. Sistem ini menggabungkan POS cabang local-first, inventory, sinkronisasi ke pusat, dashboard operasional, integrasi Shopee, audit, monitoring, dan AI insight dasar.

Source of truth dokumentasi utama berada di `docs/01-index.md`. File ini adalah ringkasan agent-facing agar sesi implementasi cepat memahami konteks sistem tanpa membaca semua dokumen dari awal.

## 2. Product Goals

MVP Omnia harus membuktikan bahwa:

1. POS cabang tetap bisa checkout saat offline.
2. Data lokal dapat disinkronkan ke backend pusat tanpa duplikasi.
3. HQ dapat melihat dashboard pusat dari data yang sudah terkonsolidasi.
4. Shopee order dapat masuk sebagai order internal melalui integrasi mock/sandbox-first.
5. AI insight dasar dapat memberi rekomendasi tanpa melakukan aksi otomatis.

## 3. User Roles

| Role | Fungsi |
| --- | --- |
| Cashier | POS checkout, shift, receipt, sync status dasar. |
| Store Supervisor | Dashboard cabang, POS, inventory adjustment, audit cabang. |
| HQ Admin | Dashboard pusat, master data, sync monitoring, Shopee, audit. |
| Executive / Analyst | Dashboard pusat dan AI insights. |

## 4. Core Features

### 4.1 Authentication and Access

- Login user.
- Current user context.
- Role-based navigation.
- Backend permission guard wajib menjadi sumber keamanan utama.
- UI role-based hanya untuk UX.

### 4.2 POS Local-First

- Product search/catalog.
- Cart management.
- Manual payment record.
- Transaction creation.
- Receipt preview.
- Local stock movement.
- Local sync queue write.
- Offline checkout harus tetap berjalan.

### 4.3 Shift Operation

- Open shift.
- Close shift.
- Shift event masuk local queue.
- Shift tersinkron ke central DB melalui sync event.

### 4.4 Inventory

- Inventory balance.
- Stock movement history.
- Local stock adjustment.
- Backend central inventory read API.
- Stock movement harus auditable.

### 4.5 Sync

- `transaction.bundle`.
- `shift.opened`.
- `shift.closed`.
- `stock_movement.created`.
- Idempotency untuk replay.
- Sync job/log untuk monitoring.
- Conflict resolver masih dasar.

### 4.6 Dashboard and Reporting

- Branch dashboard.
- Central dashboard.
- Sales summary.
- Inventory alerts.
- Payment summary.
- Top/slow moving products.
- Dashboard harus read-only dari central DB.

### 4.7 Shopee Integration

- Shopee store registration.
- Product/SKU mapping.
- Webhook/import order.
- Duplicate webhook protection.
- Integration job retry.
- Integration health monitoring.

### 4.8 AI Insights

- Low stock insight.
- Stockout prediction sederhana.
- Severity dan confidence score.
- Reference data.
- AI bersifat advisory-only.

### 4.9 Audit and Monitoring

- Audit log untuk perubahan penting.
- Branch sync health.
- Shopee integration health.
- Sync jobs/logs.

## 5. Tech Stack

| Layer | Stack |
| --- | --- |
| Monorepo | pnpm workspace |
| Frontend/Desktop | Next.js, React, TypeScript, Electron |
| Styling/UI | Tailwind CSS, internal `@omnia/ui`, lucide-react |
| State | Zustand, TanStack Query |
| Local DB | SQLite |
| Backend | NestJS, TypeScript |
| Central DB | PostgreSQL |
| ORM | Prisma |
| Queue | Redis, BullMQ |
| Validation | Zod, class-validator/class-transformer |
| API Docs | Swagger/OpenAPI |
| AI Worker | Python skeleton + backend AI orchestration |
| CI/CD | GitHub Actions, Docker |

## 6. Application Flow

### Desktop Runtime Flow

1. Next.js renders the POS/backoffice UI.
2. Electron hosts the renderer inside BrowserWindow.
3. SQLite/local file access runs in Electron main process.
4. Renderer calls local features through `window.omniaDesktop.localStore`.
5. Browser-only mode is limited/fallback for local-first POS features.

### POS Flow

1. User login.
2. Role directs user to POS/workspace.
3. Cashier adds products to cart.
4. Cashier records payment.
5. Desktop app writes transaction, items, payment, stock movement, and sync queue to SQLite.
6. Receipt preview appears.
7. Sync replay sends bundle to backend when connection is available.
8. Backend applies bundle to PostgreSQL idempotently.

### Sync Flow

1. Local app writes event/bundle to queue.
2. Replay sends payload to `/api/v1/sync/events` or `/api/v1/sync/bundles`.
3. Backend validates payload.
4. Backend checks idempotency.
5. Backend applies changes to central DB.
6. Backend writes sync job, sync log, and audit log.

### Shopee Flow

1. HQ Admin connects store.
2. HQ Admin maps Shopee SKU to internal product.
3. Webhook order enters backend.
4. Backend validates duplicate webhook/order.
5. Backend creates online order and integration logs.
6. Failed job can be retried.

### AI Flow

1. User opens AI Insights.
2. Backend reads central inventory and sales data.
3. Backend returns advisory insight with severity, confidence, and reference data.
4. User decides action manually.

## 7. API Summary

Base prefix: `/api/v1`.

Important endpoints:

- `GET /health`
- `POST /auth/login`
- `GET /auth/me`
- `GET /users`
- `GET /roles`
- `GET /branches`
- `GET /registers`
- `GET /categories`
- `GET /products`
- `GET /branches/:branchId/product-prices`
- `GET /inventory/balances`
- `GET /inventory/movements`
- `POST /sync/events`
- `POST /sync/bundles`
- `GET /sync/jobs`
- `GET /sync/logs`
- `GET /dashboard/branch`
- `GET /dashboard/central`
- `GET /reports/sales-summary`
- `GET /reports/inventory-alerts`
- `GET /audit/logs`
- `GET /monitoring/branches/sync-health`
- `GET /monitoring/integrations/shopee`
- `POST /integrations/shopee/stores`
- `GET /integrations/shopee/stores`
- `POST /integrations/shopee/product-mappings`
- `GET /integrations/shopee/product-mappings`
- `GET /integrations/shopee/orders`
- `POST /integrations/shopee/jobs/:job_id/retry`
- `POST /webhooks/shopee/orders`
- `GET /ai/insights`
- `GET /ai/insights/low-stock`
- `GET /ai/insights/stockout-predictions`

## 8. Database Summary

Central PostgreSQL domain:

- Access: `Role`, `User`
- Branch: `Branch`, `Register`, `Shift`
- Product: `Category`, `Product`, `ProductVariant`, `BranchProductPrice`
- Inventory: `InventoryBalance`, `StockMovement`
- POS: `SalesTransaction`, `SalesTransactionItem`, `Payment`
- Omnichannel: `SalesChannel`, `ChannelStore`, `ProductChannelMapping`, `OnlineOrder`, `OnlineOrderItem`
- Integration: `WebhookEvent`, `IntegrationJob`, `IntegrationLog`
- AI: `AiInsight`, `InsightGenerationJob`
- Sync: `SyncJob`, `SyncLog`
- Audit: `AuditLog`

Local SQLite stores:

- POS transactions.
- Transaction items.
- Payments.
- Shifts.
- Stock movements.
- Inventory cache/balance.
- Sync queue.
- Master data cache minimum.

## 9. Non-Functional Requirements

- POS checkout must not depend on dashboard, Shopee, or AI availability.
- Sync must be idempotent.
- Important changes must be auditable.
- Dashboard must not query local SQLite directly.
- Backend authorization must enforce role and branch scope.
- Runtime config must come from environment variables.
- Secrets must not be committed.
- Backend, frontend, API, sync, and database code must stay modular by domain.
- Query, rendering, and sync paths must be bounded and observable enough to tune when performance degrades.
- Reusable engineering patterns must be documented in `docs/13-engineering-knowledge.md`.
- POS cabang must be desktop-wrapper ready; SQLite/local-first features must run through Electron bridge, not browser-only APIs.
- Production desktop packaging must follow `docs/14-desktop-wrapper-readiness.md`.

## 10. Current Known Gaps

- Auth needs production-grade JWT hardening.
- Permission and branch-scope tests need expansion.
- UI is functional but not final/pixel-perfect.
- Production Electron packaging is not fully validated yet.
- Receipt printing is not fully implemented.
- Conflict resolver UI is not implemented.
- Shopee needs real sandbox/credential validation.
- Python AI worker is still lightweight/dry-run oriented.
