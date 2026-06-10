# Agent Engineering Knowledge

Gunakan file ini sebagai checklist cepat saat membuat atau mereview kode. Detail lengkap ada di `docs/13-engineering-knowledge.md`.

## Mandatory Engineering Rule

Every implementation must optimize for:

1. modularity
2. clean code
3. efficient data access
4. safe local-first POS behavior
5. measurable validation

Do not add abstractions for style only. Add abstraction when it removes duplication, clarifies boundaries, or improves testability/performance.

## Backend Checklist

- Controller is thin.
- Service owns business logic.
- DTO/input validation exists.
- Permission/branch scope is enforced.
- Prisma query uses `select`, filter, pagination, or explicit include where needed.
- Multi-table write uses transaction when consistency matters.
- Sync/webhook flow checks idempotency.
- Audit/sync logs are written for operationally important actions.

## Frontend Checklist

- Route page stays thin.
- Feature code lives under `features/<domain>`.
- API calls are in feature service.
- Server state uses TanStack Query.
- UI/local/cart state uses Zustand or component state.
- POS path does not depend on dashboard/LLM insights.
- Shopee is out of active scope; remove or quarantine legacy marketplace code before building new marketplace behavior.
- LLM integrations require server-side key handling, bounded context, structured output validation, prompt/version metadata, cache/TTL, and non-blocking failure states.
- Local-first POS features call Electron bridge, not browser-only or direct Node/SQLite access.
- Large lists are filtered, paginated, or otherwise bounded.
- Loading/error/empty states exist.
- Close shift reconciliation must compare expected cash against cashier-entered
  closing cash and show total sales, cash, non-cash, and variance before close.
- High-volume POS UX must remain search/scan and keyboard friendly without
  weakening stock-bounded cart behavior.
- Stock notifications must be in-app and non-blocking unless a later product
  decision adds push infrastructure.
- Dashboard "real time" claims must distinguish query/polling refresh from true
  streaming updates.

## API Checklist

- Endpoint follows domain/resource naming.
- Response envelope is consistent.
- Error has stable code and useful message.
- Read endpoint has filters/limits where data can grow.
- Write endpoint validates input and authorization.
- Dashboard/report endpoints are read-only.

## Database Checklist

- Schema change has migration.
- Query path has reasonable index support.
- Inventory mutation writes stock movement.
- Duplicate/idempotency key is protected.
- Avoid N+1 query.
- Use raw SQL only when Prisma is insufficient and input is safe.

## Desktop Wrapper Checklist

- Feature works in Electron, not only `next dev` browser.
- Renderer uses `window.omniaDesktop` bridge for local store.
- Preload exposes the smallest API needed.
- Main process owns SQLite/file system work.
- Packaged app includes renderer output, preload, local schema, and SQLite dependency.
- Browser fallback message is clear when local store bridge is missing.

## Performance Decision Rule

When performance is not good enough:

1. Measure or identify the bottleneck.
2. Reduce payload/query/render work.
3. Add index/pagination/cache only where justified.
4. Document the reason in code comment or session handoff.
5. Update `docs/13-engineering-knowledge.md` if the pattern becomes reusable.

## Completion Claim Rule

Do not mark a feature complete only because code exists. A feature is complete
only after the relevant runtime smoke or UAT path has passed, or after the gap is
explicitly recorded as a next implementation phase in
`.agents/sessionImplementation.md`.
