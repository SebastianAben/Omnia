import { AppShell } from "@/components/app-shell";
import { InventoryPanel } from "@/features/inventory/inventory-panel";

export default function InventoryPage() {
  return (
    <AppShell>
      <InventoryPanel />
    </AppShell>
  );
}
