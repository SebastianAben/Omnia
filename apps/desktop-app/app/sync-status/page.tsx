import { AppShell } from "@/components/app-shell";
import { SyncStatusPanel } from "@/features/sync/sync-status-panel";

export default function SyncStatusPage() {
  return (
    <AppShell>
      <SyncStatusPanel />
    </AppShell>
  );
}
