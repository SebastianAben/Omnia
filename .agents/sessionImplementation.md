# Session Implementation Plan

This file defines the recommended execution phases for Omnia. Each phase has clear exit criteria.

## Phase 0: Orientation and Setup

Goal: ensure agent understands current project state before coding.

Tasks:

- Read `.agents/PRD.md`.
- Read `.agents/sessionHandoff.md`.
- Read `.agents/engineeringKnowledge.md` for coding/modularity expectations.
- Read relevant `docs/` file for the task.
- Inspect current code before editing.
- Check `git status --short`.

Exit criteria:

- Scope is clear.
- Relevant modules/files are identified.
- No unrelated user changes are overwritten.
- Engineering standard from `docs/13-engineering-knowledge.md` is understood for the task.

## Phase 1: Backend Foundation and Hardening

Goal: stabilize backend API, auth, data model, and permission boundaries.

Tasks:

- Review NestJS modules.
- Harden auth/token handling.
- Add/verify role and branch guards.
- Keep Prisma schema and migrations consistent.
- Ensure API response contracts match docs.
- Add backend tests for sensitive paths.
- Keep services/controllers modular and query paths bounded.

Exit criteria:

- `pnpm --filter @omnia/backend-api typecheck` passes.
- Backend lint passes or known issues are documented.
- Relevant API smoke/integration validation is run.
- Permission behavior is documented.
- Any reusable backend/performance pattern is documented.

## Phase 2: Sync and Local-First Backend

Goal: ensure sync is idempotent, auditable, and safe for offline replay.

Tasks:

- Validate `transaction.bundle` behavior.
- Validate `shift.opened`, `shift.closed`, and `stock_movement.created`.
- Check duplicate event/bundle handling.
- Check sync jobs/logs/audit logs.
- Add tests for replay and duplicate handling.

Exit criteria:

- Duplicate sync does not create duplicate business data.
- Failed sync writes useful logs.
- Transaction, shift, and stock movement sync paths are validated.

## Phase 3: Frontend POS and Local Store

Goal: keep POS workflow reliable and local-first.

Tasks:

- Validate POS cart and checkout.
- Validate SQLite local writes.
- Validate receipt preview.
- Validate shift open/close.
- Validate local inventory adjustment.
- Ensure UI remains role-aware and operational.
- Keep feature modules isolated and avoid heavy renders in POS paths.

Exit criteria:

- Checkout works without requiring dashboard/Shopee/AI.
- Local transaction data is written.
- Sync queue entry is created.
- Desktop typecheck/lint passes or issues are documented.
- Any reusable frontend/performance pattern is documented.

## Phase 4: Frontend Integration

Goal: wire UI to backend and central data flows safely.

Tasks:

- Integrate dashboard APIs.
- Integrate sync status APIs.
- Integrate Shopee management views.
- Integrate AI insights.
- Enforce role-based navigation.

Exit criteria:

- UI fetches expected API data.
- Forbidden role behavior is respected by backend.
- Loading/error/empty states are handled.

## Phase 5: Final Test and Release Candidate

Goal: validate MVP end-to-end.

Tasks:

- Run typecheck.
- Run lint.
- Run build.
- Run smoke MVP with PostgreSQL and Redis active.
- Verify seed data.
- Verify migration status.
- Review known gaps.

Exit criteria:

- `pnpm typecheck` passes.
- `pnpm lint` passes.
- `pnpm build` passes.
- `pnpm smoke:mvp` passes or failure is documented with root cause.
- `.agents/sessionHandoff.md` is updated.

## Phase 6: Deployment and Desktop Packaging

Goal: prepare deployable backend, desktop wrapper, and operational runbook.

Tasks:

- Verify Dockerfile and compose.
- Verify required env variables.
- Verify database migration command.
- Verify Redis/PostgreSQL connectivity.
- Verify CORS and public API URL.
- Check GitHub Actions deploy workflow.
- Verify Electron production package strategy from `docs/14-desktop-wrapper-readiness.md`.
- Verify packaged desktop app can run without `next dev`.
- Verify SQLite dependency/binary and local schema are included in package.

Exit criteria:

- Required env values are listed.
- Deploy target can start backend.
- Health endpoint passes.
- Migration/seed strategy is documented.
- Desktop wrapper can open UI, init SQLite, checkout locally, and replay sync.
- Rollback or recovery notes exist.

## Phase 7: Post-MVP

Goal: expand only after MVP UAT feedback is clear.

Candidate work:

- Reporting export.
- Replenishment recommendation.
- Marketplace expansion.
- Conflict resolver UI.
- Payment gateway discovery.
- Return/refund flow.
- Performance measurement.

Exit criteria:

- UAT findings are triaged.
- Scope is accepted before implementation.
- POS local-first remains protected.
