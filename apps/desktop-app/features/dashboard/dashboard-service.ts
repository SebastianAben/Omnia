"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";

export type DashboardScope = "branch" | "central";

export type DashboardFilters = {
  branchId?: string;
  from?: string;
  to?: string;
};

export type DashboardKpi = {
  gross_sales: number;
  net_sales: number;
  discount_total: number;
  tax_total: number;
  paid_amount: number;
  transaction_count: number;
  average_transaction_value: number;
  open_shift_count?: number;
  low_stock_count: number;
  failed_sync_count?: number;
  pending_sync_count?: number;
  branch_count?: number;
  unhealthy_branch_count?: number;
};

export type ProductPerformance = {
  product_id?: string;
  sku?: string | null;
  name?: string;
  quantity_sold: number;
  sales_amount?: number;
  quantity_on_hand?: number;
  product?: {
    id: string;
    sku: string;
    name: string;
    unit: string;
  };
  branch?: {
    id: string;
    code: string;
    name: string;
  };
};

export type InventoryAlert = {
  id: string;
  quantity_on_hand: number;
  minimum_stock_threshold: number;
  severity: "critical" | "warning";
  branch: { id: string; code: string; name: string };
  product: { id: string; sku: string; name: string; unit: string };
};

export type BranchPerformance = {
  branch: { id: string; code: string; name: string };
  transaction_count: number;
  net_sales: number;
};

export type SyncHealth = {
  branch?: { id: string; code: string; name: string };
  branch_id?: string | null;
  pending_jobs: number;
  processing_jobs: number;
  success_jobs: number;
  failed_jobs: number;
  conflict_jobs: number;
  last_successful_sync_at: string | null;
  health_status: "healthy" | "pending" | "attention_required";
};

export type DashboardData = {
  scope: DashboardScope;
  period: {
    from: string;
    to: string;
    branch_id: string | null;
  };
  kpi: DashboardKpi;
  top_selling_products: ProductPerformance[];
  slow_moving_products: ProductPerformance[];
  payment_method_summary: Array<{
    payment_method_code: string;
    transaction_count: number;
    amount: number;
  }>;
  inventory_alerts: InventoryAlert[];
  branch_performance?: BranchPerformance[];
  sync_health: SyncHealth | SyncHealth[];
  recent_transactions?: Array<{
    id: string;
    transaction_no: string;
    transaction_datetime: string;
    total_amount: number;
    payment_status: string;
    branch: { id: string; code: string; name: string };
  }>;
  integration_health?: Array<{
    integration: string;
    status: string;
    last_checked_at: string;
  }>;
};

export type AuditLog = {
  id: string;
  user_id: string | null;
  branch_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  note: string | null;
  created_at: string;
  user: { id: string; username: string; full_name: string } | null;
  branch: { id: string; code: string; name: string } | null;
};

export const dashboardKeys = {
  all: ["dashboard"] as const,
  detail: (scope: DashboardScope, filters: DashboardFilters) =>
    [...dashboardKeys.all, scope, filters] as const,
  audit: (branchId?: string) => [...dashboardKeys.all, "audit", branchId] as const,
};

export function useDashboard(
  scope: DashboardScope,
  filters: DashboardFilters,
  token?: string,
) {
  return useQuery({
    queryKey: dashboardKeys.detail(scope, filters),
    queryFn: () => fetchDashboard(scope, filters, token),
    enabled: Boolean(token),
    staleTime: 60_000,
  });
}

export function useAuditLogs(
  branchId?: string,
  token?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: dashboardKeys.audit(branchId),
    queryFn: () =>
      apiFetch<AuditLog[]>(
        `/audit/logs${branchId ? `?branch_id=${encodeURIComponent(branchId)}` : ""}`,
        { token },
      ),
    enabled: Boolean(token) && enabled,
    staleTime: 60_000,
  });
}

async function fetchDashboard(
  scope: DashboardScope,
  filters: DashboardFilters,
  token?: string,
) {
  const params = new URLSearchParams();

  if (filters.branchId) {
    params.set("branch_id", filters.branchId);
  }
  if (filters.from) {
    params.set("from", filters.from);
  }
  if (filters.to) {
    params.set("to", filters.to);
  }

  const query = params.toString();
  return apiFetch<DashboardData>(`/dashboard/${scope}${query ? `?${query}` : ""}`, {
    token,
  });
}
