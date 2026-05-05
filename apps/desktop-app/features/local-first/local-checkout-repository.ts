import type {
  BranchContext,
  RegisterContext,
  SessionUser,
} from "@/lib/app-state";
import type {
  CartLine,
  CartTotals,
  PaymentMethod,
  PaymentStatus,
} from "@/features/pos/pos-types";

export type LocalTransactionRecord = {
  id: string;
  transactionNo: string;
  branchId: string;
  registerId: string;
  userId: string;
  totals: CartTotals;
  lines: CartLine[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amountReceived: number;
  createdAt: string;
  syncStatus: "pending" | "queued" | "synced" | "failed" | "conflict";
};

export type LocalSyncQueueRecord = {
  id: string;
  eventId: string;
  eventType: "transaction.bundle";
  branchId: string;
  entityId: string;
  payload: unknown;
  status: LocalTransactionRecord["syncStatus"];
  attemptCount: number;
  createdAt: string;
};

const transactionsKey = "omnia.local.transactions";
const queueKey = "omnia.local.sync_queue";

const readJson = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

const createId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

export function saveCheckoutLocally(input: {
  branch: BranchContext;
  register: RegisterContext;
  user: SessionUser;
  lines: CartLine[];
  totals: CartTotals;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amountReceived: number;
}) {
  const createdAt = new Date().toISOString();
  const transactionId = createId("trx");
  const eventId = createId("evt");
  const transactionNo = `TRX-${input.branch.code}-${input.register.id}-${Date.now()}`;

  const transaction: LocalTransactionRecord = {
    id: transactionId,
    transactionNo,
    branchId: input.branch.id,
    registerId: input.register.id,
    userId: input.user.id,
    lines: input.lines,
    totals: input.totals,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentStatus,
    amountReceived: input.amountReceived,
    createdAt,
    syncStatus: "pending",
  };

  const payload = {
    transaction: {
      id: transaction.id,
      transaction_no: transaction.transactionNo,
      branch_id: transaction.branchId,
      register_id: transaction.registerId,
      user_id: transaction.userId,
      subtotal: input.totals.subtotal,
      discount_total: input.totals.discountTotal,
      tax_total: input.totals.taxTotal,
      grand_total: input.totals.grandTotal,
      payment_status: input.paymentStatus,
      created_at: createdAt,
    },
    items: input.lines.map((line) => ({
      id: createId("item"),
      transaction_id: transaction.id,
      product_id: line.product.id,
      sku: line.product.sku,
      name: line.product.name,
      quantity: line.quantity,
      unit_price: line.product.price,
      discount_total: line.discountTotal,
      subtotal: line.product.price * line.quantity - line.discountTotal,
    })),
    payments: [
      {
        id: createId("pay"),
        transaction_id: transaction.id,
        method: input.paymentMethod,
        amount: input.totals.grandTotal,
        amount_received: input.amountReceived,
        change_amount: Math.max(
          input.amountReceived - input.totals.grandTotal,
          0,
        ),
        status: input.paymentStatus,
        recorded_at: createdAt,
      },
    ],
    stock_movements: input.lines.map((line) => ({
      id: createId("mov"),
      branch_id: input.branch.id,
      product_id: line.product.id,
      source_type: "sales_transaction",
      source_id: transaction.id,
      movement_type: "sale",
      quantity_delta: -line.quantity,
      quantity_before: line.product.stockOnHand,
      quantity_after: Math.max(line.product.stockOnHand - line.quantity, 0),
      reason_code: "pos_sale",
      performed_by_user_id: input.user.id,
      occurred_at: createdAt,
    })),
  };

  const syncRecord: LocalSyncQueueRecord = {
    id: createId("sync"),
    eventId,
    eventType: "transaction.bundle",
    branchId: input.branch.id,
    entityId: transaction.id,
    payload,
    status: "pending",
    attemptCount: 0,
    createdAt,
  };

  writeJson(transactionsKey, [
    transaction,
    ...readJson<LocalTransactionRecord[]>(transactionsKey, []),
  ]);
  writeJson(queueKey, [
    syncRecord,
    ...readJson<LocalSyncQueueRecord[]>(queueKey, []),
  ]);

  return {
    transactionId,
    transactionNo,
    eventId,
    total: input.totals.grandTotal,
  };
}

export function listLocalSyncQueue() {
  return readJson<LocalSyncQueueRecord[]>(queueKey, []);
}

export function listLocalTransactions() {
  return readJson<LocalTransactionRecord[]>(transactionsKey, []);
}
