"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button } from "@omnia/ui";
import { Minus, Plus, Search, Trash2 } from "lucide-react";

import { WorkspacePanel } from "@/components/app-shell";
import {
  listLocalSyncQueue,
  saveCheckoutLocally,
} from "@/features/local-first/local-checkout-repository";
import { useAppState } from "@/lib/app-state";
import { useCartStore } from "./cart-store";
import { loadFallbackCatalog, loadPosCatalog } from "./product-service";
import type { PaymentMethod, PaymentStatus } from "./pos-types";
import { calculateCartTotals, filterCatalog, formatRupiah } from "./pos-utils";

const paymentOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "cash", label: "Cash" },
  { value: "transfer", label: "Transfer" },
  { value: "qris", label: "QRIS" },
  { value: "debit", label: "Debit" },
];

const paymentStatusOptions: Array<{ value: PaymentStatus; label: string }> = [
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
];

export function PosWorkspace() {
  const [query, setQuery] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [isCheckingOut, setCheckingOut] = useState(false);
  const branch = useAppState((state) => state.branch);
  const token = useAppState((state) => state.token);
  const register = useAppState((state) => state.register);
  const user = useAppState((state) => state.user);
  const activeShiftId = useAppState((state) => state.activeShiftId);
  const shiftStatus = useAppState((state) => state.shiftStatus);
  const setPendingSyncCount = useAppState((state) => state.setPendingSyncCount);
  const lines = useCartStore((state) => state.lines);
  const addProduct = useCartStore((state) => state.addProduct);
  const decrementProduct = useCartStore((state) => state.decrementProduct);
  const removeProduct = useCartStore((state) => state.removeProduct);
  const clearCart = useCartStore((state) => state.clearCart);
  const setLineDiscount = useCartStore((state) => state.setLineDiscount);
  const selectedPaymentMethod = useCartStore(
    (state) => state.selectedPaymentMethod,
  );
  const setPaymentMethod = useCartStore((state) => state.setPaymentMethod);
  const paymentStatus = useCartStore((state) => state.paymentStatus);
  const setPaymentStatus = useCartStore((state) => state.setPaymentStatus);
  const amountReceived = useCartStore((state) => state.amountReceived);
  const setAmountReceived = useCartStore((state) => state.setAmountReceived);

  const catalogQuery = useQuery({
    queryKey: ["pos-catalog", branch.id, token],
    queryFn: () => loadPosCatalog(branch.id, token!),
    enabled: Boolean(token),
    retry: 1,
  });

  const products = useMemo(
    () => (token ? catalogQuery.data ?? [] : loadFallbackCatalog()),
    [catalogQuery.data, token],
  );
  const filteredProducts = useMemo(
    () => filterCatalog(products, query),
    [products, query],
  );
  const totals = useMemo(() => calculateCartTotals(lines), [lines]);
  const canCheckout = shiftStatus === "open" && Boolean(activeShiftId);

  const handleCheckout = async () => {
    if (!canCheckout) {
      setCheckoutMessage("Open a shift before saving checkout.");
      return;
    }

    if (lines.length === 0) {
      setCheckoutMessage("Cart is empty.");
      return;
    }

    if (paymentStatus === "paid" && amountReceived < totals.grandTotal) {
      setCheckoutMessage("Amount received is lower than total.");
      return;
    }

    setCheckingOut(true);
    try {
      const result = await saveCheckoutLocally({
        branch,
        register,
        user,
        shiftId: activeShiftId,
        lines,
        totals,
        paymentMethod: selectedPaymentMethod,
        paymentStatus,
        amountReceived,
      });
      const queue = await listLocalSyncQueue();
      setPendingSyncCount(
        queue.filter((item) => ["pending", "queued"].includes(item.status))
          .length,
      );
      clearCart();
      setCheckoutMessage(
        `${result.transactionNo} saved to SQLite and queued as ${result.eventId}.`,
      );
    } catch (error) {
      setCheckoutMessage(
        error instanceof Error
          ? error.message
          : "Failed to save checkout locally.",
      );
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <WorkspacePanel
        badge={
          token
            ? catalogQuery.isError
              ? "Catalog unavailable"
              : "API catalog"
            : "Demo catalog"
        }
        description="Fast cashier workspace with product lookup, local cart state, payment confirmation, and checkout queue write."
        title="POS Checkout"
      >
        <div className="grid gap-4">
          <label className="relative block">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-3.5 text-slate-400"
              size={18}
            />
            <input
              className="h-12 w-full rounded-md border border-slate-300 pl-11 pr-4 text-base outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Scan barcode, SKU, or product name"
              value={query}
            />
          </label>

          <div className="grid gap-2">
            {token && catalogQuery.isLoading ? (
              <CatalogState message="Loading branch catalog..." />
            ) : null}
            {token && catalogQuery.isError ? (
              <CatalogState message="Branch catalog is unavailable. Checkout is disabled until valid master data is loaded." />
            ) : null}
            {!catalogQuery.isLoading &&
            !catalogQuery.isError &&
            filteredProducts.length === 0 ? (
              <CatalogState message="No priced product matches this branch and search." />
            ) : null}
            {filteredProducts.map((product) => {
              const isLowStock = product.stockOnHand <= product.minimumQuantity;

              return (
                <div
                  className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                  key={product.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-950">
                        {product.name}
                      </span>
                      <Badge tone={isLowStock ? "warning" : "neutral"}>
                        {product.stockOnHand} {product.unit}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {product.sku} / {product.categoryName} /{" "}
                      {formatRupiah(product.price)}
                    </div>
                  </div>
                  <Button
                    className="h-9 px-3"
                    disabled={product.stockOnHand <= 0}
                    onClick={() => addProduct(product)}
                    type="button"
                    variant="secondary"
                  >
                    <Plus size={16} aria-hidden="true" />
                    Add
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </WorkspacePanel>

      <aside className="rounded-md border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-950">Cart</h2>
          <Badge tone={totals.itemCount > 0 ? "success" : "neutral"}>
            {totals.itemCount} items
          </Badge>
        </div>

        <div className="mt-4 grid gap-3">
          {lines.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 px-3 py-8 text-center text-sm text-slate-500">
              No item selected
            </div>
          ) : (
            lines.map((line) => (
              <div
                className="rounded-md border border-slate-200 p-3"
                key={line.product.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-950">
                      {line.product.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {line.product.sku} / {formatRupiah(line.product.price)}{" "}
                      each
                    </div>
                  </div>
                  <button
                    aria-label={`Remove ${line.product.name}`}
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => removeProduct(line.product.id)}
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      className="h-8 w-8 px-0"
                      onClick={() => decrementProduct(line.product.id)}
                      type="button"
                      variant="secondary"
                    >
                      <Minus size={14} aria-hidden="true" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {line.quantity}
                    </span>
                    <Button
                      className="h-8 w-8 px-0"
                      disabled={line.quantity >= line.product.stockOnHand}
                      onClick={() => addProduct(line.product)}
                      type="button"
                      variant="secondary"
                    >
                      <Plus size={14} aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="text-sm font-semibold text-slate-950">
                    {formatRupiah(
                      line.product.price * line.quantity - line.discountTotal,
                    )}
                  </div>
                </div>
                <label className="mt-3 grid gap-1 text-xs font-medium text-slate-600">
                  Item discount
                  <input
                    className="h-8 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                    min={0}
                    onChange={(event) =>
                      setLineDiscount(
                        line.product.id,
                        Number(event.target.value || 0),
                      )
                    }
                    type="number"
                    value={line.discountTotal}
                  />
                </label>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span>{formatRupiah(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Discount</span>
            <span>{formatRupiah(totals.discountTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Tax 11%</span>
            <span>{formatRupiah(totals.taxTotal)}</span>
          </div>
          <div className="border-t border-slate-200 pt-3">
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatRupiah(totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {paymentOptions.map((option) => (
            <Button
              className="px-2"
              key={option.value}
              onClick={() => setPaymentMethod(option.value)}
              type="button"
              variant={
                selectedPaymentMethod === option.value ? "primary" : "secondary"
              }
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {paymentStatusOptions.map((option) => (
            <Button
              className="px-2"
              key={option.value}
              onClick={() => setPaymentStatus(option.value)}
              type="button"
              variant={paymentStatus === option.value ? "primary" : "secondary"}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <label className="mt-3 grid gap-1 text-sm font-medium text-slate-700">
          Amount received
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            min={0}
            onChange={(event) =>
              setAmountReceived(Number(event.target.value || 0))
            }
            type="number"
            value={amountReceived}
          />
        </label>

        <div className="mt-2 flex justify-between text-sm">
          <span className="text-slate-600">Change</span>
          <span className="font-medium">
            {formatRupiah(Math.max(amountReceived - totals.grandTotal, 0))}
          </span>
        </div>

        <Button
          className="mt-4 w-full"
          disabled={isCheckingOut || !canCheckout}
          onClick={handleCheckout}
          type="button"
        >
          {isCheckingOut ? "Saving..." : "Save Checkout"}
        </Button>

        {!canCheckout ? (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Open a shift before saving checkout.
          </div>
        ) : null}

        {checkoutMessage ? (
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {checkoutMessage}
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function CatalogState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
      {message}
    </div>
  );
}
