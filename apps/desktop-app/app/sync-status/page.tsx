import { Badge } from "@omnia/ui";
import { AppShell, PlaceholderPanel } from "@/components/app-shell";

const queues = [
  ["Transactions", "3 pending", "warning"],
  ["Inventory adjustments", "Synced", "success"],
  ["Product catalog", "Synced", "success"],
] as const;

export default function SyncStatusPage() {
  return (
    <AppShell>
      <PlaceholderPanel
        description="Local-first sync monitor placeholder for branch queues, conflict states, and central API reachability."
        title="Sync Status"
      >
        <div className="grid gap-3">
          {queues.map(([name, status, tone]) => (
            <div
              className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-4 py-3"
              key={name}
            >
              <div>
                <div className="text-sm font-medium text-slate-950">{name}</div>
                <div className="text-xs text-slate-500">
                  Local SQLite to central API queue
                </div>
              </div>
              <Badge tone={tone}>{status}</Badge>
            </div>
          ))}
        </div>
      </PlaceholderPanel>
    </AppShell>
  );
}
