import { AppShell } from "@/components/app-shell";
import { ReceiptList } from "@/features/receipts/receipt-list";

export default function ReceiptsPage() {
  return (
    <AppShell>
      <ReceiptList />
    </AppShell>
  );
}
