export type UiStateTone = "neutral" | "success" | "warning" | "danger";

export type CheckoutGuardReason =
  | "shift_closed"
  | "cart_empty"
  | "payment_insufficient";

export type SyncStatus = "pending" | "queued" | "synced" | "failed" | "conflict";

export function getCheckoutGuardMessage(reason: CheckoutGuardReason) {
  const messages: Record<CheckoutGuardReason, string> = {
    cart_empty: "Add at least one product before saving this transaction.",
    payment_insufficient:
      "Enter an amount received that covers the total before saving.",
    shift_closed: "Open a shift before saving this transaction.",
  };

  return messages[reason];
}

export function getSyncStatusAction(status: SyncStatus): {
  label: string;
  nextAction: string;
  tone: UiStateTone;
} {
  if (status === "synced") {
    return {
      label: "Synced",
      nextAction: "No action needed.",
      tone: "success",
    };
  }

  if (status === "failed") {
    return {
      label: "Failed",
      nextAction:
        "Review the error and run Replay Sync when the backend is reachable.",
      tone: "danger",
    };
  }

  if (status === "conflict") {
    return {
      label: "Conflict",
      nextAction:
        "Review the event before replaying; central data rejected it.",
      tone: "danger",
    };
  }

  if (status === "queued") {
    return {
      label: "Queued",
      nextAction: "Wait for the current replay attempt to finish.",
      tone: "warning",
    };
  }

  return {
    label: "Pending",
    nextAction: "Run Replay Sync when the backend is reachable.",
    tone: "warning",
  };
}
