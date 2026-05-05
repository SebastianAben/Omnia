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
  const pending = transactionQueue.filter((record) =>
    ["pending", "queued"].includes(record.status),
  ).length;
  const failed = transactionQueue.filter((record) =>
    ["failed", "conflict"].includes(record.status),
  ).length;

  return [
    {
      label: "Transactions",
      description: "Local checkout bundles waiting for central sync",
      pending,
      failed,
      status: failed > 0 ? "danger" : pending > 0 ? "warning" : "success",
    },
    {
      label: "Inventory movements",
      description: "Stock movement rows included in checkout bundles",
      pending,
      failed,
      status: failed > 0 ? "danger" : pending > 0 ? "warning" : "success",
    },
    {
      label: "Master data cache",
      description:
        "Product and branch price reads use API first, demo cache second",
      pending: 0,
      failed: 0,
      status: "success",
    },
  ];
}
