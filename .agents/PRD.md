# Omnia Agent PRD

## 1. Product Summary

Omnia adalah Hybrid Smart POS untuk retail dan UMKM multi-cabang. Sistem ini menggabungkan POS cabang local-first, inventory, sinkronisasi ke pusat, dashboard operasional, audit, monitoring, dan LLM-powered operational insights.

Source of truth dokumentasi utama berada di `docs/01-index.md`. File ini adalah ringkasan agent-facing agar sesi implementasi cepat memahami konteks sistem tanpa membaca semua dokumen dari awal.

## 2. Product Goals

MVP Omnia harus membuktikan bahwa:

1. POS cabang tetap bisa checkout saat offline.
2. Data lokal dapat disinkronkan ke backend pusat tanpa duplikasi.
3. HQ dapat melihat dashboard pusat dari data yang sudah terkonsolidasi.
4. LLM insight dapat memberi analisis operasional dari data pusat tanpa melakukan aksi otomatis.
5. POS, inventory, sync, dashboard, audit, dan LLM insight tetap berjalan dalam boundary yang aman dan auditable.

## 3. User Roles

| Role                | Fungsi                                                                  |
| ------------------- | ----------------------------------------------------------------------- |
| Cashier             | POS checkout, shift, receipt, sync status dasar.                        |
| Store Supervisor    | Dashboard cabang, POS, inventory adjustment, audit cabang.              |
| HQ Admin            | Dashboard pusat, master data, sync monitoring, audit, dan LLM insights. |
| Executive / Analyst | Dashboard pusat dan LLM insights.                                       |

## 4. Core Features

### 4.0 Feature Completeness Snapshot

| Feature                              | Current status        | Next implementation phase                                                             |
| ------------------------------------ | --------------------- | ------------------------------------------------------------------------------------- |
| Kasir Digital                        | Mostly implemented    | Runtime Electron smoke for high-volume POS transaction UX.                            |
| Manajemen Stok Pintar dan Notifikasi | Mostly implemented    | Runtime Electron smoke for smart stock notifications.                                 |
| Dashboard Real Time dan Prediksi     | Mostly implemented    | Live Gemini validation with production/UAT key and runtime acceptance.                |
| Auto Reconciliation                  | Implemented for MVP   | Runtime Electron smoke and UAT acceptance.                                            |

Feedback user mapping:

- Cashier identity/login context: implemented through authenticated user,
  branch, register, shift, checkout, and sync actor metadata.
- Out-of-stock products blocked from checkout: implemented through POS UI,
  cart cap, Electron main validation, and central sync stock guards.
- Faster high-volume transaction flow: implemented for MVP with keyboard-wedge
  scan/search, keyboard flow, bounded catalog rendering, and stock-safe direct
  cart quantity input; Electron runtime smoke remains pending.
- Smart stock notifications: implemented for MVP as computed in-app Inventory
  and POS warnings for local low-stock/out-of-stock states; global notification
  center, OS push, and persisted dismissals are deferred.
- Dashboard freshness and prediction validation: implemented for MVP as
  query/refresh-based central dashboard freshness indicators plus controlled LLM
  generation status; true streaming realtime is not part of MVP.
- Close-shift sales/cash/non-cash/variance preview: implemented locally for
  MVP close-shift flow.
- Consistent repetitive UI/UX: implemented for MVP through Phase 17 shared
  state/copy polish and role-based UAT checklist; runtime UAT remains pending.
- Marketplace/Shopee sales integration: explicitly excluded from active scope
  and must not be added to next phases unless product scope is reopened.

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

### 4.7 LLM Insights

- LLM provider integration via server-side API key.
- Insight generation from central sales, inventory, sync, and audit context.
- Low stock, stockout risk, sales trend, anomaly, and operational recommendation narratives.
- Severity dan confidence score.
- Reference data.
- Structured output validation before persistence.
- Prompt/version metadata, provider response metadata, and generation job status.
- LLM bersifat advisory-only and cannot mutate stock, price, order, payment, sync, or master data.

### 4.8 Removed/Deprecated Marketplace Integration

- Shopee integration is removed from active product scope.
- Active Shopee routes, UI, env variables, and smoke checks have been removed; legacy marketplace data models remain inert until cleanup is approved.
- Marketplace integration can return as a future product initiative only after POS, sync, and LLM acceptance are stable.

### 4.9 Audit and Monitoring

- Audit log untuk perubahan penting.
- Branch sync health.
- Sync jobs/logs.
- LLM generation job status, failures, cost/rate-limit metadata where available.

## 5. Tech Stack

| Layer            | Stack                                                |
| ---------------- | ---------------------------------------------------- |
| Monorepo         | pnpm workspace                                       |
| Frontend/Desktop | Next.js, React, TypeScript, Electron                 |
| Styling/UI       | Tailwind CSS, internal `@omnia/ui`, lucide-react     |
| State            | Zustand, TanStack Query                              |
| Local DB         | SQLite                                               |
| Backend          | NestJS, TypeScript                                   |
| Central DB       | PostgreSQL                                           |
| ORM              | Prisma                                               |
| Queue            | Redis, BullMQ                                        |
| Validation       | Zod, class-validator/class-transformer               |
| API Docs         | Swagger/OpenAPI                                      |
| LLM Worker       | Backend/worker orchestration for LLM generation jobs |
| CI/CD            | GitHub Actions, Docker                               |

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

### LLM Insight Flow

1. User opens LLM Insights.
2. Backend loads bounded central inventory, sales, sync, and audit context.
3. Backend builds a prompt with explicit schema, reference data, and safety constraints.
4. Backend calls the configured LLM provider using server-side credentials only.
5. Backend validates structured output before saving insight records.
6. Backend returns advisory insight with severity, confidence, recommendation, references, provider metadata, and generation status.
7. User decides action manually; LLM output never performs operational mutations.

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
- `GET /ai/insights`
- `GET /ai/insights/low-stock`
- `GET /ai/insights/stockout-predictions`
- `POST /ai/insights/generate`
- `GET /ai/generation-jobs`

## 8. Database Summary

Central PostgreSQL domain:

- Access: `Role`, `User`
- Branch: `Branch`, `Register`, `Shift`
- Product: `Category`, `Product`, `ProductVariant`, `BranchProductPrice`
- Inventory: `InventoryBalance`, `StockMovement`
- POS: `SalesTransaction`, `SalesTransactionItem`, `Payment`
- Legacy marketplace entities to remove/deprecate: `SalesChannel`, `ChannelStore`, `ProductChannelMapping`, `OnlineOrder`, `OnlineOrderItem`
- Legacy integration entities to remove/deprecate: `WebhookEvent`, `IntegrationJob`, `IntegrationLog`
- LLM/AI: `AiInsight`, `InsightGenerationJob`, provider metadata/config as needed
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

- POS checkout must not depend on dashboard, LLM, or central connectivity.
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
- Shopee integration is removed from active backend, frontend, smoke, env, and documentation surfaces; legacy schema cleanup remains a separate data-retention decision.
- Current LLM implementation uses Gemini provider integration with structured-output validation, server-side credentials, persisted generation jobs, cooldown/cache reuse, and advisory-only guardrails.
- Live provider validation, rate-limit observability, and production cost/error monitoring still need UAT/runtime coverage.
