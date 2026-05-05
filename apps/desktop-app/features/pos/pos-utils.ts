import type { CartLine, CartTotals, PosProduct } from "./pos-types";

export const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

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
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return products;
  }

  return products.filter((product) =>
    [product.name, product.sku, product.barcode ?? "", product.categoryName]
      .join(" ")
      .toLowerCase()
      .includes(normalized),
  );
}
