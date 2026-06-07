# Omnia Session Implementation

## Document Contract

| Field | Value |
| --- | --- |
| Status | Canonical implementation roadmap |
| Source of truth | `.agents/PRD.md` |
| Supporting status | `.agents/sessionHandoff.md`, `docs/12-actual-status.md` |
| Purpose | Function-by-function backend and frontend delivery plan |

Implementation follows product functions and operational flows instead of broad
backend/frontend batches. Each function is delivered as a vertical slice:

1. Confirm PRD flow, ownership, permission, and local/central data boundary.
2. Define backend contract, validation, persistence, and tests.
3. Implement the frontend adapter and operational surface.
4. Validate backend, frontend, Electron, and offline behavior as applicable.
5. Complete the exit criteria before moving to the next slice.

Historical iteration labels in `sessionHandoff.md` do not create new phases.
The canonical roadmap below runs from Phase/Stage 0 through 12.

## Cross-Cutting Rules

- Follow `.agents/rules.md`.
- Preserve local-first checkout.
- Backend authorization is the security boundary.
- Renderer must not access SQLite, filesystem, secrets, or Node APIs directly.
- Use Electron preload/IPC for desktop capabilities.
- Use TanStack Query for central server state.
- Use Zustand/component state for cart, UI, and active-session state.
- Keep Prisma queries filtered, bounded, and explicit.
- Sync writes must be idempotent and auditable.
- Every slice requires tests or a documented reason for deferral.
- Update `.agents/sessionHandoff.md` after meaningful work.

## Delivery Slice Template

Each implementation session should record:

```text
Function:
Phase/Stage:
PRD mapping:
Current status:
Decision: keep / improve / implement

Backend:
- Contract and validation
- Persistence and transactions
- Permission and branch scope
- Tests

Frontend:
- Route/surface
- API or Electron adapter
- State and error handling
- Tests

Exit criteria:
- Backend
- Frontend
- Runtime/quality
```

## Phase/Stage 0 - Project Memory and Architecture Baseline

Status: Completed.

PRD mapping:

- Product summary, goals, roles, architecture, and non-functional requirements.

Backend scope:

- Establish NestJS, Prisma, PostgreSQL, Redis, and domain module boundaries.
- Define central database ownership and API response conventions.

Frontend scope:

- Establish Next.js renderer, Electron main/preload boundaries, shared UI, and
  local SQLite ownership.
- Define browser fallback as limited/non-local-first mode.

Exit criteria:

- `.agents/` and numbered `docs/` sources exist.
- Monorepo structure and runtime boundaries are documented.
- Local-first, permission, sync, and performance rules are explicit.

## Phase/Stage 1 - Runtime Foundation and Developer Workflow

Status: Completed for MVP; runtime smoke remains repeatable-release work.

PRD mapping:

- Tech stack, runtime configuration, infrastructure, and deployment baseline.

Backend scope:

- Backend bootstrap, environment validation, Prisma client, Redis/BullMQ, health
  endpoint, migration, and seed workflow.

Frontend scope:

- Desktop app bootstrap, static renderer build, Electron preload, app shell,
  API base URL configuration, and local schema initialization.

Exit criteria:

- Backend and desktop typecheck, lint, and build pass.
- PostgreSQL and Redis can start from project configuration.
- Migration and seed commands work.
- No production secret is committed.

## Phase/Stage 2 - Authentication, Session, and Access Scope

Status: Implemented and hardened; Electron runtime smoke pending.

PRD mapping:

- Authentication and Access.
- Login and Role Routing user flow.

Backend scope:

- `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`,
  `GET /auth/me`.
- Validate login/device input.
- Issue short-lived signed access tokens.
- Persist opaque rotating refresh sessions as secret-derived hashes.
- Enforce replay protection, expiry, revocation, role, and branch context.
- Test malformed/tampered/expired access tokens and refresh rotation races.

Frontend scope:

- Login form and backend session mapping.
- Session restore, deduplicated refresh/retry, and logout.
- Store Electron token pairs through `safeStorage` and narrow IPC.
- Use memory-only token fallback outside secure Electron persistence.
- Route/navigation visibility follows the authenticated role.

Exit criteria:

- Valid login returns user, role, branch, access token, and refresh token.
- Invalid/replayed/revoked sessions are rejected.
- Concurrent `401` responses trigger one refresh operation.
- Electron restart restores a valid encrypted session.
- Logout clears local credentials and revokes the refresh session.
- Backend auth tests and desktop typecheck/lint/build pass.

## Phase/Stage 3 - Master Data and Branch Context

Status: Read access hardened; POS product/price and register context integrated;
HQ management UI pending.

PRD mapping:

- Master data portions of Authentication, POS, Inventory, and branch operation.
- HQ Admin Master Data flow.

Backend scope:

- Users, roles, branches, registers, categories, products, and branch prices.
- Validate active records, branch ownership, and explicit query shape.
- Add write contracts only when accepted by product scope.

Frontend scope:

