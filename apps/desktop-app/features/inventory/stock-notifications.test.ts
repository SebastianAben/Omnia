import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStockNotifications,
  summarizeStockNotifications,
  type StockNotificationProduct,
} from "./stock-notifications";

const product = (
  input: Partial<StockNotificationProduct> &
    Pick<StockNotificationProduct, "id">,
): StockNotificationProduct => ({
  id: input.id,
  sku: input.sku ?? `SKU-${input.id}`,
  name: input.name ?? `Product ${input.id}`,
  branchName: input.branchName ?? "Main Branch",
  quantityOnHand: input.quantityOnHand ?? 10,
  threshold: input.threshold ?? 5,
  source: input.source ?? "local",
  updatedAt: input.updatedAt,
});

test("buildStockNotifications classifies out-of-stock products as critical", () => {
  const result = buildStockNotifications([
    product({ id: "empty", quantityOnHand: 0, threshold: 5 }),
  ]);

  assert.equal(result[0]?.type, "out_of_stock");
  assert.equal(result[0]?.severity, "critical");
  assert.equal(result[0]?.quantityOnHand, 0);
  assert.equal(result[0]?.threshold, 5);
});

test("buildStockNotifications classifies products at threshold as low stock", () => {
  const result = buildStockNotifications([
    product({ id: "low", quantityOnHand: 5, threshold: 5 }),
  ]);

  assert.equal(result[0]?.type, "low_stock");
  assert.equal(result[0]?.severity, "warning");
});

test("buildStockNotifications excludes products above threshold", () => {
  const result = buildStockNotifications([
    product({ id: "ready", quantityOnHand: 6, threshold: 5 }),
  ]);

  assert.equal(result.length, 0);
});

test("buildStockNotifications sorts critical alerts before lowest stock ratio", () => {
  const result = buildStockNotifications([
    product({ id: "low-half", quantityOnHand: 5, threshold: 10 }),
    product({ id: "critical", quantityOnHand: 0, threshold: 2 }),
    product({ id: "low-tenth", quantityOnHand: 1, threshold: 10 }),
  ]);

  assert.deepEqual(
    result.map((item) => item.productId),
    ["critical", "low-tenth", "low-half"],
  );
});

test("buildStockNotifications ignores zero threshold except out-of-stock", () => {
  const result = buildStockNotifications([
    product({ id: "zero-threshold-ready", quantityOnHand: 1, threshold: 0 }),
    product({ id: "zero-threshold-empty", quantityOnHand: 0, threshold: 0 }),
  ]);

  assert.deepEqual(
    result.map((item) => item.productId),
    ["zero-threshold-empty"],
  );
});

test("summarizeStockNotifications counts critical and warning alerts", () => {
  const summary = summarizeStockNotifications(
    buildStockNotifications([
      product({ id: "empty", quantityOnHand: 0, threshold: 5 }),
      product({ id: "low", quantityOnHand: 3, threshold: 5 }),
      product({ id: "ready", quantityOnHand: 9, threshold: 5 }),
    ]),
  );

  assert.deepEqual(summary, {
    total: 2,
    outOfStock: 1,
    lowStock: 1,
  });
});
