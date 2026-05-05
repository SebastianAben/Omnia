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

type LocalStoreBridge = {
  saveCheckout: (input: unknown) => Promise<{
    transactionId: string;
    transactionNo: string;
    eventId: string;
    total: number;
  }>;
  listTransactions: () => Promise<LocalTransactionRecord[]>;
  listSyncQueue: () => Promise<LocalSyncQueueRecord[]>;
  replaySync: (input: {
    apiBaseUrl: string;
    token?: string;
  }) => Promise<{ attempted: number; synced: number; failed: number }>;
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
  openingCashAmount?: number;
  closingCashAmount?: number;
}) {
  return requireLocalStore().saveShiftEvent(input);
}
