import { AppShell } from "@/components/app-shell";
import { PosWorkspace } from "@/features/pos/pos-workspace";

export default function PosPage() {
  return (
    <AppShell>
      <PosWorkspace />
    </AppShell>
  );
}
