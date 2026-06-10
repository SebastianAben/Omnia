export type FreshnessSyncHealth = {
  last_successful_sync_at: string | null;
  health_status: "healthy" | "pending" | "attention_required" | string;
};

export type DashboardFreshness = {
  lastRefreshedAt: string | null;
  lastSyncedAt: string | null;
  syncState: "fresh" | "stale" | "unknown";
};

export function buildDashboardFreshness(input: {
  lastRefreshedAt: string | null;
  syncHealth: FreshnessSyncHealth | FreshnessSyncHealth[] | undefined;
}): DashboardFreshness {
  const rows = Array.isArray(input.syncHealth)
    ? input.syncHealth
    : input.syncHealth
      ? [input.syncHealth]
      : [];
  const syncTimes = rows
    .map((row) => row.last_successful_sync_at)
    .filter((value): value is string => Boolean(value))
    .sort();

  if (rows.length === 0 || syncTimes.length !== rows.length) {
    return {
      lastRefreshedAt: input.lastRefreshedAt,
      lastSyncedAt: null,
      syncState: "unknown",
    };
  }

  const hasAttention = rows.some(
    (row) => row.health_status !== "healthy" && row.health_status !== "pending",
  );

  return {
    lastRefreshedAt: input.lastRefreshedAt,
    lastSyncedAt: syncTimes[0] ?? null,
    syncState: hasAttention ? "stale" : "fresh",
  };
}

export function formatFreshnessTimestamp(value: string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString("id-ID");
}
