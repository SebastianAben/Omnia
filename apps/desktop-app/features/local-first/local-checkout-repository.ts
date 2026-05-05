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
import { getApiBaseUrl } from "@/lib/api-client";

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
  eventType: string;
  branchId: string;
  entityId: string;
  payload: unknown;
  status: LocalTransactionRecord["syncStatus"];
  attemptCount: number;
  createdAt: string;
  lastErrorCode?: string;
  lastErrorMessage?: string;
};

export type LocalInventoryBalanceRecord = {
  id: string;
  branchId: string;
  productId: string;
  quantity: number;
  minimumQuantity: number;
  updatedAt: string;
};

export type LocalStockMovementRecord = {
  id: string;
  branchId: string;
  productId: string;
  sourceType: string;
  sourceId?: string;
  movementType: string;
  quantityDelta: number;
  quantityBefore?: number;
  quantityAfter?: number;
  reasonCode: string;
  notes?: string;
  performedByUserId?: string;
  occurredAt: string;
  syncStatus: LocalTransactionRecord["syncStatus"];
};

type LocalStoreBridge = {
  saveCheckout: (input: unknown) => Promise<{
    transactionId: string;
    transactionNo: string;
    eventId: string;
    total: number;
  }>;
  listTransactions: () => Promise<LocalTransactionRecord[]>;
  listSyncQueue: () => Promise<LocalSyncQueueRecord[]>;
  listInventoryBalances: () => Promise<LocalInventoryBalanceRecord[]>;
  listStockMovements: () => Promise<LocalStockMovementRecord[]>;
  saveStockAdjustment: (input: unknown) => Promise<{
    movementId: string;
    eventId: string;
    quantityBefore: number;
    quantityAfter: number;
  }>;
  replaySync: (input: { apiBaseUrl: string; token?: string }) => Promise<{
    attempted: number;
    synced: number;
    failed: number;
    conflict: number;
  }>;
  saveShiftEvent: (input: unknown) => Promise<{
    shiftId: string;
    eventId: string;
  }>;
};

const requireLocalStore = () => {
  const desktopWindow = window as Window & {
    omniaDesktop?: { localStore?: LocalStoreBridge };
  };

  if (!desktopWindow.omniaDesktop?.localStore) {
    throw new Error("Omnia desktop local store bridge is not available.");
  }

  return desktopWindow.omniaDesktop.localStore;
};

export const isLocalStoreBridgeAvailable = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const desktopWindow = window as Window & {
    omniaDesktop?: { localStore?: LocalStoreBridge };
  };

  return Boolean(desktopWindow.omniaDesktop?.localStore);
};

export async function saveCheckoutLocally(input: {
  branch: BranchContext;
  register: RegisterContext;
  user: SessionUser;
  shiftId?: string | null;
  lines: CartLine[];
  totals: CartTotals;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amountReceived: number;
}) {
  return requireLocalStore().saveCheckout(input);
}

export async function listLocalSyncQueue() {
  return requireLocalStore().listSyncQueue() as Promise<LocalSyncQueueRecord[]>;
}

export async function listLocalTransactions() {
  return requireLocalStore().listTransactions() as Promise<
    LocalTransactionRecord[]
  >;
}

export async function listLocalInventoryBalances() {
  return requireLocalStore().listInventoryBalances();
}

export async function listLocalStockMovements() {
  return requireLocalStore().listStockMovements();
}

export async function saveStockAdjustmentLocally(input: {
  branch: BranchContext;
  user: SessionUser;
  product: {
    id: string;
    sku: string;
    name: string;
    stockOnHand: number;
    minimumQuantity: number;
  };
  movementType: "adjustment_plus" | "adjustment_minus";
  quantity: number;
  reasonCode: string;
  notes?: string | null;
}) {
  return requireLocalStore().saveStockAdjustment(input);
}

export async function replayPendingSync(token?: string) {
  return requireLocalStore().replaySync({
    apiBaseUrl: getApiBaseUrl(),
    token,
  });
}

export async function saveShiftEvent(input: {
  branch: BranchContext;
  register: RegisterContext;
  user: SessionUser;
  action: "open" | "close";
  shiftId?: string | null;
  openingCashAmount?: number;
  closingCashAmount?: number;
}) {
  return requireLocalStore().saveShiftEvent(input);
}
