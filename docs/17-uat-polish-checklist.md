# Phase 17 UAT Polish Checklist

Phase 17 validates UI clarity and repeated operational workflows. It does not
change permission, checkout, sync, stock, or LLM safety contracts.

## Cashier

- Login restores the expected role, branch, register, and shift context.
- POS search/scan keeps focus ready for repeated entry.
- Cart quantity, discount, payment method, amount received, and checkout errors
  explain the next action.
- Checkout requires an open shift and sufficient received amount; POS no longer
  exposes a Pending payment option.
- Receipt preview shows local transaction, payment, received amount, change, and
  sync status.
- Sync Status explains pending, failed, conflict, and synced events.

## Supervisor

- Inventory shows out-of-stock and low-stock alerts with actionable copy.
- Stock adjustment prevents negative stock and reports the queued sync event.
- Shift close shows sales, cash, non-cash, expected cash, variance, and pending
  sync/unpaid-legacy warnings before closing when applicable.
- Branch dashboard states central-data freshness and does not imply streaming
  realtime.
- Audit states explain login, role restriction, loading, and backend failure.

## HQ Admin

- Central dashboard freshness band shows selected period, last refresh, and
  last successful sync state.
- Sync and audit views use consistent status labels and next-action copy.
- LLM Insights generation shows success, cache reuse, insufficient data,
  missing key, provider failure, invalid output, and unsafe output as controlled
  states.

## Executive / Analyst

- Central dashboard is read-only and uses query/refresh-based freshness wording.
- LLM Insights remain advisory-only and do not offer operational mutation
  actions.
- Empty, loading, and error states identify whether the next action is refresh,
  login/role review, backend check, or UAT handoff note.

## Known Runtime Items

- Direct Electron runtime smoke remains required for POS, shift, inventory,
  sync, and secure session behavior.
- Packaged desktop validation remains tracked separately from this polish phase.
- Live Gemini validation requires a real `LLM_API_KEY` in the target runtime.
