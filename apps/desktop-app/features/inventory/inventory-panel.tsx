"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button } from "@omnia/ui";
import {
  AlertTriangle,
  ChevronDown,
  Minus,
  Plus,
  RefreshCcw,
} from "lucide-react";

import { WorkspacePanel } from "@/components/app-shell";
import {
  listLocalInventoryBalances,
  listLocalStockMovements,
  listLocalSyncQueue,
  saveStockAdjustmentLocally,
  type LocalInventoryBalanceRecord,
  type LocalStockMovementRecord,
} from "@/features/local-first/local-checkout-repository";
import {
  activateProduct,
  createProduct,
  deactivateProduct,
  listProductAvailability,
  loadFallbackCatalog,
  loadPosCatalog,
  type ProductAvailability,
} from "@/features/pos/product-service";
import type { PosProduct } from "@/features/pos/pos-types";
import {
  buildStockNotifications,
  getStockNotificationType,
  summarizeStockNotifications,
  type StockNotification,
} from "@/features/inventory/stock-notifications";
import { useAppState } from "@/lib/app-state";

type InventoryProduct = PosProduct & {
  localUpdatedAt?: string;
};

const reasonOptions = [
  { value: "stock_count", label: "Stock count" },
  { value: "damaged_goods", label: "Damaged goods" },
  { value: "receiving_correction", label: "Receiving correction" },
  { value: "manual_correction", label: "Manual correction" },
];

const productPageSize = 12;
type InventorySidePanel =
  | "stock_adjustment"
  | "add_product"
  | "product_availability";

