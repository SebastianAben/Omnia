"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button } from "@omnia/ui";
import { AlertTriangle, Minus, Plus, RefreshCcw } from "lucide-react";

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
  loadFallbackCatalog,
  loadPosCatalog,
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

export function InventoryPanel() {
  const branch = useAppState((state) => state.branch);
  const token = useAppState((state) => state.token);
  const user = useAppState((state) => state.user);
  const setPendingSyncCount = useAppState((state) => state.setPendingSyncCount);
  const [products, setProducts] = useState<PosProduct[]>([]);
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
    const [catalogResult, localBalances, localMovements, queue] =
      await Promise.all([
        token
          ? loadPosCatalog(branch.id, token).catch(() => [])
          : loadFallbackCatalog(),
        listLocalInventoryBalances().catch(() => []),
        listLocalStockMovements().catch(() => []),
        listLocalSyncQueue().catch(() => []),
      ]);

    setProducts(catalogResult);
    setBalances(localBalances);
    setMovements(localMovements);
    setSelectedProductId((current) => current || catalogResult[0]?.id || "");
    setPendingSyncCount(
      queue.filter((item) => ["pending", "queued"].includes(item.status))
        .length,
    );
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
        error instanceof Error
          ? error.message
          : "Penyesuaian stok gagal disimpan.",
      );
    } finally {
      setSaving(false);
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
                {productsWithBalances.map((product) => {
                  const stockStatus = getStockNotificationType({
                    stockOnHand: product.stockOnHand,
                    minimumQuantity: product.minimumQuantity,
                  });

                  return (
                    <tr
                      className="cursor-pointer hover:bg-slate-50"
                      key={product.id}
                      onClick={() => setSelectedProductId(product.id)}
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
            <div>
              <div className="text-sm font-semibold text-slate-950">
                Stock adjustment
              </div>
              <div className="mt-1 text-xs text-slate-500">{branch.name}</div>
            </div>
            <button
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950"
              onClick={() => void refreshInventory()}
              type="button"
            >
              <RefreshCcw size={16} />
            </button>
          </div>

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
                movementType === "adjustment_minus" ? "primary" : "secondary"
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
              onChange={(event) => setQuantity(Number(event.target.value || 0))}
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
            disabled={isSaving || !selectedProduct || adjustmentWouldUnderflow}
            onClick={handleAdjustment}
            type="button"
          >
            {isSaving ? "Saving..." : "Save Adjustment"}
          </Button>

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
        Semua produk lokal berada di atas ambang minimum. Continue monitoring
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
              {outOfStock} out of stock, {lowStock} low stock.
              {" "}Adjust stock or prepare replenishment before checkout demand
              increases.
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
