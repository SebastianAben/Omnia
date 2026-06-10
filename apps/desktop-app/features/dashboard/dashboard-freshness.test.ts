import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDashboardFreshness,
  formatFreshnessTimestamp,
  type FreshnessSyncHealth,
} from "./dashboard-freshness";

const syncRow = (
  input: Partial<FreshnessSyncHealth> = {},
): FreshnessSyncHealth => ({
  last_successful_sync_at: Object.hasOwn(input, "last_successful_sync_at")
    ? (input.last_successful_sync_at ?? null)
    : "2026-06-10T04:00:00.000Z",
  health_status: input.health_status ?? "healthy",
});

test("buildDashboardFreshness maps a single branch sync timestamp to a known state", () => {
  const result = buildDashboardFreshness({
    lastRefreshedAt: "2026-06-10T04:05:00.000Z",
    syncHealth: syncRow(),
  });

  assert.equal(result.lastRefreshedAt, "2026-06-10T04:05:00.000Z");
  assert.equal(result.lastSyncedAt, "2026-06-10T04:00:00.000Z");
  assert.equal(result.syncState, "fresh");
});

test("buildDashboardFreshness treats missing sync timestamps as unknown", () => {
  const result = buildDashboardFreshness({
    lastRefreshedAt: "2026-06-10T04:05:00.000Z",
    syncHealth: syncRow({ last_successful_sync_at: null }),
  });

  assert.equal(result.lastSyncedAt, null);
  assert.equal(result.syncState, "unknown");
});

test("buildDashboardFreshness aggregates central sync rows conservatively", () => {
  const result = buildDashboardFreshness({
    lastRefreshedAt: "2026-06-10T04:05:00.000Z",
    syncHealth: [
      syncRow({ last_successful_sync_at: "2026-06-10T04:00:00.000Z" }),
      syncRow({
        last_successful_sync_at: "2026-06-10T03:30:00.000Z",
        health_status: "attention_required",
      }),
    ],
  });

  assert.equal(result.lastSyncedAt, "2026-06-10T03:30:00.000Z");
  assert.equal(result.syncState, "stale");
});

test("formatFreshnessTimestamp safely formats valid and missing timestamps", () => {
  assert.match(
    formatFreshnessTimestamp("2026-06-10T04:05:00.000Z"),
    /10\/06\/2026|6\/10\/2026|2026/,
  );
  assert.equal(formatFreshnessTimestamp(null), "Unknown");
});