export function InventoryPanel() {
  const branch = useAppState((state) => state.branch);
  const token = useAppState((state) => state.token);
  const user = useAppState((state) => state.user);
  const setPendingSyncCount = useAppState((state) => state.setPendingSyncCount);
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [availabilityProducts, setAvailabilityProducts] = useState<
    ProductAvailability[]
  >([]);
  const [balances, setBalances] = useState<LocalInventoryBalanceRecord[]>([]);
  const [movements, setMovements] = useState<LocalStockMovementRecord[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [movementType, setMovementType] = useState<
    "adjustment_plus" | "adjustment_minus"
  >("adjustment_plus");
  const [quantity, setQuantity] = useState(1);
  const [reasonCode, setReasonCode] = useState(reasonOptions[0].value);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setSaving] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [isCreatingProduct, setCreatingProduct] = useState(false);
  const [isUpdatingAvailability, setUpdatingAvailability] = useState(false);
  const [sidePanel, setSidePanel] =
    useState<InventorySidePanel>("stock_adjustment");
  const [selectedAvailabilityProductId, setSelectedAvailabilityProductId] =
    useState("");
  const [newProduct, setNewProduct] = useState({
    sku: "",
    barcode: "",
    name: "",
    unit: "pcs",
    sellingPrice: 0,
    openingStock: 0,
    minimumStockThreshold: 0,
  });

  useEffect(() => {
    void refreshInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch.id, token]);

  const productsWithBalances = useMemo<InventoryProduct[]>(() => {
    const balanceByProduct = new Map(
      balances.map((balance) => [balance.productId, balance]),
    );

    return products.map((product) => {
      const balance = balanceByProduct.get(product.id);

      return {
        ...product,
        stockOnHand: balance?.quantity ?? product.stockOnHand,
        minimumQuantity: balance?.minimumQuantity ?? product.minimumQuantity,
        localUpdatedAt: balance?.updatedAt,
      };
    });
  }, [balances, products]);

  const selectedProduct =
    productsWithBalances.find((product) => product.id === selectedProductId) ??
    productsWithBalances[0];
  const selectedAvailabilityProduct =
    availabilityProducts.find(
      (product) => product.id === selectedAvailabilityProductId,
    ) ?? availabilityProducts[0];
  const productPageCount = Math.max(
    1,
    Math.ceil(productsWithBalances.length / productPageSize),
  );
  const pagedProducts = productsWithBalances.slice(
    (productPage - 1) * productPageSize,
    productPage * productPageSize,
  );

  useEffect(() => {
    setProductPage((page) => Math.min(page, productPageCount));
  }, [productPageCount]);
  const stockNotifications = useMemo(
    () =>
      buildStockNotifications(
        productsWithBalances.map((product) => ({
          id: product.id,
          sku: product.sku,
          name: product.name,
          branchName: branch.name,
          quantityOnHand: product.stockOnHand,
          threshold: product.minimumQuantity,
          source: "local",
          updatedAt: product.localUpdatedAt,
        })),
      ),
    [branch.name, productsWithBalances],
  );
  const notificationSummary = useMemo(
    () => summarizeStockNotifications(stockNotifications),
    [stockNotifications],
  );
  const adjustmentWouldUnderflow =
    movementType === "adjustment_minus" &&
    selectedProduct &&
    quantity > selectedProduct.stockOnHand;

  async function refreshInventory() {
    const [
      catalogResult,
      productAvailability,
      localBalances,
      localMovements,
      queue,
    ] = await Promise.all([
      token
        ? loadPosCatalog(branch.id, token).catch(() => [])
        : loadFallbackCatalog(),
      token ? listProductAvailability(token).catch(() => []) : [],
      listLocalInventoryBalances().catch(() => []),
      listLocalStockMovements().catch(() => []),
      listLocalSyncQueue().catch(() => []),
    ]);

    setProducts(catalogResult);
    setAvailabilityProducts(productAvailability);
    setBalances(localBalances);
    setMovements(localMovements);
    setSelectedProductId((current) => current || catalogResult[0]?.id || "");
    setSelectedAvailabilityProductId(
      (current) => current || productAvailability[0]?.id || "",
    );
    setPendingSyncCount(
      queue.filter((item) => ["pending", "queued"].includes(item.status))
        .length,
    );
  }

  function fillProductForm(product: {
    sku: string;
    barcode?: string | null;
    name: string;
    unit: string;
    price?: number;
    stockOnHand?: number;
    minimumQuantity?: number;
  }) {
    setNewProduct({
      sku: product.sku,
      barcode: product.barcode ?? "",
      name: product.name,
      unit: product.unit,
      sellingPrice: product.price ?? 0,
      openingStock: product.stockOnHand ?? 0,
      minimumStockThreshold: product.minimumQuantity ?? 0,
    });
  }

  async function handleAdjustment() {
    if (!selectedProduct) {
      setMessage("Select a product before saving adjustment.");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage("Adjustment quantity must be greater than 0.");
      return;
    }
    if (adjustmentWouldUnderflow) {
      setMessage("Adjustment cannot reduce stock below zero.");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const result = await saveStockAdjustmentLocally({
        branch,
        user,
        product: selectedProduct,
        movementType,
        quantity,
        reasonCode,
        notes: notes.trim() || null,
      });
      await refreshInventory();
      setMessage(
        `${selectedProduct.sku} adjusted from ${result.quantityBefore} to ${result.quantityAfter}; queued as ${result.eventId}.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Stock adjustment failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateProduct() {
    if (!token) {
      setMessage("Login before creating a product.");
      return;
    }
    if (!newProduct.sku.trim() || !newProduct.name.trim()) {
      setMessage("SKU and product name are required.");
      return;
    }
    if (
      !Number.isFinite(newProduct.sellingPrice) ||
      newProduct.sellingPrice < 0 ||
      !Number.isFinite(newProduct.openingStock) ||
      newProduct.openingStock < 0 ||
      !Number.isFinite(newProduct.minimumStockThreshold) ||
      newProduct.minimumStockThreshold < 0
    ) {
      setMessage("Price, stock, and minimum stock must be non-negative.");
      return;
    }

    setCreatingProduct(true);
    setMessage(null);
    try {
      await createProduct(
        {
          branchId: branch.id,
          sku: newProduct.sku.trim(),
          barcode: newProduct.barcode.trim() || null,
          name: newProduct.name.trim(),
          unit: newProduct.unit.trim() || "pcs",
          sellingPrice: newProduct.sellingPrice,
          openingStock: newProduct.openingStock,
          minimumStockThreshold: newProduct.minimumStockThreshold,
        },
        token,
      );
      setNewProduct({
        sku: "",
        barcode: "",
        name: "",
        unit: "pcs",
        sellingPrice: 0,
        openingStock: 0,
        minimumStockThreshold: 0,
      });
      await refreshInventory();
      setMessage("Product created and available for POS.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Product creation failed.",
      );
    } finally {
      setCreatingProduct(false);
    }
  }

  async function handleDeactivateProduct() {
    if (!token || !selectedAvailabilityProduct) {
      setMessage("Select a product before deactivating.");
      return;
    }

    setUpdatingAvailability(true);
    setMessage(null);
    try {
      await deactivateProduct(selectedAvailabilityProduct.id, token);
      await refreshInventory();
      setMessage(
        `${selectedAvailabilityProduct.sku} was removed from active POS products.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Product deactivation failed.",
      );
    } finally {
      setUpdatingAvailability(false);
    }
  }

  async function handleActivateProduct() {
    if (!token || !selectedAvailabilityProduct) {
      setMessage("Select an inactive product before activating.");
      return;
    }

    setUpdatingAvailability(true);
    setMessage(null);
    try {
      await activateProduct(selectedAvailabilityProduct.id, token);
      await refreshInventory();
      setMessage(`${selectedAvailabilityProduct.sku} is active in POS.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Product activation failed.",
      );
    } finally {
      setUpdatingAvailability(false);
    }
  }

  return (
    <WorkspacePanel
      badge="Supervisor"
      description="Branch inventory control with local stock adjustment, low stock watch, and sync-ready stock movement history."
      title="Inventory Operations"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Metric
              label="Products"
              value={String(productsWithBalances.length)}
            />
            <Metric
              label="Stock alerts"
              value={String(notificationSummary.total)}
            />
            <Metric
              label="Pending movements"
              value={String(
                movements.filter((movement) =>
                  ["pending", "queued"].includes(movement.syncStatus),
                ).length,
              )}
            />
          </div>

          <StockAlertSummary
            lowStock={notificationSummary.lowStock}
            notifications={stockNotifications}
            outOfStock={notificationSummary.outOfStock}
          />

          <div className="overflow-hidden rounded-md border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Stock</th>
                  <th className="px-3 py-2 font-medium">Minimum</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {pagedProducts.map((product) => {
                  const stockStatus = getStockNotificationType({
                    stockOnHand: product.stockOnHand,
                    minimumQuantity: product.minimumQuantity,
                  });

                  return (
                    <tr
                      className="cursor-pointer hover:bg-slate-50"
                      key={product.id}
                      onClick={() => {
                        setSelectedProductId(product.id);
                        setSelectedAvailabilityProductId(product.id);
                        fillProductForm(product);
                      }}
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-950">
                          {product.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {product.sku} / {product.categoryName}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {product.stockOnHand} {product.unit}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {product.minimumQuantity} {product.unit}
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          tone={
                            stockStatus === "out_of_stock"
                              ? "danger"
                              : stockStatus === "low_stock"
                                ? "warning"
                                : "success"
                          }
                        >
                          {stockStatus === "out_of_stock"
                            ? "Out"
                            : stockStatus === "low_stock"
                              ? "Low"
                              : "Ready"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
            <span>
              Page {productPage} of {productPageCount}
            </span>
            <div className="flex gap-2">
              <Button
                disabled={productPage <= 1}
                onClick={() => setProductPage((page) => Math.max(1, page - 1))}
                type="button"
                variant="secondary"
              >
                Previous
              </Button>
              <Button
                disabled={productPage >= productPageCount}
                onClick={() =>
                  setProductPage((page) => Math.min(productPageCount, page + 1))
                }
                type="button"
                variant="secondary"
              >
                Next
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Movement</th>
                  <th className="px-3 py-2 font-medium">Delta</th>
                  <th className="px-3 py-2 font-medium">Reason</th>
                  <th className="px-3 py-2 font-medium">Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {movements.length === 0 ? (
                  <tr>
                    <td
                      className="px-3 py-6 text-center text-slate-500"
                      colSpan={4}
                    >
                      No local stock movement yet
                    </td>
                  </tr>
                ) : (
                  movements.map((movement) => {
                    const product = productsWithBalances.find(
                      (item) => item.id === movement.productId,
                    );

                    return (
                      <tr key={movement.id}>
                        <td className="px-3 py-2">
                          <div className="font-medium text-slate-950">
                            {product?.name ?? movement.productId}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(movement.occurredAt).toLocaleString(
                              "id-ID",
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {movement.quantityDelta > 0 ? "+" : ""}
                          {movement.quantityDelta}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {movement.reasonCode}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            tone={
                              movement.syncStatus === "synced"
                                ? "success"
                                : movement.syncStatus === "failed" ||
                                    movement.syncStatus === "conflict"
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {movement.syncStatus}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <label className="grid min-w-0 flex-1 gap-1 text-sm font-semibold text-slate-950">
              <span className="text-xs font-medium text-slate-500">Action</span>
              <span className="relative">
                <select
                  className="h-10 w-full appearance-none rounded-md border border-slate-300 bg-white px-3 pr-9 text-sm font-semibold outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  onChange={(event) =>
                    setSidePanel(event.target.value as InventorySidePanel)
                  }
                  value={sidePanel}
                >
                  <option value="stock_adjustment">Stock Adjustment</option>
                  <option value="add_product">Add Product</option>
                  <option value="product_availability">
                    Product Availability
                  </option>
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  size={16}
                />
              </span>
            </label>
            <button
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950"
              onClick={() => void refreshInventory()}
              type="button"
            >
              <RefreshCcw size={16} />
            </button>
          </div>
          <div className="mt-2 text-xs text-slate-500">{branch.name}</div>

          {sidePanel === "stock_adjustment" ? (
            <>
              <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
                Product
                <select
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  value={selectedProduct?.id ?? ""}
                >
                  {productsWithBalances.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.sku} / {product.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setMovementType("adjustment_plus")}
                  type="button"
                  variant={
                    movementType === "adjustment_plus" ? "primary" : "secondary"
                  }
                >
                  <Plus size={16} aria-hidden="true" />
                  Add
                </Button>
                <Button
                  onClick={() => setMovementType("adjustment_minus")}
                  type="button"
                  variant={
                    movementType === "adjustment_minus"
                      ? "primary"
                      : "secondary"
                  }
                >
                  <Minus size={16} aria-hidden="true" />
                  Remove
                </Button>
              </div>

              <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
                Quantity
                <input
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  min={1}
                  onChange={(event) =>
                    setQuantity(Number(event.target.value || 0))
                  }
                  type="number"
                  value={quantity}
                />
              </label>

              <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
                Reason
                <select
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  onChange={(event) => setReasonCode(event.target.value)}
                  value={reasonCode}
                >
                  {reasonOptions.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
                Notes
                <textarea
                  className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  onChange={(event) => setNotes(event.target.value)}
                  value={notes}
                />
              </label>

              <Button
                className="mt-4 w-full"
                disabled={
                  isSaving || !selectedProduct || adjustmentWouldUnderflow
                }
                onClick={handleAdjustment}
                type="button"
              >
                {isSaving ? "Saving..." : "Save Adjustment"}
              </Button>
            </>
          ) : sidePanel === "add_product" ? (
            <>
              <div className="mt-4 text-sm font-semibold text-slate-950">
                Add Product
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Create a central product with branch price and opening stock.
              </div>

              <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
                SKU
                <input
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  onChange={(event) =>
                    setNewProduct((current) => ({
                      ...current,
                      sku: event.target.value,
                    }))
                  }
                  value={newProduct.sku}
                />
              </label>

              <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
                Name
                <input
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  onChange={(event) =>
                    setNewProduct((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  value={newProduct.name}
                />
              </label>

              <div className="mt-4 grid min-w-0 grid-cols-2 gap-2">
                <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-700">
                  Barcode
                  <input
                    className="h-10 w-full min-w-0 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    onChange={(event) =>
                      setNewProduct((current) => ({
                        ...current,
                        barcode: event.target.value,
                      }))
                    }
                    value={newProduct.barcode}
                  />
                </label>
                <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-700">
                  Unit
                  <input
                    className="h-10 w-full min-w-0 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    onChange={(event) =>
                      setNewProduct((current) => ({
                        ...current,
                        unit: event.target.value,
                      }))
                    }
                    value={newProduct.unit}
                  />
                </label>
              </div>

              <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
                Price
                <input
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  min={0}
                  onChange={(event) =>
                    setNewProduct((current) => ({
                      ...current,
                      sellingPrice: Number(event.target.value || 0),
                    }))
                  }
                  type="number"
                  value={newProduct.sellingPrice}
                />
              </label>
              <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
                Stock
                <input
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  min={0}
                  onChange={(event) =>
                    setNewProduct((current) => ({
                      ...current,
                      openingStock: Number(event.target.value || 0),
                    }))
                  }
                  type="number"
                  value={newProduct.openingStock}
                />
              </label>
              <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
                Min
                <input
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  min={0}
                  onChange={(event) =>
                    setNewProduct((current) => ({
                      ...current,
                      minimumStockThreshold: Number(event.target.value || 0),
                    }))
                  }
                  type="number"
                  value={newProduct.minimumStockThreshold}
                />
              </label>

              <div className="mt-4">
                <Button
                  className="w-full"
                  disabled={isCreatingProduct}
                  onClick={handleCreateProduct}
                  type="button"
                >
                  {isCreatingProduct ? "Creating..." : "Create Product"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mt-4 text-sm font-semibold text-slate-950">
                Product Availability
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Active products are shown in POS. Removed products stay in the
                database.
              </div>

              <div className="mt-4 grid max-h-72 gap-2 overflow-auto pr-1">
                {availabilityProducts.map((product) => (
                  <button
                    className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                      selectedAvailabilityProduct?.id === product.id
                        ? "border-slate-500 bg-slate-100"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                    key={product.id}
                    onClick={() => {
                      setSelectedAvailabilityProductId(product.id);
                      fillProductForm({
                        sku: product.sku,
                        barcode: product.barcode,
                        name: product.name,
                        unit: product.unit,
                      });
                    }}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-950">
                          {product.name}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-slate-500">
                          {product.sku} / {product.categoryName}
                        </div>
                      </div>
                      <Badge tone={product.isActive ? "success" : "warning"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  disabled={
                    isUpdatingAvailability ||
                    !selectedAvailabilityProduct ||
                    selectedAvailabilityProduct.isActive
                  }
                  onClick={handleActivateProduct}
                  type="button"
                >
                  Activate Product
                </Button>
                <Button
                  disabled={
                    isUpdatingAvailability ||
                    !selectedAvailabilityProduct ||
                    !selectedAvailabilityProduct.isActive
                  }
                  onClick={handleDeactivateProduct}
                  type="button"
                  variant="secondary"
                >
                  Remove Product
                </Button>
              </div>
            </>
          )}

          {message ? (
            <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {message}
            </div>
          ) : null}
        </aside>
      </div>
    </WorkspacePanel>
  );
}

function StockAlertSummary({
  lowStock,
  notifications,
  outOfStock,
}: {
  lowStock: number;
  notifications: StockNotification[];
  outOfStock: number;
}) {
  if (notifications.length === 0) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        All local products are above the minimum threshold. Continue monitoring
        stock movements after each adjustment.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <AlertTriangle
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-amber-700"
            size={18}
          />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-amber-950">
              Smart stock notifications
            </div>
            <div className="mt-1 text-sm text-amber-800">
              {outOfStock} out of stock, {lowStock} low stock. Adjust stock or
              prepare replenishment before checkout demand increases.
            </div>
          </div>
        </div>
        <Badge tone={outOfStock > 0 ? "danger" : "warning"}>
          {notifications.length} alerts
        </Badge>
      </div>

      <div className="mt-3 grid gap-2">
        {notifications.slice(0, 5).map((notification) => (
          <div
            className="grid gap-2 rounded-md border border-white/70 bg-white/80 px-3 py-2 text-sm md:grid-cols-[minmax(0,1fr)_auto]"
            key={`${notification.source}-${notification.productId}`}
          >
            <div className="min-w-0">
              <div className="truncate font-medium text-slate-950">
                {notification.name}
              </div>
              <div className="mt-0.5 text-xs text-slate-600">
                {notification.sku} / {notification.branchName}
              </div>
            </div>
            <div className="text-left font-mono text-xs text-slate-700 md:text-right">
              {notification.quantityOnHand} / min {notification.threshold}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}
