# Omnia Session Implementation

## Document Contract

| Field             | Value                                                   |
| ----------------- | ------------------------------------------------------- |
| Status            | Canonical implementation roadmap                        |
| Source of truth   | `.agents/PRD.md`                                        |
| Supporting status | `.agents/sessionHandoff.md`, `docs/12-actual-status.md` |
| Purpose           | Function-by-function backend and frontend delivery plan |

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
- Keep checkout independent from dashboard, LLM insights, and central uptime.

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

## Phase/Stage 9 - Remove Shopee Integration

Status: Implemented for active surfaces; legacy marketplace schema remains inert pending data-retention cleanup decision.

PRD mapping:

- Removed/deprecated marketplace integration scope.
- Product scope now excludes Shopee from MVP and active product behavior.

Backend scope:

- Keep Shopee controllers, webhook endpoints, monitoring endpoints, services,
  DTOs, env requirements, seed/demo data, smoke checks, and API docs removed or
  deprecated from active scope.
- Decide whether legacy marketplace tables remain as inert historical schema or
  receive a follow-up migration after data-retention needs are confirmed.
- Ensure removing Shopee does not affect auth, POS, inventory, sync, dashboard,
  reports, audit, or LLM insight generation.

Frontend scope:

- Remove Shopee navigation, routes, services, query hooks, UI workspace, and
  status/smoke references.
- Remove user-facing copy that presents Omnia as Shopee/marketplace integrated.
- Keep layout and role routing stable after menu removal.

Exit criteria:

- No active Shopee route is exposed in desktop navigation.
- No active Shopee endpoint is documented as MVP API.
- Smoke scripts and README no longer require Shopee configuration.
- Typecheck, lint, build, and relevant backend tests pass after removal.

## Phase/Stage 10 - LLM Insights

Status: Implemented for MVP; live provider validation and runtime/UAT acceptance pending.

PRD mapping:

- LLM-powered operational insights.
- LLM Insights user flow.

Backend scope:

- Maintain server-side LLM provider configuration and API key validation; credentials
  must never reach the renderer or local SQLite.
- Generate insights from bounded central DB context using explicit prompt
  versions and structured output schemas.
- Validate LLM output before persistence; reject malformed, unsafe, or
  unsupported action-like output.
- Persist severity, confidence, recommendation, reference data, provider/model
  metadata, prompt version, generation job status, errors, and timestamps.
- Maintain caching/TTL, cooldown reuse, and retry/rate-limit behavior so dashboard/POS paths are not
  blocked by provider latency or failure.
- Keep LLM advisory-only; it cannot mutate inventory, price, order, payment,
  sync, master data, or auth state.
- Add tests for missing API key, provider failure, malformed output,
  insufficient data, unauthorized roles, and advisory-only constraints.

Frontend scope:

- Rename/align AI surfaces as LLM Insights where appropriate.
- Show generation status, stale/cache state, provider failure, insufficient-data
  state, severity, confidence, references, and recommendation text.
- Provide explicit manual refresh/generate action for authorized roles.
- Never expose provider API keys or prompt internals in the renderer.
- Never provide one-click operational mutation from an insight.

Exit criteria:

- LLM output is traceable to reference data and provider/prompt metadata.
- Role-based wording is generated once per batch and selected server-side for
  Executive versus HQ Admin views.
- Insufficient data is represented without fabricated certainty.
- Unauthorized roles are rejected by backend.
- Missing/invalid API key and provider failures are clear, non-fatal states.
- LLM failure cannot block POS, shift, inventory, sync, dashboard, or reporting.

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
- Verify branch scope, forbidden roles, duplicate sync, LLM missing-key/provider
  failure, malformed-output rejection, and insufficient-data behavior.
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

## Next Implementation Phases

These phases track incomplete or partial features discovered from the latest
feature-completeness review. They intentionally exclude marketplace/Shopee work.

## Phase/Stage 13 - Close Shift Auto Reconciliation

Status: Implemented for MVP; direct Electron runtime smoke and UAT acceptance
pending.

Goal:

- Complete Auto Reconciliation for cashier shift closing.

Implementation plan:

- Compute shift-scoped totals from local transactions before close:
  total sales, total cash payments, total non-cash payments, expected cash,
  cashier-entered closing cash, and variance.
- Show a close-shift preview before confirmation.
- Keep cashier close flow available, but make variance clearly visible before
  saving the close event.
- Persist reconciliation summary in the local shift record and `shift.closed`
  sync payload metadata without destructive central migration.
- Preserve existing opening/closing cash validation, active shift guard, and
  sync queue behavior.

Exit criteria:

- Cashier can see total sales, cash, non-cash, expected cash, closing cash, and
  variance before closing shift.
