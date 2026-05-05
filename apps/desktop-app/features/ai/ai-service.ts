"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";

export type AiInsight = {
  id: string;
  branch_id: string | null;
  product_id: string | null;
  insight_type:
    | "low_stock_alert"
    | "stockout_prediction"
    | "sales_trend"
    | "slow_moving"
    | "fast_moving"
    | "data_not_ready"
    | string;
  title: string;
  summary: string;
  severity: "info" | "warning" | "critical" | string;
  confidence_score: number;
  reference_data: Record<string, unknown>;
  generated_at: string;
  branch: { id: string; code: string; name: string } | null;
  product: { id: string; sku: string; name: string; unit: string } | null;
};

export type AiInsightFilters = {
  branchId?: string;
  insightType?: string;
  generatedAfter?: string;
};

export const aiKeys = {
  all: ["ai"] as const,
  insights: (filters: AiInsightFilters) =>
    [...aiKeys.all, "insights", filters] as const,
  lowStock: (branchId?: string) =>
    [...aiKeys.all, "low-stock", branchId] as const,
  stockout: (branchId?: string) =>
    [...aiKeys.all, "stockout", branchId] as const,
};

export function useAiInsights(filters: AiInsightFilters, token?: string) {
  return useQuery({
    queryKey: aiKeys.insights(filters),
    queryFn: () => fetchAiInsights(filters, token),
    enabled: Boolean(token),
    staleTime: 60_000,
  });
}

export function useLowStockInsights(branchId?: string, token?: string) {
  return useQuery({
    queryKey: aiKeys.lowStock(branchId),
    queryFn: () =>
      apiFetch<AiInsight[]>(
        `/ai/insights/low-stock${branchId ? `?branch_id=${encodeURIComponent(branchId)}` : ""}`,
        { token },
      ),
    enabled: Boolean(token),
    staleTime: 60_000,
  });
}

export function useStockoutInsights(branchId?: string, token?: string) {
  return useQuery({
    queryKey: aiKeys.stockout(branchId),
    queryFn: () =>
      apiFetch<AiInsight[]>(
        `/ai/insights/stockout-predictions${branchId ? `?branch_id=${encodeURIComponent(branchId)}` : ""}`,
        { token },
      ),
    enabled: Boolean(token),
    staleTime: 60_000,
  });
}

async function fetchAiInsights(filters: AiInsightFilters, token?: string) {
  const params = new URLSearchParams();

  if (filters.branchId) {
    params.set("branch_id", filters.branchId);
  }
  if (filters.insightType) {
    params.set("insight_type", filters.insightType);
  }
  if (filters.generatedAfter) {
    params.set("generated_after", filters.generatedAfter);
  }

  const query = params.toString();
  return apiFetch<AiInsight[]>(`/ai/insights${query ? `?${query}` : ""}`, {
    token,
  });
}
