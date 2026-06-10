import assert from "node:assert/strict";
import test from "node:test";

import type { PosProduct } from "./pos-types";
import { useCartStore } from "./cart-store";

const product = (input: Partial<PosProduct> & Pick<PosProduct, "id">) => ({
  id: input.id,
  sku: input.sku ?? `SKU-${input.id}`,
  barcode: input.barcode ?? null,
  name: input.name ?? `Product ${input.id}`,
  categoryName: input.categoryName ?? "General",
  unit: input.unit ?? "pcs",
  price: input.price ?? 1000,
  stockOnHand: input.stockOnHand ?? 10,
  minimumQuantity: input.minimumQuantity ?? 2,
});

test("setProductQuantity clamps direct quantity input to available stock", () => {
  useCartStore.getState().clearCart();
  const target = product({ id: "limited", stockOnHand: 3 });

  useCartStore.getState().addProduct(target);
  useCartStore.getState().setProductQuantity(target.id, 9);

  assert.equal(useCartStore.getState().lines[0]?.quantity, 3);
});

test("setProductQuantity keeps direct quantity input at one or above", () => {
  useCartStore.getState().clearCart();
  const target = product({ id: "minimum", stockOnHand: 3 });

  useCartStore.getState().addProduct(target);
  useCartStore.getState().setProductQuantity(target.id, 0);

  assert.equal(useCartStore.getState().lines[0]?.quantity, 1);
});

test("out-of-stock products cannot enter the cart", () => {
  useCartStore.getState().clearCart();

  useCartStore
    .getState()
    .addProduct(product({ id: "empty", stockOnHand: 0 }));

  assert.equal(useCartStore.getState().lines.length, 0);
});