- Closing a shift records the reconciliation summary locally.
- Variance does not silently pass; it is visible in the UI and replay payload.
- Checkout remains independent from dashboard, LLM, and central connectivity.

## Phase/Stage 14 - High-Volume POS Transaction UX

Status: Implemented for MVP; direct Electron runtime smoke and UAT acceptance
pending.

Goal:

- Make repeated/many-product checkout faster and easier without weakening stock
  and payment guards.

Implementation plan:

- Optimize search/scan product flow for SKU, barcode, and product-name entry.
- Add keyboard-friendly add-to-cart, quantity adjustment, payment, and checkout
  paths.
- Keep product rendering bounded and responsive for larger catalogs.
- Preserve stock-bounded cart behavior and no-out-of-stock add behavior at UI,
  cart store, Electron main, and backend/sync layers.
- Keep POS flow focused; do not add dashboard, LLM, or decorative UI work to
  the checkout critical path.

Exit criteria:

- Cashier can complete many-product transactions with fewer pointer interactions.
- Out-of-stock products still cannot enter the cart.
- Quantity cannot exceed available local stock.
- POS remains responsive with realistic catalog size.

## Phase/Stage 15 - Smart Stock Notifications

Status: Implemented for MVP; direct Electron runtime smoke and UAT acceptance
pending.

Goal:

- Complete the notification part of smart stock management.

Implementation plan:

- Add in-app low-stock and out-of-stock notifications from local/central
  inventory data.
- Use existing inventory thresholds and stock movement state.
- Do not add external push notification infrastructure in this phase.
- Keep notifications non-blocking; they must not prevent checkout, shift close,
  inventory adjustment, sync replay, or LLM insight reading.

Exit criteria:

- Users can see actionable low-stock/out-of-stock warnings in relevant
  operational screens.
- Notifications identify product, branch/source, quantity on hand, and threshold.
- Notification failure does not block POS or inventory mutation flows.

## Phase/Stage 16 - Dashboard Freshness and Prediction Validation

Status: Implemented for MVP; live Gemini validation with a real key, direct
runtime smoke, and UAT acceptance pending.

Goal:

- Clarify and harden Dashboard Real Time and Prediction behavior.

Implementation plan:

- Document and implement dashboard semantics as query/refresh-based freshness,
  not websocket/streaming realtime.
- Add freshness indicators such as last synced, last refreshed, and last LLM
  generation time where data is displayed.
- Validate live Gemini prediction/insight generation with a real `LLM_API_KEY`
  and representative central data.
- Keep predictions advisory-only and visible through LLM Insights; they must not
  mutate stock, price, order, payment, sync, or master data.

Exit criteria:

- Dashboard clearly shows when central data was refreshed or synced.
- Users are not misled into believing the dashboard is true streaming realtime.
- Live Gemini generation succeeds or returns a controlled provider/key/rate-limit
  state.
- Executive and HQ Admin role wording remains selected server-side.

## Phase/Stage 17 - UI/UX Consistency UAT Polish

Status: Implemented for MVP; direct runtime UAT acceptance pending.

Goal:

- Improve repetitive operational workflows after core runtime validation.

Implementation plan:

- Review POS, close shift, inventory adjustment, sync status, dashboard, and LLM
  insight flows through UAT.
- Normalize copy, spacing, empty/error/loading states, button hierarchy, and
  repeated controls.
- Prioritize speed and clarity over decorative changes.
- Keep the Figma/Stitch visual direction as the polish reference when available.

Exit criteria:

- UAT users can repeat cashier and supervisor workflows without confusing UI
  state changes.
- Common error states explain the action needed.
- UI polish does not weaken permission, local-first, stock, sync, or LLM safety
  boundaries.

## Recommended Continuation

Do not restart from Phase 0. Review current status and continue from the first
unmet exit criterion:

1. Run direct Electron runtime smoke for Phase 13 Close Shift Auto
   Reconciliation.
2. Complete Phase 2 Electron auth runtime smoke.
3. Run live Gemini validation and updated smoke for Phase 10 LLM Insights.
4. Execute Phase 11 packaged desktop validation.
5. Run direct Electron runtime smoke for Phase 14 High-Volume POS Transaction UX.
6. Run direct Electron runtime smoke for Phase 15 Smart Stock Notifications.
7. Run live Gemini/runtime validation for Phase 16 Dashboard Freshness and
   Prediction Validation.
8. Run Phase 17 UI/UX Consistency UAT Polish checklist.
9. Complete Phase 7 central sync monitoring UI if accepted for MVP/UAT.
10. Complete Phase 6 central inventory UI if operationally required.
11. Close with Phase 12 runtime acceptance and UAT.
