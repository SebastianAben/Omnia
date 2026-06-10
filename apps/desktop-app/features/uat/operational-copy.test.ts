import assert from "node:assert/strict";
import test from "node:test";

import {
  getCheckoutGuardMessage,
  getSyncStatusAction,
} from "./operational-copy";

test("getCheckoutGuardMessage explains the next cashier action", () => {
  assert.equal(
    getCheckoutGuardMessage("shift_closed"),
    "Open a shift before saving this transaction.",
  );
  assert.equal(
    getCheckoutGuardMessage("cart_empty"),
    "Add at least one product before saving this transaction.",
  );
  assert.equal(
    getCheckoutGuardMessage("payment_insufficient"),
    "Enter an amount received that covers the total before saving.",
  );
});

test("getSyncStatusAction maps sync statuses to actionable copy", () => {
  assert.deepEqual(getSyncStatusAction("synced"), {
    label: "Synced",
    nextAction: "No action needed.",
    tone: "success",
  });
  assert.deepEqual(getSyncStatusAction("failed"), {
    label: "Failed",
    nextAction: "Review the error and run Replay Sync when the backend is reachable.",
    tone: "danger",
  });
  assert.deepEqual(getSyncStatusAction("conflict"), {
    label: "Conflict",
    nextAction: "Review the event before replaying; central data rejected it.",
    tone: "danger",
  });
});
