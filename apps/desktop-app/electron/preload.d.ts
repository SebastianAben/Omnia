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
  lastErrorCode?: string;
  lastErrorMessage?: string;
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
      localStore: {
        saveCheckout: (input: unknown) => Promise<{
          transactionId: string;
          transactionNo: string;
          eventId: string;
          total: number;
        }>;
        listTransactions: () => Promise<OmniaLocalTransaction[]>;
        listSyncQueue: () => Promise<OmniaLocalSyncQueueRecord[]>;
        replaySync: (input: {
          apiBaseUrl: string;
          token?: string;
        }) => Promise<{ attempted: number; synced: number; failed: number }>;
        saveShiftEvent: (input: unknown) => Promise<{
          shiftId: string;
          eventId: string;
        }>;
      };
    };
  }
}
