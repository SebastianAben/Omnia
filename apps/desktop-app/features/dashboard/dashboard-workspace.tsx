"use client";

import { useMemo, useState } from "react";
import { Badge, Button, cn } from "@omnia/ui";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CreditCard,
  Download,
  RefreshCcw,
  ShieldCheck,
  Store,
} from "lucide-react";

import { WorkspacePanel } from "@/components/app-shell";
import {
  useAuditLogs,
  useDashboard,
  downloadSalesSummaryCsv,
  type DashboardData,
  type DashboardFilters,
  type DashboardScope,
  type ProductPerformance,
  type SyncHealth,
} from "@/features/dashboard/dashboard-service";
import { formatRupiah } from "@/features/pos/pos-utils";
import { roleLabels, useAppState } from "@/lib/app-state";

export function DashboardWorkspace() {
  const role = useAppState((state) => state.role);
  const branch = useAppState((state) => state.branch);
  const token = useAppState((state) => state.token);
  const [days, setDays] = useState("7");
  const [branchFilter, setBranchFilter] = useState("");
  const [exportState, setExportState] = useState<
    "idle" | "exporting" | "error" | "truncated"
  >("idle");
  const scope: DashboardScope =
    role === "supervisor" ? "branch" : role === "cashier" ? "branch" : "central";
  const filters = useMemo<DashboardFilters>(() => {
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - Number(days));

    return {
      branchId: scope === "branch" ? branch.id : branchFilter || undefined,
      from: from.toISOString(),
      to: to.toISOString(),
    };
  }, [branch.id, branchFilter, days, scope]);
  const dashboard = useDashboard(scope, filters, token);
  const canReadAudit = role !== "cashier";
  const audit = useAuditLogs(
    role === "supervisor" || role === "cashier" ? branch.id : branchFilter || undefined,
    token,
    canReadAudit,
  );

  if (!token) {
    return (
      <WorkspacePanel
        badge="Sign in required"
        description="Dashboard data is served from the central backend and requires an authenticated session."
        title="Operational Dashboard"
      >
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Login dulu supaya dashboard bisa membaca KPI pusat, audit log, dan
          sync health sesuai role.
        </div>
      </WorkspacePanel>
    );
  }

  return (
    <WorkspacePanel
      badge={roleLabels[role]}
      description={
        scope === "branch"
          ? "Branch dashboard from central synced data, scoped to active branch."
          : "Central dashboard for HQ and analyst review across branches."
      }
      title={scope === "branch" ? `${branch.name} Dashboard` : "Central Dashboard"}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SegmentedValue
          label="Period"
          onChange={setDays}
          options={[
            ["1", "Today"],
            ["7", "7 days"],
            ["30", "30 days"],
          ]}
          value={days}
        />
        {scope === "central" ? (
          <input
            className="h-9 w-64 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-500"
            onChange={(event) => setBranchFilter(event.target.value)}
            placeholder="Optional branch ID filter"
            value={branchFilter}
          />
        ) : null}
        <Button
          className="h-9"
          onClick={() => void dashboard.refetch()}
          type="button"
          variant="secondary"
        >
          <RefreshCcw size={15} />
          Refresh
        </Button>
        {role !== "cashier" ? (
          <Button
            className="h-9"
            disabled={exportState === "exporting"}
            onClick={() => {
              setExportState("exporting");
              void downloadSalesSummaryCsv(filters, token)
                .then((result) =>
                  setExportState(result.truncated ? "truncated" : "idle"),
                )
                .catch(() => setExportState("error"));
            }}
            type="button"
            variant="secondary"
          >
            <Download size={15} />
            {exportState === "exporting" ? "Exporting" : "Export CSV"}
          </Button>
        ) : null}
      </div>
      {exportState === "error" ? (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          Export failed. Check access, filters, or backend availability.
        </div>
      ) : null}
      {exportState === "truncated" ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Export reached the 1,000-row limit. Narrow the period or branch filter
          for a complete file.
        </div>
      ) : null}

      {dashboard.isLoading ? (
        <StatePanel label="Loading dashboard data..." />
      ) : dashboard.isError ? (
        <StatePanel label="Dashboard API is unavailable or access is denied." tone="danger" />
      ) : dashboard.data ? (
        <DashboardContent data={dashboard.data} />
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="Audit Trail" icon={ShieldCheck}>
          {!canReadAudit ? (
            <StatePanel label="Audit trail is restricted for the active role." />
          ) : audit.isLoading ? (
            <StatePanel label="Loading audit entries..." />
          ) : audit.isError ? (
            <StatePanel label="Audit API is unavailable or access is denied." tone="danger" />
          ) : audit.data?.length ? (
            <div className="divide-y divide-slate-200">
              {audit.data.slice(0, 8).map((log) => (
                <div className="grid gap-1 py-3" key={log.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-950">
                      {log.action}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(log.created_at).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    {log.entity_type}
                    {log.branch ? ` · ${log.branch.code}` : ""}
                    {log.user ? ` · ${log.user.full_name}` : ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <StatePanel label="No audit entries in the selected window." />
          )}
        </Panel>
        <Panel title="Sprint 4 Coverage" icon={BarChart3}>
          <div className="grid gap-2 text-sm text-slate-700">
            <Coverage label="Dashboard cabang/pusat" done />
            <Coverage label="Sales summary dan payment summary" done />
            <Coverage label="Inventory alerts" done />
            <Coverage label="Top/slow moving products" done />
            <Coverage label="Audit log browser" done />
            <Coverage label="Branch sync health" done />
          </div>
        </Panel>
      </div>
    </WorkspacePanel>
  );
}

function DashboardContent({ data }: { data: DashboardData }) {
  const syncRows = Array.isArray(data.sync_health)
    ? data.sync_health
    : [data.sync_health];

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={BarChart3}
          label="Net sales"
          value={formatRupiah(data.kpi.net_sales)}
        />
        <Metric
          icon={Store}
          label="Transactions"
          value={String(data.kpi.transaction_count)}
        />
        <Metric
          icon={CreditCard}
          label="Paid amount"
          value={formatRupiah(data.kpi.paid_amount)}
        />
        <Metric
          icon={AlertTriangle}
          label="Low stock"
          tone={data.kpi.low_stock_count > 0 ? "warning" : "neutral"}
          value={`${data.kpi.low_stock_count} SKUs`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="Top Selling Products" icon={Boxes}>
          <ProductRows products={data.top_selling_products} />
        </Panel>
        <Panel title="Payment Methods" icon={CreditCard}>
          <div className="space-y-2">
            {data.payment_method_summary.map((item) => (
              <div
                className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2"
                key={item.payment_method_code}
              >
                <span className="text-sm font-medium uppercase text-slate-700">
                  {item.payment_method_code}
                </span>
                <span className="text-sm text-slate-950">
                  {formatRupiah(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Slow Moving Watch" icon={Boxes}>
          <ProductRows products={data.slow_moving_products} mode="slow" />
        </Panel>
        <Panel title="Branch Sync Health" icon={RefreshCcw}>
          <div className="divide-y divide-slate-200">
            {syncRows.map((row, index) => (
              <SyncRow key={row.branch_id ?? row.branch?.id ?? index} row={row} />
            ))}
          </div>
        </Panel>
      </div>

      {data.branch_performance?.length ? (
        <Panel title="Branch Performance" icon={Store}>
          <div className="overflow-hidden rounded-md border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Branch</th>
                  <th className="px-3 py-2">Transactions</th>
                  <th className="px-3 py-2 text-right">Net sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.branch_performance.map((branch) => (
                  <tr key={branch.branch.id}>
                    <td className="px-3 py-2 font-medium text-slate-950">
                      {branch.branch.code} · {branch.branch.name}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {branch.transaction_count}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-950">
                      {formatRupiah(branch.net_sales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function ProductRows({
  products,
  mode = "top",
}: {
  products: ProductPerformance[];
  mode?: "top" | "slow";
}) {
  if (products.length === 0) {
    return <StatePanel label="No product activity in this period." />;
  }

  return (
    <div className="divide-y divide-slate-200">
      {products.slice(0, 8).map((product, index) => {
        const name = product.name ?? product.product?.name ?? "Unknown product";
        const sku = product.sku ?? product.product?.sku ?? "-";

        return (
          <div className="grid grid-cols-[1fr_auto] gap-3 py-3" key={`${sku}-${index}`}>
            <div>
              <div className="text-sm font-medium text-slate-950">{name}</div>
              <div className="mt-1 text-xs text-slate-500">{sku}</div>
            </div>
            <div className="text-right text-sm">
              <div className="font-semibold text-slate-950">
                {product.quantity_sold} sold
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {mode === "top"
                  ? formatRupiah(product.sales_amount ?? 0)
                  : `${product.quantity_on_hand ?? 0} on hand`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SyncRow({ row }: { row: SyncHealth }) {
  const tone =
    row.health_status === "healthy"
      ? "success"
      : row.health_status === "pending"
        ? "warning"
        : "danger";

  return (
    <div className="grid gap-2 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-950">
          {row.branch?.code ?? row.branch_id ?? "Branch"}
        </span>
        <Badge tone={tone}>{row.health_status.replace("_", " ")}</Badge>
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs text-slate-600">
        <span>Pending {row.pending_jobs}</span>
        <span>Processing {row.processing_jobs}</span>
        <span>Failed {row.failed_jobs}</span>
        <span>Conflict {row.conflict_jobs}</span>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
  tone?: "neutral" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-md border bg-white p-4",
        tone === "warning"
          ? "border-amber-200 bg-amber-50"
          : "border-slate-200",
      )}
    >
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon size={16} />
        {label}
      </div>
      <div className="mt-3 text-xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof BarChart3;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
        <Icon size={16} />
        {title}
      </div>
      {children}
    </section>
  );
}

function SegmentedValue({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <div className="inline-flex rounded-md border border-slate-300 bg-white p-1">
        {options.map(([optionValue, optionLabel]) => (
          <button
            className={cn(
              "h-7 rounded px-3 text-xs font-medium text-slate-600",
              value === optionValue && "bg-slate-950 text-white",
            )}
            key={optionValue}
            onClick={() => onChange(optionValue)}
            type="button"
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatePanel({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-4 text-sm",
        tone === "danger"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      {label}
    </div>
  );
}

function Coverage({ label, done }: { label: string; done?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
      <span>{label}</span>
      <Badge tone={done ? "success" : "neutral"}>{done ? "Active" : "Todo"}</Badge>
    </div>
  );
}
