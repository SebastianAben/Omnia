import type { LocalSyncQueueRecord } from "@/features/local-first/local-checkout-repository";

export type SyncQueueSummary = {
  label: string;
  description: string;
  pending: number;
  failed: number;
  status: "success" | "warning" | "danger";
};

export function getLocalSyncSummary(
  queue: LocalSyncQueueRecord[],
): SyncQueueSummary[] {
  const transactionQueue = queue.filter(
    (record) => record.eventType === "transaction.bundle",
  );
  const shiftQueue = queue.filter((record) =>
    ["shift.opened", "shift.closed"].includes(record.eventType),
  );
  const stockMovementQueue = queue.filter(
    (record) => record.eventType === "stock_movement.created",
  );
  const transactionPending = transactionQueue.filter((record) =>
    ["pending", "queued"].includes(record.status),
  ).length;
  const transactionFailed = transactionQueue.filter((record) =>
    ["failed", "conflict"].includes(record.status),
  ).length;
  const shiftPending = shiftQueue.filter((record) =>
    ["pending", "queued"].includes(record.status),
  ).length;
  const shiftFailed = shiftQueue.filter((record) =>
    ["failed", "conflict"].includes(record.status),
  ).length;
  const stockMovementPending = stockMovementQueue.filter((record) =>
    ["pending", "queued"].includes(record.status),
  ).length;
  const stockMovementFailed = stockMovementQueue.filter((record) =>
    ["failed", "conflict"].includes(record.status),
  ).length;

  return [
    {
      label: "Transactions",
      description: "Local checkout bundles waiting for central sync",
      pending: transactionPending,
      failed: transactionFailed,
      status:
        transactionFailed > 0
          ? "danger"
          : transactionPending > 0
            ? "warning"
            : "success",
    },
    {
      label: "Shifts",
      description: "Open and close shift events waiting for central sync",
      pending: shiftPending,
      failed: shiftFailed,
      status:
        shiftFailed > 0 ? "danger" : shiftPending > 0 ? "warning" : "success",
    },
    {
      label: "Stock movements",
      description: "Manual stock adjustments waiting for central sync",
      pending: stockMovementPending,
      failed: stockMovementFailed,
      status:
        stockMovementFailed > 0
          ? "danger"
          : stockMovementPending > 0
            ? "warning"
            : "success",
    },
  ];
}
