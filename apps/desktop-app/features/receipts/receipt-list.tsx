"use client";

import { useEffect, useState } from "react";
import { Badge } from "@omnia/ui";

import { WorkspacePanel } from "@/components/app-shell";
import { UiStatePanel } from "@/components/ui-state";
import {
  listLocalTransactions,
  type LocalTransactionRecord,
} from "@/features/local-first/local-checkout-repository";
import { formatRupiah } from "@/features/pos/pos-utils";

export function ReceiptList() {
  const [transactions, setTransactions] = useState<LocalTransactionRecord[]>(
    [],
  );

  useEffect(() => {
    void listLocalTransactions().then(setTransactions).catch(() => {
      setTransactions([]);
    });
  }, []);

  return (
    <WorkspacePanel
      badge="Receipt preview"
      description="Compact local receipt history for transactions saved on this register."
      title="Receipts"
    >
      <div className="grid gap-3">
        {transactions.length === 0 ? (
          <UiStatePanel className="border-dashed text-center">
            No local receipt yet. Complete a checkout on this register to see
            receipt preview and sync status here.
          </UiStatePanel>
        ) : (
          transactions.map((transaction) => (
            <article
              className="rounded-md border border-slate-200 bg-slate-50 p-4"
              key={transaction.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-950">
                    {transaction.transactionNo}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {new Date(transaction.createdAt).toLocaleString("id-ID")} /{" "}
                    {transaction.paymentMethod.toUpperCase()}
                  </div>
                </div>
                <Badge
                  tone={
                    transaction.syncStatus === "synced"
                      ? "success"
                      : transaction.syncStatus === "failed" ||
                          transaction.syncStatus === "conflict"
                        ? "danger"
                        : "warning"
                  }
                >
                  {transaction.syncStatus}
                </Badge>
              </div>

              <div className="mt-4 grid gap-2 text-sm">
                {transaction.lines.map((line) => (
                  <div
                    className="flex justify-between gap-3"
                    key={`${transaction.id}-${line.product.id}`}
                  >
                    <span className="text-slate-600">
                      {line.quantity} x {line.product.sku} {line.product.name}
                    </span>
                    <span className="font-medium">
                      {formatRupiah(
                        line.product.price * line.quantity - line.discountTotal,
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-slate-200 pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span>{formatRupiah(transaction.totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Discount</span>
                  <span>{formatRupiah(transaction.totals.discountTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tax</span>
                  <span>{formatRupiah(transaction.totals.taxTotal)}</span>
                </div>
                <div className="mt-2 flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatRupiah(transaction.totals.grandTotal)}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-slate-600">Received</span>
                  <span>{formatRupiah(transaction.amountReceived)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Change</span>
                  <span>
                    {formatRupiah(
                      Math.max(
                        transaction.amountReceived -
                          transaction.totals.grandTotal,
                        0,
                      ),
                    )}
                  </span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </WorkspacePanel>
  );
}
