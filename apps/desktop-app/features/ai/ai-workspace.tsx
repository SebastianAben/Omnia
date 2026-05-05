"use client";

import { useMemo, useState } from "react";
import { Badge, Button, cn } from "@omnia/ui";
import {
  AlertTriangle,
  BrainCircuit,
  PackageSearch,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { WorkspacePanel } from "@/components/app-shell";
import {
  useAiInsights,
  useLowStockInsights,
  useStockoutInsights,
  type AiInsight,
} from "@/features/ai/ai-service";
import { formatRupiah } from "@/features/pos/pos-utils";
import { roleLabels, useAppState } from "@/lib/app-state";

const insightTypeOptions = [
  ["", "All"],
  ["low_stock_alert", "Low stock"],
  ["stockout_prediction", "Stockout"],
  ["sales_trend", "Trend"],
  ["fast_moving", "Fast"],
  ["slow_moving", "Slow"],
  ["data_not_ready", "Data status"],
] as const;

export function AiWorkspace() {
  const role = useAppState((state) => state.role);
  const token = useAppState((state) => state.token);
  const [branchFilter, setBranchFilter] = useState("");
  const [insightType, setInsightType] = useState("");
  const filters = useMemo(
    () => ({
      branchId: branchFilter || undefined,
      insightType: insightType || undefined,
    }),
    [branchFilter, insightType],
  );
  const insights = useAiInsights(filters, token);
  const lowStock = useLowStockInsights(branchFilter || undefined, token);
  const stockout = useStockoutInsights(branchFilter || undefined, token);
  const canReadAi = role === "hq_admin" || role === "executive";

  if (!token) {
    return (
      <WorkspacePanel
        badge="Sign in required"
        description="AI insights are generated from central synced data and require an authenticated HQ or analyst session."
        title="AI Insights"
      >
        <StatePanel label="Login dulu untuk membaca insight analytics pusat." />
      </WorkspacePanel>
    );
  }

  if (!canReadAi) {
    return (
      <WorkspacePanel
        badge={roleLabels[role]}
        description="AI analytics is advisory and limited to HQ Admin and Executive / Analyst roles."
        title="AI Insights"
      >
        <StatePanel
          label="Role aktif tidak punya akses ke AI insights."
          tone="danger"
        />
      </WorkspacePanel>
    );
  }

  return (
    <WorkspacePanel
      badge={roleLabels[role]}
      description="Advisory analytics from central sales and inventory data. AI never changes stock, price, or order records."
      title="AI Insights"
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className="h-9 w-64 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-500"
          onChange={(event) => setBranchFilter(event.target.value)}
          placeholder="Optional branch ID filter"
          value={branchFilter}
        />
        <div className="inline-flex rounded-md border border-slate-300 bg-white p-1">
          {insightTypeOptions.map(([value, label]) => (
            <button
              className={cn(
                "h-7 rounded px-3 text-xs font-medium text-slate-600",
                insightType === value && "bg-slate-950 text-white",
              )}
              key={value}
              onClick={() => setInsightType(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <Button
          className="h-9"
          onClick={() => void insights.refetch()}
          type="button"
          variant="secondary"
        >
          <RefreshCcw size={15} />
          Refresh
        </Button>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Metric
          icon={BrainCircuit}
          label="Total insights"
          value={String(insights.data?.length ?? 0)}
        />
        <Metric
          icon={AlertTriangle}
          label="Low stock alerts"
          tone={(lowStock.data?.length ?? 0) > 0 ? "warning" : "neutral"}
          value={String(lowStock.data?.length ?? 0)}
        />
        <Metric
          icon={PackageSearch}
          label="Stockout predictions"
          tone={(stockout.data?.length ?? 0) > 0 ? "warning" : "neutral"}
          value={String(stockout.data?.length ?? 0)}
        />
      </div>

      {insights.isLoading ? (
        <StatePanel label="Generating and loading AI insights..." />
      ) : insights.isError ? (
        <StatePanel
          label="AI insights API is unavailable or access is denied."
          tone="danger"
        />
      ) : insights.data?.length ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <InsightList insights={insights.data} />
          <InsightReference insights={insights.data} />
        </div>
      ) : (
        <StatePanel label="No AI insights match the selected filters." />
      )}
    </WorkspacePanel>
  );
}

function InsightList({ insights }: { insights: AiInsight[] }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-950">
        Advisory Queue
      </div>
      <div className="divide-y divide-slate-200">
        {insights.map((insight) => (
          <div className="grid gap-2 p-4" key={insight.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <InsightIcon insight={insight} />
                <span className="text-sm font-semibold text-slate-950">
                  {insight.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={severityTone(insight.severity)}>
                  {insight.severity}
                </Badge>
                <span className="text-xs font-medium text-slate-500">
                  {Math.round(insight.confidence_score * 100)}%
                </span>
              </div>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              {insight.summary}
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              {insight.branch ? <span>{insight.branch.code}</span> : null}
              {insight.product ? <span>{insight.product.sku}</span> : null}
              <span>{insight.insight_type.replaceAll("_", " ")}</span>
              <span>
                {new Date(insight.generated_at).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function InsightReference({ insights }: { insights: AiInsight[] }) {
  const selected = insights[0];

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
        <BrainCircuit size={16} />
        Reference Snapshot
      </div>
      {selected ? (
        <div className="grid gap-3 text-sm">
          <ReferenceRow label="Selected" value={selected.title} />
          <ReferenceRow
            label="Confidence"
            value={`${Math.round(selected.confidence_score * 100)}%`}
          />
          <ReferenceRow label="Branch" value={selected.branch?.name ?? "-"} />
          <ReferenceRow label="Product" value={selected.product?.name ?? "-"} />
          <div className="rounded-md bg-slate-50 p-3">
            <div className="mb-2 text-xs font-medium uppercase text-slate-500">
              Reference data
            </div>
            <div className="grid gap-2">
              {Object.entries(selected.reference_data)
                .slice(0, 8)
                .map(([key, value]) => (
                  <ReferenceRow
                    key={key}
                    label={key.replaceAll("_", " ")}
                    value={formatReferenceValue(value)}
                  />
                ))}
            </div>
          </div>
        </div>
      ) : (
        <StatePanel label="Select an insight to inspect its reference data." />
      )}
    </section>
  );
}

function InsightIcon({ insight }: { insight: AiInsight }) {
  if (insight.insight_type === "sales_trend") {
    const delta = Number(insight.reference_data.delta_percent ?? 0);
    const Icon = delta < 0 ? TrendingDown : TrendingUp;
    return (
      <Icon
        className={delta < 0 ? "text-amber-600" : "text-emerald-600"}
        size={16}
      />
    );
  }

  const Icon =
    insight.insight_type === "low_stock_alert" ||
    insight.insight_type === "stockout_prediction"
      ? AlertTriangle
      : BrainCircuit;

  return <Icon className="text-slate-500" size={16} />;
}

function ReferenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs uppercase text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-950">
        {value}
      </span>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: typeof BrainCircuit;
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

function severityTone(severity: string) {
  if (severity === "critical") {
    return "danger";
  }
  if (severity === "warning") {
    return "warning";
  }

  return "neutral";
}

function formatReferenceValue(value: unknown) {
  if (typeof value === "number") {
    return Math.abs(value) >= 1000 ? formatRupiah(value) : String(value);
  }
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return "-";
  }

  return JSON.stringify(value);
}
