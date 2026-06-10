import { apiFetch } from "@/lib/api-client";
import { listLocalInventoryBalances } from "@/features/local-first/local-checkout-repository";
import { demoCatalog } from "./demo-catalog";
import type { PosProduct } from "./pos-types";

type ApiProduct = {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  unit: string;
  is_active?: boolean;
  category?: {
    name: string;
  } | null;
};

type ApiBranchPrice = {
  product_id: string;
  selling_price: string;
};

type ApiInventoryBalance = {
  product_id: string;
  quantity_on_hand: string;
  minimum_stock_threshold?: string | null;
};

export type CreateProductInput = {
  branchId: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  unit: string;
  sellingPrice: number;
  openingStock: number;
  minimumStockThreshold: number;
};

export type ProductAvailability = {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  unit: string;
  categoryName: string;
  isActive: boolean;
};

export async function loadPosCatalog(
  branchId: string,
  token: string,
): Promise<PosProduct[]> {
  const [products, prices, centralBalances, localBalances] = await Promise.all([
    apiFetch<ApiProduct[]>("/products", { token }),
    apiFetch<ApiBranchPrice[]>(`/branches/${branchId}/product-prices`, {
      token,
    }),
    apiFetch<ApiInventoryBalance[]>(
      `/inventory/balances?branch_id=${encodeURIComponent(branchId)}`,
      { token },
    ),
    listLocalInventoryBalances().catch(() => []),
  ]);
  const priceByProduct = new Map(
    prices.map((price) => [price.product_id, Number(price.selling_price)]),
  );
  const centralBalanceByProduct = new Map(
    centralBalances.map((balance) => [
      balance.product_id,
      {
        stockOnHand: Number(balance.quantity_on_hand),
        minimumQuantity:
          balance.minimum_stock_threshold === null ||
          balance.minimum_stock_threshold === undefined
            ? undefined
            : Number(balance.minimum_stock_threshold),
      },
    ]),
  );
  const localBalanceByProduct = new Map(
    localBalances
      .filter((balance) => balance.branchId === branchId)
      .map((balance) => [balance.productId, balance]),
  );

  return products.flatMap((product, index) => {
    const price = priceByProduct.get(product.id);
    if (price === undefined || !Number.isFinite(price) || price < 0) {
      return [];
    }

    const fallback = demoCatalog[index];
    const centralBalance = centralBalanceByProduct.get(product.id);
    const localBalance = localBalanceByProduct.get(product.id);
    const stockOnHand =
      localBalance?.quantity ??
      centralBalance?.stockOnHand ??
      fallback?.stockOnHand ??
      0;
    const minimumQuantity =
      localBalance?.minimumQuantity ??
      centralBalance?.minimumQuantity ??
      fallback?.minimumQuantity ??
      0;

    return [
      {
        id: product.id,
        sku: product.sku,
        barcode: product.barcode,
        name: product.name,
        categoryName: product.category?.name ?? "Uncategorized",
        unit: product.unit,
        price,
        stockOnHand,
        minimumQuantity,
      },
    ];
  });
}

export function loadFallbackCatalog() {
  return demoCatalog;
}

export async function createProduct(input: CreateProductInput, token: string) {
  return apiFetch<ApiProduct>("/products", {
    method: "POST",
    token,
    body: JSON.stringify({
      branch_id: input.branchId,
      sku: input.sku,
      barcode: input.barcode || null,
      name: input.name,
      description: input.description || null,
      unit: input.unit,
      selling_price: input.sellingPrice,
      opening_stock: input.openingStock,
      minimum_stock_threshold: input.minimumStockThreshold,
    }),
  });
}

export async function listProductAvailability(token: string) {
  const products = await apiFetch<ApiProduct[]>(
    "/products?include_inactive=true",
    { token },
  );

  return products.map((product) => ({
    id: product.id,
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    description: product.description,
    unit: product.unit,
    categoryName: product.category?.name ?? "Uncategorized",
    isActive: Boolean(product.is_active),
  }));
}

export async function deactivateProduct(productId: string, token: string) {
  return apiFetch<{ id: string; is_active: boolean }>(
    `/products/${productId}`,
    {
      method: "DELETE",
      token,
    },
  );
}

export async function activateProduct(productId: string, token: string) {
  return apiFetch<{ id: string; is_active: boolean }>(
    `/products/${productId}/activate`,
    {
      method: "PATCH",
      token,
    },
  );
}
