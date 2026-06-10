export {};

type OmniaLocalTransaction = {
  id: string;
  transactionNo: string;
  branchId: string;
  registerId: string;
  userId: string;
  totals: {
    itemCount: number;
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
  };
  lines: Array<{
    product: {
      id: string;
      sku: string;
      name: string;
      categoryName: string;
      unit: string;
      price: number;
      stockOnHand: number;
      minimumQuantity: number;
    };
    quantity: number;
    discountTotal: number;
  }>;
  paymentMethod: string;
  paymentStatus: string;
  amountReceived: number;
  createdAt: string;
  syncStatus: "pending" | "queued" | "synced" | "failed" | "conflict";
};

type OmniaLocalSyncQueueRecord = {
  id: string;
  eventId: string;
  eventType: string;
  branchId: string;
  entityId: string;
  payload: unknown;
  status: "pending" | "queued" | "synced" | "failed" | "conflict";
  attemptCount: number;
  createdAt: string;
  nextRetryAt?: string;
  lastErrorCode?: string;
  lastErrorMessage?: string;
};

type OmniaLocalInventoryBalanceRecord = {
  id: string;
  branchId: string;
  productId: string;
  quantity: number;
  minimumQuantity: number;
  updatedAt: string;
};

type OmniaLocalStockMovementRecord = {
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
  syncStatus: "pending" | "queued" | "synced" | "failed" | "conflict";
};

type OmniaShiftReconciliationPreview = {
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

declare global {
  interface Window {
    omniaDesktop?: {
      platform: NodeJS.Platform;
      versions: {
        electron: string;
        chrome: string;
        node: string;
      };
      authSession: {
        read: () => Promise<{
          accessToken: string;
          refreshToken: string;
        } | null>;
        write: (input: {
          accessToken: string;
          refreshToken: string;
        }) => Promise<boolean>;
        clear: () => Promise<void>;
      };
      localStore: {
        saveCheckout: (input: unknown) => Promise<{
          transactionId: string;
          transactionNo: string;
          eventId: string;
          total: number;
        }>;
        listTransactions: () => Promise<OmniaLocalTransaction[]>;
        listSyncQueue: () => Promise<OmniaLocalSyncQueueRecord[]>;
        listInventoryBalances: () => Promise<
          OmniaLocalInventoryBalanceRecord[]
        >;
        listStockMovements: () => Promise<OmniaLocalStockMovementRecord[]>;
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
          deferred: number;
        }>;
        saveShiftEvent: (input: unknown) => Promise<{
          shiftId: string;
          eventId: string;
        }>;
        getActiveShift: (input: {
          branchId: string;
          registerId: string;
        }) => Promise<{
          id: string;
          branchId: string;
          registerId: string;
          openedAt: string;
          openingCashAmount: number;
          status: "open";
          syncStatus: "pending" | "queued" | "synced" | "failed" | "conflict";
        } | null>;
        getShiftReconciliationPreview: (input: {
          branchId: string;
          registerId: string;
          shiftId: string;
          closingCashAmount: number;
        }) => Promise<OmniaShiftReconciliationPreview>;
      };
    };
  }
}
