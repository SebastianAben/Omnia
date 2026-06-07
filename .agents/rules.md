# Agent Rules

## 1. Source of Truth Order

When implementing or reviewing code, follow this order:

1. `.agents/PRD.md`
2. `docs/01-index.md`
3. Specific numbered document in `docs/`
4. `docs/13-engineering-knowledge.md` for modularity/performance/code-quality decisions
5. Existing code patterns
6. Test/smoke results

Do not invent behavior that contradicts the PRD or numbered docs.

## 2. Required Reading per Task

- Product/scope changes: read `.agents/PRD.md`, `docs/02-product-scope.md`.
- User flow changes: read `docs/03-user-flows.md`.
- Backend/API changes: read `docs/06-api-contract.md`, `docs/05-data-model.md`.
- Sync/local-first changes: read `docs/07-sync-specification.md`.
- Frontend/UI changes: read `docs/09-ui-design-guide.md`.
- Infrastructure/deployment changes: read `docs/04-system-architecture.md`, `docs/08-technical-stack.md`.
- Modularization, performance, refactor, or clean-code changes: read `docs/13-engineering-knowledge.md` and `.agents/engineeringKnowledge.md`.
- Desktop wrapper, SQLite local store, Electron, or app packaging changes: read `docs/14-desktop-wrapper-readiness.md`.
- Planning/status changes: read `docs/10-implementation-roadmap.md`, `.agents/sessionHandoff.md`.

## 3. Coding Rules

- Preserve POS local-first behavior.
- Treat POS branch runtime as Electron desktop app; plain browser mode is limited/fallback.
- Do not make checkout depend on dashboard, Shopee, AI, or central connectivity.
- Prefer existing project patterns before adding abstractions.
- Keep code modular by business domain and avoid shared abstractions until duplication or complexity justifies them.
- Treat performance as an engineering requirement: bound queries, avoid N+1 access, avoid heavy renders, and keep critical paths short.
- Use TypeScript types and shared contracts where available.
- Backend permission must be enforced server-side.
- UI role filtering is not a security boundary.
- Sync writes must be idempotent.
- All operational mutations should be auditable when relevant.
- Runtime values must come from env/config, not hardcoded production values.
- Do not commit secrets or local generated database files.
- Do not access SQLite or Node APIs directly from the Next.js renderer; use the Electron preload/IPC bridge.

## 4. Backend Rules

- Keep NestJS modules domain-oriented.
- Validate input DTOs.
- Keep Prisma queries scoped and explicit.
- Use transactions for multi-entity writes when consistency matters.
- For sync and webhook flows, check duplicate/idempotency before creating new central data.
- Write sync logs/audit logs for relevant processing results.

## 5. Frontend Rules

- POS screens must stay fast and focused.
- POS local-first features must work in Electron desktop runtime.
- Avoid decorative UI that slows operational workflows.
- Use role-based navigation only as UX.
- Use TanStack Query for server state.
- Use Zustand/local state for UI/cart/session-like state.
- Keep text and UI responsive and readable.
- Avoid introducing a landing page for operational screens.

## 6. Database Rules

- Use Prisma migration for central DB schema changes.
- Keep local SQLite schema aligned with local-first requirements.
- Ensure local DB path and schema are compatible with packaged desktop runtime.
- Inventory changes should be represented as stock movement records.
- Do not directly mutate central inventory without clear ledger/audit reason.

## 7. Testing Rules

Every implementation must state what was validated.

Preferred validation:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm smoke:mvp`

For scoped work, run the smallest relevant validation and document any test not run.

## 8. Documentation Rules

At the end of every coding/planning session, update `.agents/sessionHandoff.md`.

Update it with:

- date/time if relevant
- summary
- files/modules changed
- validation run
- blockers
- risks
- next recommended step

If a change affects product, API, data, sync, stack, UI, or roadmap behavior, update the corresponding numbered doc in `docs/`.

If a change introduces a reusable engineering pattern, performance workaround, or refactor decision, update `docs/13-engineering-knowledge.md`.

## 9. Session Completion Rule

A session is incomplete until:

1. implementation or analysis request is handled
2. validation status is known
3. `.agents/sessionHandoff.md` is updated
4. final response summarizes changed files and remaining risks
