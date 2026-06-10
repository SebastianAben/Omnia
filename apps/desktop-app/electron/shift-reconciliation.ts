export type ShiftReconciliationPayment = {
  method: string;
  amount: number;
};

export type ShiftReconciliationPendingTransaction = {
  total: number;
};

export type ShiftReconciliationInput = {
  openingCash: number;
  closingCash: number;
  paidPayments: ShiftReconciliationPayment[];
  pendingTransactions: ShiftReconciliationPendingTransaction[];
};

export type ShiftReconciliationSummary = {
  totalSales: number;
  cashPayments: number;
  nonCashPayments: number;
  openingCash: number;
  expectedCash: number;
  closingCash: number;
  variance: number;
  pendingCount: number;
  pendingTotal: number;
};

const toFiniteAmount = (value: number) =>
  Number.isFinite(value) ? Math.round(value) : 0;

export function calculateShiftReconciliation(
  input: ShiftReconciliationInput,
): ShiftReconciliationSummary {
  const openingCash = toFiniteAmount(input.openingCash);
  const closingCash = toFiniteAmount(input.closingCash);
  const cashPayments = input.paidPayments
    .filter((payment) => payment.method.toLowerCase() === "cash")
    .reduce((total, payment) => total + toFiniteAmount(payment.amount), 0);
  const nonCashPayments = input.paidPayments
    .filter((payment) => payment.method.toLowerCase() !== "cash")
    .reduce((total, payment) => total + toFiniteAmount(payment.amount), 0);
  const pendingTotal = input.pendingTransactions.reduce(
    (total, transaction) => total + toFiniteAmount(transaction.total),
    0,
  );
  const expectedCash = openingCash + cashPayments;

  return {
    totalSales: cashPayments + nonCashPayments,
    cashPayments,
    nonCashPayments,
    openingCash,
    expectedCash,
    closingCash,
    variance: closingCash - expectedCash,
    pendingCount: input.pendingTransactions.length,
    pendingTotal,
  };
}
