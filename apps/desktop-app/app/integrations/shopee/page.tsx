import { AppShell } from "@/components/app-shell";
import { ShopeeWorkspace } from "@/features/shopee/shopee-workspace";

export default function ShopeeIntegrationPage() {
  return (
    <AppShell>
      <ShopeeWorkspace />
    </AppShell>
  );
}
