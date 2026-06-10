import assert from "node:assert/strict";
import test from "node:test";

import { calculateShiftReconciliation } from "../electron/shift-reconciliation";

test("calculateShiftReconciliation uses opening cash when there are no transactions", () => {
  const result = calculateShiftReconciliation({
    openingCash: 100000,
    closingCash: 95000,
    paidPayments: [],
    pendingTransactions: [],
  });

  assert.deepEqual(result, {
    totalSales: 0,
    cashPayments: 0,
    nonCashPayments: 0,
    openingCash: 100000,
    expectedCash: 100000,
    closingCash: 95000,
    variance: -5000,
    pendingCount: 0,
    pendingTotal: 0,
  });
});

test("calculateShiftReconciliation separates cash and non-cash paid payments", () => {
  const result = calculateShiftReconciliation({
    openingCash: 50000,
    closingCash: 180000,
    paidPayments: [
      { method: "cash", amount: 100000 },
      { method: "qris", amount: 75000 },
      { method: "debit", amount: 25000 },
    ],
    pendingTransactions: [{ total: 40000 }, { total: 10000 }],
  });

  assert.deepEqual(result, {
    totalSales: 200000,
    cashPayments: 100000,
    nonCashPayments: 100000,
    openingCash: 50000,
    expectedCash: 150000,
    closingCash: 180000,
    variance: 30000,
    pendingCount: 2,
    pendingTotal: 50000,
  });
});
