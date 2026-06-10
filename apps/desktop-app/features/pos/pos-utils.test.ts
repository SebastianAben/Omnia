import assert from "node:assert/strict";
import test from "node:test";

import type { PosProduct } from "./pos-types";
import {
  findExactCatalogMatch,
  getCatalogSearchResult,
} from "./pos-utils";

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

test("getCatalogSearchResult ranks exact barcode and sku matches before prefix and name matches", () => {
  const result = getCatalogSearchResult(
    [
      product({ id: "name", name: "ABC noodles" }),
      product({ id: "prefix", sku: "ABC-1234", name: "Prefix match" }),
      product({ id: "barcode", barcode: "ABC", name: "Barcode match" }),
      product({ id: "sku", sku: "ABC", name: "Sku match" }),
    ],
    "abc",
    { limit: 10 },
  );

  assert.deepEqual(
    result.items.map((item) => item.id),
    ["barcode", "sku", "prefix", "name"],
  );
  assert.equal(result.totalCount, 4);
  assert.equal(result.hasMore, false);
});

test("getCatalogSearchResult returns a bounded default result for empty query", () => {
  const products = Array.from({ length: 12 }, (_, index) =>
    product({ id: String(index).padStart(2, "0") }),
  );

  const result = getCatalogSearchResult(products, "", { limit: 5 });

  assert.equal(result.items.length, 5);
  assert.equal(result.totalCount, 12);
  assert.equal(result.hasMore, true);
});

test("findExactCatalogMatch returns a single exact barcode or sku match only", () => {
  assert.equal(
    findExactCatalogMatch(
      [
        product({ id: "sku", sku: "SKU-001" }),
        product({ id: "name", name: "SKU-001 display" }),
      ],
      "sku-001",
    )?.id,
    "sku",
  );

  assert.equal(
    findExactCatalogMatch(
      [
        product({ id: "first", sku: "DUPLICATE" }),
        product({ id: "second", barcode: "DUPLICATE" }),
      ],
      "duplicate",
    ),
    null,
  );
});
