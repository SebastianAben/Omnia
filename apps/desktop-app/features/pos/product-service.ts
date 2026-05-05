import { apiFetch } from "@/lib/api-client";
import { demoCatalog } from "./demo-catalog";
import type { PosProduct } from "./pos-types";

type ApiProduct = {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  unit: string;
  category?: {
    name: string;
  } | null;
};

type ApiBranchPrice = {
  product_id: string;
  selling_price: string;
};

export async function loadPosCatalog(branchId: string): Promise<PosProduct[]> {
  const [products, prices] = await Promise.all([
    apiFetch<ApiProduct[]>("/products"),
    apiFetch<ApiBranchPrice[]>(`/branches/${branchId}/product-prices`),
  ]);
  const priceByProduct = new Map(
    prices.map((price) => [price.product_id, Number(price.selling_price)]),
  );

  return products.map((product, index) => ({
    id: product.id,
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    categoryName: product.category?.name ?? "Uncategorized",
    unit: product.unit,
    price: priceByProduct.get(product.id) ?? demoCatalog[index]?.price ?? 0,
    stockOnHand: demoCatalog[index]?.stockOnHand ?? 0,
    minimumQuantity: demoCatalog[index]?.minimumQuantity ?? 0,
  }));
}

export function loadFallbackCatalog() {
  return demoCatalog;
}
