import type { CartLine, CartTotals, PosProduct } from "./pos-types";

const defaultCatalogResultLimit = 24;

export const formatRupiah = (value: number) => {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const digits = String(Math.abs(rounded)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ".",
  );

  return `${sign}Rp${digits}`;
};

export function calculateCartTotals(lines: CartLine[]): CartTotals {
  const subtotal = lines.reduce(
    (total, line) => total + line.product.price * line.quantity,
    0,
  );
  const discountTotal = lines.reduce(
    (total, line) => total + line.discountTotal,
    0,
  );
  const taxableAmount = Math.max(subtotal - discountTotal, 0);
  const taxTotal = Math.round(taxableAmount * 0.11);

  return {
    itemCount: lines.reduce((total, line) => total + line.quantity, 0),
    subtotal,
    discountTotal,
    taxTotal,
    grandTotal: taxableAmount + taxTotal,
  };
}

export function filterCatalog(products: PosProduct[], query: string) {
  return getCatalogSearchResult(products, query).items;
}

export function findExactCatalogMatch(
  products: PosProduct[],
  query: string,
): PosProduct | null {
  const normalized = normalizeCatalogQuery(query);

  if (!normalized) {
    return null;
  }

  const exactMatches = products.filter(
    (product) =>
      normalizeCatalogQuery(product.barcode ?? "") === normalized ||
      normalizeCatalogQuery(product.sku) === normalized,
  );

  return exactMatches.length === 1 ? exactMatches[0] : null;
}

export function getCatalogSearchResult(
  products: PosProduct[],
  query: string,
  options: { limit?: number } = {},
) {
  const limit = Math.max(1, options.limit ?? defaultCatalogResultLimit);
  const normalized = normalizeCatalogQuery(query);
  const rankedProducts = normalized
    ? products
        .map((product, index) => ({
          product,
          index,
          rank: getProductSearchRank(product, normalized),
        }))
        .filter(
          (
            item,
          ): item is { product: PosProduct; index: number; rank: number } =>
            item.rank !== null,
        )
        .sort((first, second) => {
          if (first.rank !== second.rank) {
            return first.rank - second.rank;
          }

          return first.index - second.index;
        })
        .map((item) => item.product)
    : products;

  return {
    items: rankedProducts.slice(0, limit),
    totalCount: rankedProducts.length,
    hasMore: rankedProducts.length > limit,
    limit,
  };
}

const normalizeCatalogQuery = (value: string) => value.trim().toLowerCase();

function getProductSearchRank(product: PosProduct, normalizedQuery: string) {
  const barcode = normalizeCatalogQuery(product.barcode ?? "");
  const sku = normalizeCatalogQuery(product.sku);
  const name = normalizeCatalogQuery(product.name);
  const category = normalizeCatalogQuery(product.categoryName);

  if (barcode && barcode === normalizedQuery) {
    return 0;
  }

  if (sku === normalizedQuery) {
    return 1;
  }

  if (
    (barcode && barcode.startsWith(normalizedQuery)) ||
    sku.startsWith(normalizedQuery)
  ) {
    return 2;
  }

  if (name.includes(normalizedQuery) || category.includes(normalizedQuery)) {
    return 3;
  }

  return null;
}
