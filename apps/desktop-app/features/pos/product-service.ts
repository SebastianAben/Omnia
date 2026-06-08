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

export async function loadPosCatalog(
  branchId: string,
  token: string,
): Promise<PosProduct[]> {
  const [products, prices] = await Promise.all([
    apiFetch<ApiProduct[]>("/products", { token }),
    apiFetch<ApiBranchPrice[]>(`/branches/${branchId}/product-prices`, {
      token,
    }),
  ]);
  const priceByProduct = new Map(
    prices.map((price) => [price.product_id, Number(price.selling_price)]),
  );

  return products.flatMap((product, index) => {
    const price = priceByProduct.get(product.id);
    if (price === undefined || !Number.isFinite(price) || price < 0) {
      return [];
    }

    return [{
      id: product.id,
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
      categoryName: product.category?.name ?? "Uncategorized",
      unit: product.unit,
      price,
      stockOnHand: demoCatalog[index]?.stockOnHand ?? 0,
      minimumQuantity: demoCatalog[index]?.minimumQuantity ?? 0,
    }];
  });
}

export function loadFallbackCatalog() {
  return demoCatalog;
}
