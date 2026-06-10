"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button } from "@omnia/ui";
import { Minus, Plus, Search, Trash2 } from "lucide-react";

import { InlineFeedback } from "@/components/ui-state";
import {
  listLocalSyncQueue,
  saveCheckoutLocally,
} from "@/features/local-first/local-checkout-repository";
import { useAppState } from "@/lib/app-state";
import {
  buildStockNotifications,
  getStockNotificationType,
  summarizeStockNotifications,
} from "@/features/inventory/stock-notifications";
import { getCheckoutGuardMessage } from "@/features/uat/operational-copy";
import { useCartStore } from "./cart-store";
import { loadFallbackCatalog, loadPosCatalog } from "./product-service";
import type { PaymentMethod, PaymentStatus } from "./pos-types";
import {
  calculateCartTotals,
  findExactCatalogMatch,
  formatRupiah,
  getCatalogSearchResult,
} from "./pos-utils";

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

const catalogResultLimit = 24;

export function PosWorkspace() {
  const [query, setQuery] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [catalogMessage, setCatalogMessage] = useState<string | null>(null);
  const [isCheckingOut, setCheckingOut] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
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
  const setProductQuantity = useCartStore((state) => state.setProductQuantity);
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
    () => (token ? (catalogQuery.data ?? []) : loadFallbackCatalog()),
    [catalogQuery.data, token],
  );
  const catalogResult = useMemo(
    () => getCatalogSearchResult(products, query, { limit: catalogResultLimit }),
    [products, query],
  );
  const visibleProducts = catalogResult.items;
  const visibleStockNotifications = useMemo(
    () =>
      buildStockNotifications(
        visibleProducts.map((product) => ({
          id: product.id,
          sku: product.sku,
          name: product.name,
          branchName: branch.name,
          quantityOnHand: product.stockOnHand,
          threshold: product.minimumQuantity,
          source: "local",
        })),
      ),
    [branch.name, visibleProducts],
  );
  const visibleStockSummary = useMemo(
    () => summarizeStockNotifications(visibleStockNotifications),
    [visibleStockNotifications],
  );
  const totals = useMemo(() => calculateCartTotals(lines), [lines]);
  const canCheckout = shiftStatus === "open" && Boolean(activeShiftId);

  const handleCheckout = useCallback(async () => {
    if (!canCheckout) {
      setCheckoutMessage(getCheckoutGuardMessage("shift_closed"));
      return;
    }

    if (lines.length === 0) {
      setCheckoutMessage(getCheckoutGuardMessage("cart_empty"));
      return;
    }

    if (paymentStatus === "paid" && amountReceived < totals.grandTotal) {
      setCheckoutMessage(getCheckoutGuardMessage("payment_insufficient"));
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
        `${result.transactionNo} saved locally. Review Sync Status when ready to replay event ${result.eventId}.`,
      );
    } catch (error) {
      setCheckoutMessage(
        error instanceof Error
          ? error.message
          : "Transaksi gagal disimpan secara lokal.",
      );
    } finally {
      setCheckingOut(false);
    }
  }, [
    activeShiftId,
    amountReceived,
    branch,
    canCheckout,
    clearCart,
    lines,
    paymentStatus,
    register,
    selectedPaymentMethod,
    setPendingSyncCount,
    totals,
    user,
  ]);

  const handleExactSearchAdd = useCallback(() => {
    const exactMatch = findExactCatalogMatch(products, query);

    if (!exactMatch) {
      setCatalogMessage(
        query.trim()
          ? "Tidak ada satu barcode atau SKU yang cocok persis."
          : null,
      );
      return;
    }

    const existingQuantity =
      lines.find((line) => line.product.id === exactMatch.id)?.quantity ?? 0;

    if (exactMatch.stockOnHand <= 0) {
      setCatalogMessage(`${exactMatch.name} sedang habis stok.`);
      return;
    }

    if (existingQuantity >= exactMatch.stockOnHand) {
      setCatalogMessage(
        `${exactMatch.name} sudah mencapai stok tersedia (${exactMatch.stockOnHand}).`,
      );
      return;
    }

    addProduct(exactMatch);
    setQuery("");
    setCatalogMessage(`${exactMatch.name} ditambahkan ke cart.`);
    window.requestAnimationFrame(() => searchInputRef.current?.focus());
  }, [addProduct, lines, products, query]);

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    handleExactSearchAdd();
  };

  const handleClearCart = useCallback(() => {
    if (lines.length === 0) {
      return;
    }

    if (window.confirm("Kosongkan cart saat ini?")) {
      clearCart();
      setCheckoutMessage(null);
      searchInputRef.current?.focus();
    }
  }, [clearCart, lines.length]);

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      const target = event.target;
      const isEditableTarget =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

      if (event.altKey) {
        const optionIndex = Number(event.key) - 1;
        const option = paymentOptions[optionIndex];

        if (option) {
          event.preventDefault();
          setPaymentMethod(option.value);
        }

        return;
      }

      if (!isEditableTarget && event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (event.key === "F2") {
        event.preventDefault();
        void handleCheckout();
        return;
      }

      if (event.key === "F3") {
        event.preventDefault();
        handleClearCart();
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () => window.removeEventListener("keydown", handleShortcut);
  }, [handleCheckout, handleClearCart, setPaymentMethod]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_410px]">
      <section className="min-w-0 overflow-hidden rounded-3xl border border-line/80 bg-white/88 shadow-panel backdrop-blur-xl">
        <div className="border-b border-line/70 bg-gradient-to-br from-white via-white to-slate-50 px-5 py-5 md:px-6">
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  tone={token && catalogQuery.isError ? "warning" : "success"}
                >
                  {token
                    ? catalogQuery.isError
                      ? "Catalog unavailable"
                      : "API catalog"
                    : "Demo catalog"}
                </Badge>
                <Badge tone={canCheckout ? "success" : "warning"}>
                  Shift {shiftStatus}
                </Badge>
              </div>
              <h1 className="mt-4 max-w-5xl text-3xl font-semibold leading-none tracking-[-0.055em] text-slate-950 md:text-5xl">
                Transaksi POS
              </h1>
              <p className="mt-3 max-w-[62ch] text-sm leading-6 text-slate-600">
                Cari produk, atur jumlah dan diskon item, pilih pembayaran, lalu
                simpan transaksi ke antrean lokal.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-6">
          <label className="relative block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Cari produk
            </span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3.5 left-4 text-slate-400"
              size={18}
            />
            <input
              className="h-12 w-full rounded-2xl border border-line bg-white pl-11 pr-4 text-base text-slate-950 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200/70"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Scan barcode, SKU, atau nama produk"
              ref={searchInputRef}
              value={query}
            />
          </label>

          {catalogMessage ? (
            <div className="mt-3 rounded-2xl border border-line bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {catalogMessage}
            </div>
          ) : null}

          {token && catalogQuery.isLoading ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonProduct key={index} />
              ))}
            </div>
          ) : token && catalogQuery.isError ? (
            <CatalogState message="Katalog cabang tidak tersedia. Checkout dinonaktifkan sampai master data valid berhasil dimuat." />
          ) : visibleProducts.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-line bg-slate-50 px-5 py-12 text-center">
              <div className="text-base font-semibold text-slate-950">
                Produk tidak ditemukan
              </div>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
                Coba SKU, barcode, kategori, atau nama produk lain.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                <span>
                  Menampilkan {visibleProducts.length} dari{" "}
                  {catalogResult.totalCount} produk.
                </span>
                {catalogResult.hasMore ? (
                  <span className="font-medium text-slate-800">
                    Persempit pencarian untuk hasil lainnya.
                  </span>
                ) : null}
              </div>

              {visibleStockSummary.total > 0 ? (
                <InlineFeedback className="mt-3" tone="warning">
                  {visibleStockSummary.outOfStock} out of stock,{" "}
                  {visibleStockSummary.lowStock} low stock dalam hasil yang
                  tampil.
                </InlineFeedback>
              ) : null}

              <div className="mt-3 grid-flow-dense grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {visibleProducts.map((product) => {
                  const stockStatus = getStockNotificationType({
                    stockOnHand: product.stockOnHand,
                    minimumQuantity: product.minimumQuantity,
                  });

                  return (
                    <article
                      className="group relative grid min-h-44 overflow-hidden rounded-3xl border border-line/80 bg-slate-50/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lift"
                      key={product.id}
                    >
                      <div className="min-w-0 pr-[4.75rem]">
                        <div className="truncate text-base font-semibold tracking-[-0.02em] text-slate-950">
                          {product.name}
                        </div>
                        <div className="mt-1 truncate text-xs font-medium text-slate-500">
                          {product.sku} / {product.categoryName}
                        </div>
                      </div>

                      <Badge
                        className="absolute right-4 top-4 max-w-[4.25rem] justify-center"
                        tone={
                          stockStatus === "out_of_stock"
                            ? "danger"
                            : stockStatus === "low_stock"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        <span className="truncate">
                          {stockStatus === "out_of_stock"
                            ? "Out"
                            : stockStatus === "low_stock"
                              ? "Low"
                              : `${product.stockOnHand} ${product.unit}`}
                        </span>
                      </Badge>

                      <div className="mt-auto grid grid-cols-[minmax(0,1fr)_6.25rem] items-end gap-3 pt-6">
                        <div className="min-w-0">
                          <div className="font-mono text-lg font-semibold tracking-[-0.03em] text-slate-950">
                            {formatRupiah(product.price)}
                          </div>
                          <div className="mt-1 truncate text-xs text-slate-500">
                            Stok {product.stockOnHand} / min{" "}
                            {product.minimumQuantity}
                          </div>
                        </div>
                        <Button
                          className="h-10 w-full px-3"
                          disabled={product.stockOnHand <= 0}
                          onClick={() => {
                            addProduct(product);
                            searchInputRef.current?.focus();
                          }}
                          type="button"
                          variant="secondary"
                        >
                          <Plus size={16} aria-hidden="true" />
                          Tambah
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      <aside className="h-fit rounded-3xl border border-line/80 bg-white/92 p-5 shadow-panel backdrop-blur-xl lg:sticky lg:top-20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
              Cart
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {register.name} / {branch.name}
            </p>
          </div>
          <Badge tone={totals.itemCount > 0 ? "success" : "neutral"}>
            {totals.itemCount} items
          </Badge>
          <button
            aria-label="Kosongkan cart"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={lines.length === 0}
            onClick={handleClearCart}
            title="Kosongkan cart"
            type="button"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="mt-5 grid max-h-[36dvh] gap-3 overflow-auto pr-1">
          {lines.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line bg-slate-50 px-4 py-10 text-center">
              <div className="text-sm font-semibold text-slate-950">
                Cart kosong
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Tambahkan produk dari katalog atau scan barcode.
              </p>
            </div>
          ) : (
            lines.map((line) => (
              <div
                className="rounded-2xl border border-line/80 bg-white p-3 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.45)]"
                key={line.product.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-950">
                      {line.product.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {line.product.sku} / {formatRupiah(line.product.price)}
                    </div>
                  </div>
                  <button
                    aria-label={`Remove ${line.product.name}`}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                    onClick={() => removeProduct(line.product.id)}
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="inline-flex items-center rounded-xl border border-line bg-slate-50 p-1">
                    <Button
                      className="h-8 w-8 rounded-lg px-0"
                      onClick={() => decrementProduct(line.product.id)}
                      type="button"
                      variant="ghost"
                    >
                      <Minus size={14} aria-hidden="true" />
                    </Button>
                    <span className="w-9 text-center font-mono text-sm font-semibold">
                      {line.quantity}
                    </span>
                    <Button
                      className="h-8 w-8 rounded-lg px-0"
                      disabled={line.quantity >= line.product.stockOnHand}
                      onClick={() => {
                        addProduct(line.product);
                        searchInputRef.current?.focus();
                      }}
                      type="button"
                      variant="ghost"
                    >
                      <Plus size={14} aria-hidden="true" />
                    </Button>
                  </div>
                  <label className="sr-only" htmlFor={`quantity-${line.product.id}`}>
                    Jumlah {line.product.name}
                  </label>
                  <input
                    className="h-9 w-16 rounded-xl border border-line bg-white px-2 text-center font-mono text-sm font-semibold text-slate-950 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200/70"
                    id={`quantity-${line.product.id}`}
                    inputMode="numeric"
                    min={1}
                    max={line.product.stockOnHand}
                    onChange={(event) =>
                      setProductQuantity(
                        line.product.id,
                        Number(event.target.value || 1),
                      )
                    }
                    type="number"
                    value={line.quantity}
                  />
                  <div className="font-mono text-sm font-semibold text-slate-950">
                    {formatRupiah(
                      line.product.price * line.quantity - line.discountTotal,
                    )}
                  </div>
                </div>
                <label className="mt-3 grid gap-1.5 text-xs font-semibold text-slate-600">
                  Diskon item
                  <input
                    className="h-9 rounded-xl border border-line bg-white px-3 font-mono text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200/70"
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

        <div className="mt-5 rounded-3xl bg-slate-950 p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          <div className="grid gap-2 text-sm">
            <ReceiptRow
              label="Subtotal"
              value={formatRupiah(totals.subtotal)}
            />
            <ReceiptRow
              label="Discount"
              value={formatRupiah(totals.discountTotal)}
            />
            <ReceiptRow
              label="Pajak 11%"
              value={formatRupiah(totals.taxTotal)}
            />
          </div>
          <div className="mt-4 border-t border-white/12 pt-4">
            <div className="flex justify-between gap-3">
              <span className="text-sm text-slate-300">Total</span>
              <span className="font-mono text-2xl font-semibold tracking-[-0.04em]">
                {formatRupiah(totals.grandTotal)}
              </span>
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

        <label className="mt-4 grid gap-1.5 text-sm font-semibold text-slate-700">
          Uang diterima
          <input
            className="h-11 rounded-2xl border border-line bg-white px-3 font-mono text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200/70"
            min={0}
            onChange={(event) =>
              setAmountReceived(Number(event.target.value || 0))
            }
            type="number"
            value={amountReceived}
          />
        </label>

        <div className="mt-3 flex justify-between text-sm">
          <span className="text-slate-600">Kembalian</span>
          <span className="font-mono font-semibold text-slate-950">
            {formatRupiah(Math.max(amountReceived - totals.grandTotal, 0))}
          </span>
        </div>

        <Button
          className="mt-5 h-12 w-full rounded-2xl"
          disabled={isCheckingOut || !canCheckout}
          onClick={handleCheckout}
          type="button"
        >
          {isCheckingOut ? "Menyimpan..." : "Simpan transaksi"}
        </Button>

        {!canCheckout ? (
          <InlineFeedback className="mt-3" tone="warning">
            {getCheckoutGuardMessage("shift_closed")}
          </InlineFeedback>
        ) : null}

        {checkoutMessage ? (
          <InlineFeedback
            className="mt-3"
            tone={
              checkoutMessage.includes("saved locally") ? "success" : "warning"
            }
          >
            {checkoutMessage}
          </InlineFeedback>
        ) : null}
      </aside>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-300">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}

function SkeletonProduct() {
  return (
    <div className="relative min-h-44 overflow-hidden rounded-3xl border border-line/80 bg-slate-100 p-4">
      <div className="h-5 w-2/3 rounded-lg bg-slate-200" />
      <div className="mt-3 h-4 w-1/2 rounded-lg bg-slate-200" />
      <div className="mt-16 h-6 w-24 rounded-lg bg-slate-200" />
      <div className="absolute inset-y-0 left-0 w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}

function CatalogState({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-3xl border border-dashed border-line bg-slate-50 px-5 py-12 text-center text-sm leading-6 text-slate-600">
      {message}
    </div>
  );
}
