import type { CartLine, CartTotals, PosProduct } from "./pos-types";

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
