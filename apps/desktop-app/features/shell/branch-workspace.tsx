"use client";

import { Badge } from "@omnia/ui";
import {
  Clock,
  PackageSearch,
  ReceiptText,
  RefreshCcw,
  type LucideIcon,
} from "lucide-react";

import { WorkspacePanel } from "@/components/app-shell";
import { listLocalTransactions } from "@/features/local-first/local-checkout-repository";
import { useAppState } from "@/lib/app-state";
import { formatRupiah } from "@/features/pos/pos-utils";

export function BranchWorkspace() {
  const branch = useAppState((state) => state.branch);
  const shiftStatus = useAppState((state) => state.shiftStatus);
  const pendingSyncCount = useAppState((state) => state.pendingSyncCount);
  const transactions = listLocalTransactions();
  const salesToday = transactions.reduce(
    (total, transaction) => total + transaction.totals.grandTotal,
    0,
  );

  return (
    <WorkspacePanel
      badge="Role shell"
      description="Branch operations home for Sprint 3 cashier and supervisor flows."
      title={`${branch.name} Workspace`}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Metric
          icon={ReceiptText}
          label="Local sales"
          value={formatRupiah(salesToday)}
        />
        <Metric
          icon={RefreshCcw}
          label="Pending sync"
          value={String(pendingSyncCount)}
        />
        <Metric icon={Clock} label="Shift" value={shiftStatus} />
        <Metric icon={PackageSearch} label="Low stock watch" value="2 SKUs" />
      </div>
      <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-950">
              Sprint 3 boundary
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Checkout writes local transaction, payment, stock movement, and
              sync queue records before any central replay.
            </div>
          </div>
          <Badge tone="success">Local-first</Badge>
        </div>
      </div>
    </WorkspacePanel>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon size={16} aria-hidden="true" />
        {label}
      </div>
      <div className="mt-3 text-xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}