- Load products and branch prices through Omnia backend APIs.
- Resolve active branch/register context.
- Add HQ master-data workspace only for accepted CRUD scope.
- Provide loading, empty, validation, and permission states.

Exit criteria:

- POS catalog uses backend product and branch-price data when online.
- Branch/register context is unambiguous.
- HQ master-data UI, when implemented, never relies on client-side role checks
  as its security boundary.
- Growing lists are searchable, filtered, or paginated.

## Phase/Stage 4 - Shift Operations

Status: Implemented and transition-hardened; runtime Electron smoke pending.

PRD mapping:

- Shift Operation.
- Cashier Shift user flow.

Backend scope:

- Accept idempotent `shift.opened` and `shift.closed` sync events.
- Persist shift state, sync jobs/logs, and audit context.
- Enforce branch scope and valid transition behavior.

Frontend scope:

- Open and close shift through Electron local store.
- Persist opening/closing cash and active shift identity.
- Queue sync envelopes with actual online/offline source mode.
- Prevent checkout without an active shift.

Exit criteria:

- Shift can open and close while central backend is unavailable.
- Shift events persist in SQLite and replay safely.
- Invalid close/no-active-shift actions are rejected.
- Duplicate replay does not create duplicate central shifts.

## Phase/Stage 5 - POS Checkout, Payment, and Receipt

Status: Implemented and validation-hardened; physical printing and direct
Electron UI smoke remain pending.

PRD mapping:

- POS Local-First.
- Cashier POS Checkout user flow.

Backend scope:

- Accept and validate `transaction.bundle`.
- Atomically persist transaction, items, payments, stock movements, sync logs,
  and audit records.
- Enforce totals, payment sufficiency, stock-movement direction, branch scope,
  actor consistency, non-negative central stock, and idempotency.

Frontend scope:

- Product search/catalog, stock-bounded cart, totals, and manual payment.
- Save transaction, items, payment, stock movements, and sync queue atomically
  through Electron main process.
- Recompute checkout totals and authoritative local stock in Electron main
  process instead of trusting renderer totals.
- Display local receipt history and receipt preview.
- Keep checkout independent from dashboard, Shopee, AI, and central uptime.

Exit criteria:

- Paid checkout requires sufficient amount received.
- Quantity cannot exceed local stock.
- Successful checkout writes all required local records in one transaction.
- Offline checkout creates a replayable bundle.
- Receipt preview works from local data.
- Receipt retains amount received and calculated change.
- Duplicate central replay is controlled and non-duplicating.

## Phase/Stage 6 - Inventory Balance and Stock Movement

Status: Local and central ledger validation hardened; central inventory UI and
direct Electron UI smoke pending.

PRD mapping:

- Inventory.
- Supervisor Inventory Adjustment user flow.

Backend scope:

- `GET /inventory/balances`.
- `GET /inventory/movements` and compatibility alias.
- Apply idempotent `stock_movement.created`.
- Enforce branch scope, non-negative stock, before/after consistency, and
  ledger-based inventory mutation.

Frontend scope:

- Display local inventory balances and movements.
- Save local stock adjustments with reason, notes, actor, and before/after
  quantity.
- Reject stock reductions that would make local balance negative.
- Queue replayable stock movement events.
- Add central balance/movement views for supervisor/HQ when accepted.

Exit criteria:

- Inventory adjustment writes a stock movement and updates local balance.
- Negative stock is prevented according to current MVP rules.
- Central reads require authentication and correct branch scope.
- Local and central views clearly identify their data source/freshness.

## Phase/Stage 7 - Sync Replay, Recovery, and Monitoring

Status: Local replay reliability hardened; central jobs/logs/branch-health UI
pending.

PRD mapping:

- Sync.
- Sync Recovery user flow.
- Audit and Monitoring.

Backend scope:

- Receive transaction bundles, shift events, and stock movement events.
- Enforce idempotency before business writes.
- Persist sync job, log, acknowledgement, failure, and conflict information.
- Expose `/sync/jobs`, `/sync/logs`, and branch sync health.

Frontend scope:

- Display bounded local queue and per-event status.
- Replay due pending/failed events in small batches with retry backoff.
- Surface attempts, next retry, errors, conflicts, and acknowledgements.
- Add central jobs/logs/branch-health workspace for supervisor/HQ.

Exit criteria:

- Replay handles pending, failed, synced, duplicate, and conflict outcomes.
- Critical operational events are not silently dropped.
- Replay failure leaves actionable local error metadata.
- Failed events are not retried in a tight loop.
- Central monitoring is branch-scoped and bounded.
- Checkout remains available while monitoring APIs are unavailable.

## Phase/Stage 8 - Dashboard, Reports, and Audit

Status: Dashboard, audit, and bounded CSV export integrated; dedicated report
surfaces remain optional.

PRD mapping:

- Dashboard and Reporting.
- Audit and Monitoring.
- Dashboard user flow.

Backend scope:

- Branch and central dashboard queries.
- Sales summary, inventory alerts, and bounded CSV export.
- Audit log query with role and branch restrictions.
- Validate timezone-aware date windows and bounded result size.

Frontend scope:

- Role-aware branch/central dashboard.
- Date and branch filters.
- Loading, empty, forbidden, and backend-unavailable states.
- Audit workspace and CSV download with truncation warning.
- Add dedicated report/inventory-alert views only when dashboard aggregation is
  insufficient.

Exit criteria:

- Dashboard reads central data only.
- Cashier cannot access restricted central data.
- Date filters reject invalid/reversed ranges before expensive queries.
- Export reports truncation and protects spreadsheet consumers.
- Dashboard failure does not affect local POS.

## Phase/Stage 9 - Shopee Integration

Status: Implemented for mock/sandbox-ready MVP; real credentials pending.

PRD mapping:

- Shopee Integration.
- Shopee Integration user flow.

Backend scope:

- Store registration, SKU mapping, order import/detail, webhook ingestion,
  integration health, and retry.
- Protect duplicate webhook/order processing.
- Persist integration jobs/logs and audit-relevant actions.

Frontend scope:

- HQ store, mapping, order, detail, health, and retry workspace.
- Gate protected queries until authenticated HQ access exists.
- Provide mapping errors, empty states, loading, and retry feedback.
- Do not expose a UI for backend-to-backend webhook ingestion.

Exit criteria:

- Duplicate webhook does not duplicate internal orders.
- Mapping and retry operations are authenticated and auditable.
- Frontend calls only Omnia backend endpoints.
- Real sandbox credential validation is completed or explicitly deferred.

## Phase/Stage 10 - AI Insights

Status: Implemented as advisory MVP.

PRD mapping:

- AI Insights.
- AI Insights user flow.

Backend scope:

- General insights, low-stock insights, and stockout predictions.
- Return severity, confidence, reference data, and insufficient-data outcomes.
- Keep AI advisory-only.

Frontend scope:

- HQ/Executive AI workspace with filters and separate insight categories.
- Display severity, confidence, references, loading, empty, and error states.
- Never perform inventory, pricing, or order mutations from an insight.

Exit criteria:

- AI output is traceable to reference data.
- Insufficient data is represented without fabricated confidence.
- Unauthorized roles are rejected by backend.
- AI failure cannot block POS or sync.

## Phase/Stage 11 - Deployment, Desktop Packaging, and Operational Hardening

Status: Build path implemented; packaged target-machine validation pending.

PRD mapping:

- Non-functional requirements and desktop runtime flow.

Backend scope:

- Docker/deploy configuration, environment validation, health checks, migration,
  seed, Redis/PostgreSQL connectivity, CORS, and rollback notes.

Frontend scope:

- Static exported renderer loaded by Electron without `next dev`.
- Secure BrowserWindow/preload configuration.
- Writable `userData` paths for SQLite and encrypted auth session.
- Package renderer, preload, schema, and SQLite runtime dependency.

Exit criteria:

- Backend starts from deploy configuration and health check passes.
- Production Electron opens the renderer.
- Packaged app initializes SQLite and secure session storage.
- Offline checkout, shift, inventory, receipt, and replay work in packaged app.
- Required runtime dependencies are included, not assumed from developer PATH.

## Phase/Stage 12 - Final MVP Acceptance and Handoff

Status: Pending full runtime/UAT acceptance.

PRD mapping:

- Product goals, core flows, and all non-functional requirements.

Execution:

- Run typecheck, lint, build, backend unit tests, migration, and seed.
- Run API smoke with PostgreSQL and Redis active.
- Run Electron login, refresh, logout, restart persistence, and role routing.
- Run shift, offline checkout, receipt, inventory adjustment, reconnect, and
  sync replay.
- Verify branch scope, forbidden roles, duplicate sync, Shopee duplicate, and AI
  insufficient-data behavior.
- Run packaged Electron smoke on the target operating system.
- Record UAT findings, known risks, deferred scope, and recovery notes.

Exit criteria:

- `pnpm typecheck`, `pnpm lint`, and `pnpm build` pass.
- Backend tests and `pnpm smoke:mvp` pass or have documented root causes.
- Core local-first flow works without central connectivity.
- Reconnect/replay does not duplicate business data.
- Auth/session and permission behavior pass runtime checks.
- Packaged desktop readiness criteria pass.
- `.agents/sessionHandoff.md` accurately records remaining risk and next action.

## Recommended Continuation

Do not restart from Phase 0. Review current status and continue from the first
unmet exit criterion:

1. Complete Phase 2 Electron auth runtime smoke.
2. Complete Phase 7 central sync monitoring UI if accepted for MVP/UAT.
3. Complete Phase 6 central inventory UI if operationally required.
4. Complete Phase 3 HQ master-data UI only for accepted CRUD scope.
5. Execute Phase 11 packaged desktop validation.
6. Close with Phase 12 runtime acceptance and UAT.
