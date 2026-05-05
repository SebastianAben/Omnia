"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";

export type ShopeeStore = {
  id: string;
  store_name: string;
  external_store_id: string;
  status?: string | null;
  connected_at?: string | null;
  last_sync_at?: string | null;
};

export type ShopeeProductMapping = {
  id: string;
  channel_store_id: string;
  product_id: string;
  external_product_id: string;
  external_sku: string;
  mapping_status?: "active" | "pending" | "failed" | "inactive" | string;
  last_sync_status?: "success" | "pending" | "failed" | string | null;
  updated_at?: string | null;
  product?: {
    id: string;
    sku: string;
    name: string;
  } | null;
  store?: {
    id: string;
    store_name: string;
    external_store_id: string;
  } | null;
};

export type ShopeeOrder = {
  id: string;
  external_order_id: string;
  channel_store_id?: string | null;
  order_status: string;
  payment_status: string;
  total_amount: number | string;
  imported_at?: string | null;
  created_at?: string | null;
  customer_name?: string | null;
  store?: {
    id: string;
    store_name: string;
  } | null;
  items?: ShopeeOrderItem[];
};

export type ShopeeOrderItem = {
  id?: string;
  external_product_id?: string | null;
  external_sku: string;
  product_id?: string | null;
  product_name?: string | null;
  quantity: number;
  unit_price: number | string;
  mapping_status?: string | null;
};

export type ShopeeIntegrationJob = {
  id: string;
  job_type: string;
  status: string;
  attempt_count?: number;
  last_error?: string | null;
  last_attempt_at?: string | null;
  next_retry_at?: string | null;
  created_at?: string | null;
};

export type ShopeeIntegrationHealth = {
  integration?: string;
  status: string;
  last_checked_at?: string | null;
  connected_store_count?: number;
  active_mapping_count?: number;
  imported_order_count?: number;
  failed_job_count?: number;
  failed_jobs?: ShopeeIntegrationJob[];
  recent_errors?: Array<{
    id: string;
    message: string;
    created_at?: string | null;
  }>;
};

export type ProductOption = {
  id: string;
  sku: string;
  name: string;
};

export type CreateShopeeStoreInput = {
  store_name: string;
  external_store_id: string;
  credential_reference?: string;
};

export type CreateShopeeMappingInput = {
  channel_store_id: string;
  product_id: string;
  external_product_id: string;
  external_sku: string;
};

type ApiProduct = {
  id: string;
  sku: string;
  name: string;
};

export const shopeeKeys = {
  all: ["shopee"] as const,
  stores: () => [...shopeeKeys.all, "stores"] as const,
  mappings: () => [...shopeeKeys.all, "mappings"] as const,
  orders: () => [...shopeeKeys.all, "orders"] as const,
  order: (id: string) => [...shopeeKeys.orders(), id] as const,
  health: () => [...shopeeKeys.all, "health"] as const,
  products: () => [...shopeeKeys.all, "products"] as const,
};

export function useShopeeStores(token?: string) {
  return useQuery({
    queryKey: shopeeKeys.stores(),
    queryFn: () =>
      apiFetch<ShopeeStore[]>("/integrations/shopee/stores", { token }),
  });
}

export function useShopeeProductMappings(token?: string) {
  return useQuery({
    queryKey: shopeeKeys.mappings(),
    queryFn: () =>
      apiFetch<ShopeeProductMapping[]>(
        "/integrations/shopee/product-mappings",
        { token },
      ),
  });
}

export function useShopeeOrders(token?: string) {
  return useQuery({
    queryKey: shopeeKeys.orders(),
    queryFn: () =>
      apiFetch<ShopeeOrder[]>("/integrations/shopee/orders", { token }),
  });
}

export function useShopeeOrder(orderId: string | null, token?: string) {
  return useQuery({
    queryKey: shopeeKeys.order(orderId ?? "none"),
    queryFn: () =>
      apiFetch<ShopeeOrder>(`/integrations/shopee/orders/${orderId}`, {
        token,
      }),
    enabled: Boolean(orderId),
  });
}

export function useShopeeHealth(token?: string) {
  return useQuery({
    queryKey: shopeeKeys.health(),
    queryFn: () =>
      apiFetch<ShopeeIntegrationHealth>("/monitoring/integrations/shopee", {
        token,
      }),
  });
}

export function useProductOptions(token?: string) {
  return useQuery({
    queryKey: shopeeKeys.products(),
    queryFn: async () => {
      const products = await apiFetch<ApiProduct[]>("/products", { token });
      return products.map((product) => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
      }));
    },
  });
}

export function useCreateShopeeStore(token?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateShopeeStoreInput) =>
      apiFetch<ShopeeStore>("/integrations/shopee/stores", {
        method: "POST",
        body: JSON.stringify({
          store_name: input.store_name,
          external_store_id: input.external_store_id,
          auth_payload: input.credential_reference
            ? { credential_reference: input.credential_reference }
            : { mode: "mock" },
        }),
        token,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: shopeeKeys.stores() }),
        queryClient.invalidateQueries({ queryKey: shopeeKeys.health() }),
      ]);
    },
  });
}

export function useCreateShopeeMapping(token?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateShopeeMappingInput) =>
      apiFetch<ShopeeProductMapping>("/integrations/shopee/product-mappings", {
        method: "POST",
        body: JSON.stringify(input),
        token,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: shopeeKeys.mappings() }),
        queryClient.invalidateQueries({ queryKey: shopeeKeys.health() }),
      ]);
    },
  });
}

export function useRetryShopeeJob(token?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) =>
      apiFetch<{ job_id: string; status: string }>(
        `/integrations/shopee/jobs/${jobId}/retry`,
        {
          method: "POST",
          token,
        },
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: shopeeKeys.health() }),
        queryClient.invalidateQueries({ queryKey: shopeeKeys.orders() }),
      ]);
    },
  });
}
