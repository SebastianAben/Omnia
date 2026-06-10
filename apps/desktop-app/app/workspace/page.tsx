import { AppShell } from "@/components/app-shell";
import { DashboardWorkspace } from "@/features/dashboard/dashboard-workspace";

export default function WorkspacePage() {
  return (
    <AppShell>
      <DashboardWorkspace />
    </AppShell>
  );
}
