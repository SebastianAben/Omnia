import { AppShell } from "@/components/app-shell";
import { BranchWorkspace } from "@/features/shell/branch-workspace";

export default function WorkspacePage() {
  return (
    <AppShell>
      <BranchWorkspace />
    </AppShell>
  );
}
