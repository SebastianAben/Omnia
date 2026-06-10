import { app, BrowserWindow, ipcMain, shell } from "electron";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  clearAuthSession,
  readAuthSession,
  writeAuthSession,
  type AuthTokenPair,
} from "./auth-session-store";
import {
  calculateShiftReconciliation,
  type ShiftReconciliationSummary,
} from "./shift-reconciliation";

const isDev = process.env.NODE_ENV !== "production";
const devServerUrl = process.env.OMNIA_DESKTOP_URL ?? "http://localhost:3000";
const checkoutEventType = "transaction.bundle";
const replayBatchSize = 10;
const replayMaxBackoffMs = 5 * 60 * 1000;
const supportedReplayEventTypes = [
  "transaction.bundle",
  "shift.opened",
  "shift.closed",
  "stock_movement.created",
] as const;
const allowedExternalProtocols = new Set(["http:", "https:"]);

type SyncStatus = "pending" | "queued" | "synced" | "failed" | "conflict";
type LocalSourceMode = "online" | "offline";
type SyncSourceMode = "online" | "offline_replay";

type LocalStoreProduct = {
  id: string;
  sku: string;
  name: string;
  price: number;
  stockOnHand: number;
  minimumQuantity: number;
};

type SaveCheckoutInput = {
  branch: { id: string; code: string; name: string };
  register: { id: string; name: string };
  user: { id: string };
  shiftId?: string | null;
  sourceMode?: LocalSourceMode;
  lines: Array<{
    product: LocalStoreProduct;
    quantity: number;
    discountTotal: number;
  }>;
  totals: {
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
  };
  paymentMethod: string;
  paymentStatus: "paid" | "pending";
  amountReceived: number;
};

type ShiftEventInput = {
  branch: { id: string };
  register: { id: string };
  user: { id: string };
  action: "open" | "close";
  sourceMode?: LocalSourceMode;
  shiftId?: string | null;
  openingCashAmount?: number;
  closingCashAmount?: number;
  reconciliation?: ShiftReconciliationSummary | null;
};

type ShiftReconciliationPreviewInput = {
  branchId: string;
  registerId: string;
  shiftId: string;
  closingCashAmount: number;
};

type StockAdjustmentInput = {
  branch: { id: string };
  user: { id: string };
  sourceMode?: LocalSourceMode;
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
};

type LocalSyncQueueRow = {
  id: string;
  event_id: string;
  event_type: string;
  branch_id: string;
  entity_id: string;
  payload_json: string;
  status: SyncStatus;
  attempt_count: number;
  created_at: string;
  next_retry_at?: string | null;
  last_error_code?: string | null;
  last_error_message?: string | null;
};

type LocalShiftRow = {
  id: string;
  branch_id: string;
  register_id: string;
  opened_at: string;
  opening_cash_amount: number | null;
  status: "open" | "closed";
  sync_status: SyncStatus;
};

type LocalInventoryBalanceRow = {
  quantity: number;
  minimum_quantity: number;
};

const createId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

const normalizeSourceMode = (sourceMode?: LocalSourceMode): SyncSourceMode =>
  sourceMode === "offline" ? "offline_replay" : "online";

const sqlValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "0";
  }

  return `'${value.replaceAll("'", "''")}'`;
};

const getDesktopRoot = () => path.join(__dirname, "..");
const getLocalDbPath = () =>
  path.join(app.getPath("userData"), "omnia-local.db");
const getLocalSchemaPath = () => {
  const candidatePaths = [
    path.join(getDesktopRoot(), "local-store", "schema.sql"),
    path.join(process.resourcesPath, "local-store", "schema.sql"),
  ];
  const schemaPath = candidatePaths.find((candidate) => fs.existsSync(candidate));

  if (!schemaPath) {
    throw new Error("Local SQLite schema file is missing from the app bundle.");
  }

  return schemaPath;
};

function runSql(sql: string) {
  ensureLocalStore();
  execFileSync("sqlite3", [getLocalDbPath()], {
    input: sql,
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function querySql<T>(sql: string): T[] {
  ensureLocalStore();
  const output = execFileSync("sqlite3", ["-json", getLocalDbPath(), sql], {
    encoding: "utf8",
  }).trim();

  return output ? (JSON.parse(output) as T[]) : [];
}

let localStoreReady = false;

function ensureLocalStore() {
  if (localStoreReady) {
    return;
  }

  const dbPath = getLocalDbPath();
  const schemaPath = getLocalSchemaPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  applyLocalStoreMigrations(dbPath);
  execFileSync("sqlite3", [dbPath], {
    input: fs.readFileSync(schemaPath, "utf8"),
    stdio: ["pipe", "pipe", "pipe"],
  });
  localStoreReady = true;
}

function applyLocalStoreMigrations(dbPath: string) {
  const statements = [
    "ALTER TABLE sync_queue_local ADD COLUMN event_version INTEGER NOT NULL DEFAULT 1;",
    "ALTER TABLE sync_queue_local ADD COLUMN branch_id TEXT NOT NULL DEFAULT 'br_demo';",
    "ALTER TABLE sync_queue_local ADD COLUMN source_system TEXT NOT NULL DEFAULT 'branch_app';",
    "ALTER TABLE sync_queue_local ADD COLUMN source_mode TEXT NOT NULL DEFAULT 'online';",
    "ALTER TABLE sync_queue_local ADD COLUMN next_retry_at TEXT;",
    "ALTER TABLE sync_queue_local ADD COLUMN last_error_code TEXT;",
    "ALTER TABLE sync_queue_local ADD COLUMN last_error_message TEXT;",
    "ALTER TABLE sync_queue_local ADD COLUMN acknowledged_at TEXT;",
    "ALTER TABLE sync_queue_local ADD COLUMN ack_status TEXT;",
    "ALTER TABLE stock_movements_local ADD COLUMN source_type TEXT NOT NULL DEFAULT 'sales_transaction';",
    "ALTER TABLE stock_movements_local ADD COLUMN source_id TEXT;",
    "ALTER TABLE stock_movements_local ADD COLUMN quantity_before REAL;",
    "ALTER TABLE stock_movements_local ADD COLUMN quantity_after REAL;",
    "ALTER TABLE stock_movements_local ADD COLUMN reason_code TEXT NOT NULL DEFAULT 'legacy';",
    "ALTER TABLE stock_movements_local ADD COLUMN notes TEXT;",
    "ALTER TABLE stock_movements_local ADD COLUMN performed_by_user_id TEXT;",
    "ALTER TABLE payments_local ADD COLUMN amount_received INTEGER;",
    "ALTER TABLE shifts_local ADD COLUMN reconciliation_total_sales INTEGER;",
    "ALTER TABLE shifts_local ADD COLUMN reconciliation_cash_payments INTEGER;",
    "ALTER TABLE shifts_local ADD COLUMN reconciliation_non_cash_payments INTEGER;",
    "ALTER TABLE shifts_local ADD COLUMN reconciliation_expected_cash INTEGER;",
    "ALTER TABLE shifts_local ADD COLUMN reconciliation_variance INTEGER;",
    "ALTER TABLE shifts_local ADD COLUMN reconciliation_pending_count INTEGER;",
    "ALTER TABLE shifts_local ADD COLUMN reconciliation_pending_total INTEGER;",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_shifts_local_open_register ON shifts_local(register_id) WHERE status = 'open';",
  ];

  for (const statement of statements) {
    try {
      execFileSync("sqlite3", [dbPath, statement], {
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch {
      // The local database may be new or already migrated.
    }
  }
}

function saveCheckoutLocally(input: SaveCheckoutInput) {
  assertValidCheckoutInput(input);
  const activeShift = getActiveShift(input.branch.id, input.register.id);
  if (!activeShift || activeShift.id !== input.shiftId) {
    throw new Error("Checkout requires the active local shift for this register.");
  }

  const checkoutLines = resolveCheckoutLines(input);
  const totals = calculateCheckoutTotals(checkoutLines);
  assertCheckoutTotals(input.totals, totals);

  const createdAt = new Date().toISOString();
  const transactionId = createId("trx");
  const eventId = createId("evt");
  const transactionNo = `TRX-${input.branch.code}-${input.register.id}-${Date.now()}`;
  const paymentId = createId("pay");
  const sourceMode = normalizeSourceMode(input.sourceMode);

  const payload = {
    transaction: {
      id: transactionId,
      transaction_no: transactionNo,
      branch_id: input.branch.id,
      register_id: input.register.id,
      shift_id: input.shiftId ?? null,
      cashier_user_id: input.user.id,
      transaction_datetime: createdAt,
      subtotal_amount: totals.subtotal,
      discount_amount: totals.discountTotal,
      tax_amount: totals.taxTotal,
      total_amount: totals.grandTotal,
      payment_status: input.paymentStatus,
      transaction_status: "completed",
      source_mode: sourceMode,
      local_reference_id: transactionId,
    },
    items: checkoutLines.map((line) => ({
      id: createId("item"),
      product_id: line.product.id,
      product_name_snapshot: line.product.name,
      sku_snapshot: line.product.sku,
      unit_price: line.product.price,
      quantity: line.quantity,
      discount_amount: line.discountTotal,
      tax_amount: 0,
      line_total: line.product.price * line.quantity - line.discountTotal,
    })),
    payments: [
      {
        id: paymentId,
        payment_method_code: input.paymentMethod,
        amount: totals.grandTotal,
        payment_status: input.paymentStatus,
        payment_reference: null,
        paid_at: input.paymentStatus === "paid" ? createdAt : null,
        notes:
          input.paymentMethod === "cash"
            ? `amount_received:${input.amountReceived}`
            : null,
      },
    ],
    stock_movements: checkoutLines.map((line) => ({
      id: createId("mov"),
      product_id: line.product.id,
      source_type: "sales_transaction",
      source_id: transactionId,
      movement_type: "sale_out",
      quantity_delta: -line.quantity,
      reason_code: "pos_sale",
      notes: null,
      performed_by_user_id: input.user.id,
      movement_at: createdAt,
    })),
  };

  const syncEnvelope = {
    event_id: eventId,
    event_type: checkoutEventType,
    event_version: 1,
    branch_id: input.branch.id,
    source_system: "branch_app",
    source_mode: sourceMode,
    occurred_at: createdAt,
    produced_by_user_id: input.user.id,
    payload,
  };

  const statements = [
    "BEGIN IMMEDIATE;",
    `INSERT INTO sales_transactions_local (id, transaction_no, branch_id, register_id, user_id, shift_id, subtotal, discount_total, tax_total, grand_total, payment_status, sync_status, created_at) VALUES (${[
      transactionId,
      transactionNo,
      input.branch.id,
      input.register.id,
      input.user.id,
      input.shiftId ?? null,
      totals.subtotal,
      totals.discountTotal,
      totals.taxTotal,
      totals.grandTotal,
      input.paymentStatus,
      "pending",
      createdAt,
    ]
      .map(sqlValue)
      .join(", ")});`,
    ...checkoutLines.map(
      (line, index) =>
        `INSERT INTO sales_transaction_items_local (id, transaction_id, product_id, sku, name, quantity, unit_price, discount_total, subtotal) VALUES (${[
          payload.items[index].id,
          transactionId,
          line.product.id,
          line.product.sku,
          line.product.name,
          line.quantity,
          line.product.price,
          line.discountTotal,
          line.product.price * line.quantity - line.discountTotal,
        ]
          .map(sqlValue)
          .join(", ")});`,
    ),
    `INSERT INTO payments_local (id, transaction_id, method, amount, amount_received, status, recorded_at, sync_status) VALUES (${[
      paymentId,
      transactionId,
      input.paymentMethod,
      totals.grandTotal,
      input.amountReceived,
      input.paymentStatus,
      createdAt,
      "pending",
    ]
      .map(sqlValue)
      .join(", ")});`,
    ...checkoutLines.flatMap((line, index) => {
      const before = line.quantityBefore;
      const after = line.quantityAfter;
      const inventoryId = `inv_${input.branch.id}_${line.product.id}`;

      return [
        `INSERT INTO inventory_balances_local (id, branch_id, product_id, quantity, minimum_quantity, updated_at) VALUES (${[
          inventoryId,
          input.branch.id,
          line.product.id,
          after,
          line.product.minimumQuantity,
          createdAt,
        ]
          .map(sqlValue)
          .join(
            ", ",
          )}) ON CONFLICT(branch_id, product_id) DO UPDATE SET quantity = excluded.quantity, minimum_quantity = excluded.minimum_quantity, updated_at = excluded.updated_at;`,
        `INSERT INTO stock_movements_local (id, branch_id, product_id, source_type, source_id, movement_type, quantity_delta, quantity_before, quantity_after, reason_code, performed_by_user_id, occurred_at, sync_status) VALUES (${[
          payload.stock_movements[index].id,
          input.branch.id,
          line.product.id,
          "sales_transaction",
          transactionId,
          "sale_out",
          -line.quantity,
          before,
          after,
          "pos_sale",
          input.user.id,
          createdAt,
          "pending",
        ]
          .map(sqlValue)
          .join(", ")});`,
      ];
    }),
    `INSERT INTO sync_queue_local (id, event_id, event_type, event_version, branch_id, source_system, source_mode, entity_type, entity_id, payload_json, status, attempt_count, created_at) VALUES (${[
      createId("sync"),
      eventId,
      checkoutEventType,
      1,
      input.branch.id,
      "branch_app",
      sourceMode,
      "sales_transaction",
      transactionId,
      JSON.stringify(syncEnvelope),
      "pending",
      0,
      createdAt,
    ]
      .map(sqlValue)
      .join(", ")});`,
    "COMMIT;",
  ];

  runSql(statements.join("\n"));

  return {
    transactionId,
    transactionNo,
    eventId,
    total: totals.grandTotal,
  };
}

function assertValidCheckoutInput(input: SaveCheckoutInput) {
  if (!input.shiftId) {
    throw new Error("Open shift is required before checkout.");
  }

  if (!input.lines.length) {
    throw new Error("Cart is empty.");
  }

  if (new Set(input.lines.map((line) => line.product.id)).size !== input.lines.length) {
    throw new Error("Cart contains duplicate product lines.");
  }

  if (
    input.lines.some(
      (line) =>
        !Number.isFinite(line.quantity) ||
        line.quantity <= 0 ||
        !Number.isFinite(line.product.price) ||
        line.product.price < 0 ||
        !Number.isFinite(line.discountTotal) ||
        line.discountTotal < 0 ||
        line.discountTotal > line.product.price * line.quantity,
    )
  ) {
    throw new Error("Cart contains invalid quantity, price, or discount.");
  }

  if (!["cash", "transfer", "qris", "debit"].includes(input.paymentMethod)) {
    throw new Error("Unsupported payment method.");
  }
  if (!["paid", "pending"].includes(input.paymentStatus)) {
    throw new Error("Unsupported payment status.");
  }
  if (!Number.isFinite(input.amountReceived) || input.amountReceived < 0) {
    throw new Error("Amount received must be a non-negative number.");
  }

  if (
    input.paymentStatus === "paid" &&
    input.amountReceived < input.totals.grandTotal
  ) {
    throw new Error("Paid checkout requires enough amount received.");
  }
}

function resolveCheckoutLines(input: SaveCheckoutInput) {
  const balances = querySql<{
    product_id: string;
    quantity: number;
  }>(
    `SELECT product_id, quantity FROM inventory_balances_local WHERE branch_id = ${sqlValue(input.branch.id)} AND product_id IN (${input.lines.map((line) => sqlValue(line.product.id)).join(", ")});`,
  );
  const quantityByProduct = new Map(
    balances.map((balance) => [
      balance.product_id,
      Number(balance.quantity),
    ]),
  );

  return input.lines.map((line) => {
    const quantityBefore =
      quantityByProduct.get(line.product.id) ?? line.product.stockOnHand;
    const quantityAfter = quantityBefore - line.quantity;
    if (!Number.isFinite(quantityBefore) || quantityAfter < 0) {
      throw new Error(`Insufficient local stock for ${line.product.name}.`);
    }

    return {
      ...line,
      quantityBefore,
      quantityAfter,
    };
  });
}

function calculateCheckoutTotals(
  lines: Array<{
    product: LocalStoreProduct;
    quantity: number;
    discountTotal: number;
  }>,
) {
  const subtotal = lines.reduce(
    (total, line) => total + line.product.price * line.quantity,
    0,
  );
  const discountTotal = lines.reduce(
    (total, line) => total + line.discountTotal,
    0,
  );
  const taxableAmount = subtotal - discountTotal;
  const taxTotal = Math.round(taxableAmount * 0.11);

  return {
    subtotal,
    discountTotal,
    taxTotal,
    grandTotal: taxableAmount + taxTotal,
  };
}

function assertCheckoutTotals(
  provided: SaveCheckoutInput["totals"],
  calculated: ReturnType<typeof calculateCheckoutTotals>,
) {
  if (
    provided.subtotal !== calculated.subtotal ||
    provided.discountTotal !== calculated.discountTotal ||
    provided.taxTotal !== calculated.taxTotal ||
    provided.grandTotal !== calculated.grandTotal
  ) {
    throw new Error("Checkout totals do not match cart lines.");
  }
}

function listLocalTransactions() {
  const transactions = querySql<{
    id: string;
    transaction_no: string;
    branch_id: string;
    register_id: string;
    user_id: string;
    subtotal: number;
    discount_total: number;
    tax_total: number;
    grand_total: number;
    payment_status: string;
    sync_status: SyncStatus;
    created_at: string;
    method?: string | null;
    amount?: number | null;
    amount_received?: number | null;
  }>(
    `SELECT t.*, p.method, p.amount FROM sales_transactions_local t LEFT JOIN payments_local p ON p.transaction_id = t.id ORDER BY t.created_at DESC LIMIT 100;`,
  );
  const items = querySql<{
    id: string;
    transaction_id: string;
    product_id: string;
    sku: string;
    name: string;
    quantity: number;
    unit_price: number;
    discount_total: number;
    subtotal: number;
  }>(
    `SELECT * FROM sales_transaction_items_local WHERE transaction_id IN (SELECT id FROM sales_transactions_local ORDER BY created_at DESC LIMIT 100);`,
  );

  return transactions.map((transaction) => ({
    id: transaction.id,
    transactionNo: transaction.transaction_no,
    branchId: transaction.branch_id,
    registerId: transaction.register_id,
    userId: transaction.user_id,
    totals: {
      itemCount: items
        .filter((item) => item.transaction_id === transaction.id)
        .reduce((total, item) => total + Number(item.quantity), 0),
      subtotal: Number(transaction.subtotal),
      discountTotal: Number(transaction.discount_total),
      taxTotal: Number(transaction.tax_total),
      grandTotal: Number(transaction.grand_total),
    },
    lines: items
      .filter((item) => item.transaction_id === transaction.id)
      .map((item) => ({
        product: {
          id: item.product_id,
          sku: item.sku,
          name: item.name,
          categoryName: "Local receipt",
          unit: "pcs",
          price: Number(item.unit_price),
          stockOnHand: 0,
          minimumQuantity: 0,
        },
        quantity: Number(item.quantity),
        discountTotal: Number(item.discount_total),
      })),
    paymentMethod: transaction.method ?? "cash",
    paymentStatus: transaction.payment_status,
    amountReceived: Number(
      transaction.amount_received ??
        transaction.amount ??
        transaction.grand_total,
    ),
    createdAt: transaction.created_at,
    syncStatus: transaction.sync_status,
  }));
}

function listLocalSyncQueue() {
  return querySql<LocalSyncQueueRow>(
    `SELECT id, event_id, event_type, branch_id, entity_id, payload_json, status, attempt_count, created_at, next_retry_at, last_error_code, last_error_message FROM sync_queue_local ORDER BY created_at DESC LIMIT 100;`,
  ).map((row) => ({
    id: row.id,
    eventId: row.event_id,
    eventType: row.event_type,
    branchId: row.branch_id,
    entityId: row.entity_id,
    payload: JSON.parse(row.payload_json) as unknown,
    status: row.status,
    attemptCount: Number(row.attempt_count),
    createdAt: row.created_at,
    nextRetryAt: row.next_retry_at ?? undefined,
    lastErrorCode: row.last_error_code ?? undefined,
    lastErrorMessage: row.last_error_message ?? undefined,
  }));
}

function listLocalInventoryBalances() {
  return querySql<{
    id: string;
    branch_id: string;
    product_id: string;
    quantity: number;
    minimum_quantity: number;
    updated_at: string;
  }>(
    `SELECT * FROM inventory_balances_local ORDER BY updated_at DESC LIMIT 500;`,
  ).map((row) => ({
    id: row.id,
    branchId: row.branch_id,
    productId: row.product_id,
    quantity: Number(row.quantity),
    minimumQuantity: Number(row.minimum_quantity),
    updatedAt: row.updated_at,
  }));
}

function listLocalStockMovements() {
  return querySql<{
    id: string;
    branch_id: string;
    product_id: string;
    source_type: string;
    source_id?: string | null;
    movement_type: string;
    quantity_delta: number;
    quantity_before?: number | null;
    quantity_after?: number | null;
    reason_code: string;
    notes?: string | null;
    performed_by_user_id?: string | null;
    occurred_at: string;
    sync_status: SyncStatus;
  }>(
    `SELECT * FROM stock_movements_local ORDER BY occurred_at DESC LIMIT 100;`,
  ).map((row) => ({
    id: row.id,
    branchId: row.branch_id,
    productId: row.product_id,
    sourceType: row.source_type,
    sourceId: row.source_id ?? undefined,
    movementType: row.movement_type,
    quantityDelta: Number(row.quantity_delta),
    quantityBefore:
      row.quantity_before === null || row.quantity_before === undefined
        ? undefined
        : Number(row.quantity_before),
    quantityAfter:
      row.quantity_after === null || row.quantity_after === undefined
        ? undefined
        : Number(row.quantity_after),
    reasonCode: row.reason_code,
    notes: row.notes ?? undefined,
    performedByUserId: row.performed_by_user_id ?? undefined,
    occurredAt: row.occurred_at,
    syncStatus: row.sync_status,
  }));
}

const calculateReplayBackoffMs = (attemptCount: number) =>
  Math.min(2 ** Math.max(attemptCount - 1, 0) * 15_000, replayMaxBackoffMs);

const getReplayErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

async function replayPendingSync(input: {
  apiBaseUrl: string;
  token?: string;
}) {
  const now = new Date().toISOString();
  const staleQueuedBefore = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  runSql(
    `UPDATE sync_queue_local SET status = 'failed', next_retry_at = ${sqlValue(now)}, last_error_code = 'REPLAY_STALE', last_error_message = 'Queued replay attempt timed out before acknowledgement.' WHERE status = 'queued' AND last_attempt_at IS NOT NULL AND last_attempt_at < ${sqlValue(staleQueuedBefore)};`,
  );
  const pending = querySql<LocalSyncQueueRow>(
    `SELECT * FROM sync_queue_local WHERE event_type IN (${supportedReplayEventTypes.map(sqlValue).join(", ")}) AND status IN ('pending', 'failed') AND (next_retry_at IS NULL OR next_retry_at <= ${sqlValue(now)}) ORDER BY created_at ASC LIMIT ${replayBatchSize};`,
  );
  let synced = 0;
  let failed = 0;
  let conflict = 0;
  let deferred = 0;

  for (const item of pending) {
    const attemptedAt = new Date().toISOString();
    runSql(
      `UPDATE sync_queue_local SET status = 'queued', attempt_count = attempt_count + 1, last_attempt_at = ${sqlValue(attemptedAt)}, next_retry_at = NULL WHERE id = ${sqlValue(item.id)};`,
    );
    const nextAttemptCount = Number(item.attempt_count) + 1;

    try {
      const response = await fetch(getReplayEndpoint(input.apiBaseUrl, item), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": item.event_id,
          ...(input.token ? { Authorization: `Bearer ${input.token}` } : {}),
        },
        body: item.payload_json,
      });
      const body = (await response.json().catch(() => null)) as {
        success?: boolean;
        data?: { result_status?: string };
        message?: string;
        error?: { code?: string };
      } | null;

      if (!response.ok || !body?.success) {
        const code = body?.error?.code ?? `HTTP_${response.status}`;
        throw new Error(`${code}: ${body?.message ?? response.statusText}`);
      }

      const nextStatus =
        body.data?.result_status === "conflict" ? "conflict" : "synced";
      markReplayAcknowledged(item, nextStatus, body.data?.result_status);
      synced += nextStatus === "synced" ? 1 : 0;
      conflict += nextStatus === "conflict" ? 1 : 0;
    } catch (error) {
      failed += 1;
      const nextRetryAt = new Date(
        Date.now() + calculateReplayBackoffMs(nextAttemptCount),
      ).toISOString();
      runSql(
        `UPDATE sync_queue_local SET status = 'failed', next_retry_at = ${sqlValue(nextRetryAt)}, last_error_code = 'REPLAY_FAILED', last_error_message = ${sqlValue(getReplayErrorMessage(error))} WHERE id = ${sqlValue(item.id)};`,
      );
    }
  }

  const [{ count: deferredCount = 0 } = { count: 0 }] = querySql<{
    count: number;
  }>(
    `SELECT COUNT(*) as count FROM sync_queue_local WHERE event_type IN (${supportedReplayEventTypes.map(sqlValue).join(", ")}) AND status = 'failed' AND next_retry_at > ${sqlValue(now)};`,
  );
  deferred = Number(deferredCount);

  return { attempted: pending.length, synced, failed, conflict, deferred };
}

function saveShiftEvent(input: ShiftEventInput) {
  assertValidShiftEventInput(input);
  const occurredAt = new Date().toISOString();
  const shiftId = input.action === "open" ? createId("shift") : input.shiftId;
  const sourceMode = normalizeSourceMode(input.sourceMode);
  if (!shiftId) {
    throw new Error("Active shift is required before closing a shift.");
  }

  const activeShift = getActiveShift(input.branch.id, input.register.id);
  if (input.action === "open" && activeShift) {
    throw new Error("An active shift already exists for this register.");
  }
  if (
    input.action === "close" &&
    (!activeShift || activeShift.id !== shiftId)
  ) {
    throw new Error("The active local shift does not match this close request.");
  }

  const eventId = createId("evt");
  const eventType = input.action === "open" ? "shift.opened" : "shift.closed";
  const reconciliation =
    input.action === "close"
      ? getShiftReconciliationPreview({
          branchId: input.branch.id,
          registerId: input.register.id,
          shiftId,
          closingCashAmount: input.closingCashAmount ?? 0,
        })
      : null;
  const payload = {
    shift: {
      id: shiftId,
      branch_id: input.branch.id,
      register_id: input.register.id,
      action: input.action,
      opened_by_user_id: input.action === "open" ? input.user.id : undefined,
      closed_by_user_id: input.action === "close" ? input.user.id : undefined,
      opening_cash_amount: input.openingCashAmount ?? 0,
      closing_cash_amount: input.closingCashAmount ?? null,
      reconciliation:
        input.action === "close" && reconciliation
          ? toShiftReconciliationPayload(reconciliation)
          : undefined,
      occurred_at: occurredAt,
    },
  };

  runSql(
    [
      "BEGIN IMMEDIATE;",
      input.action === "open"
        ? `INSERT INTO shifts_local (id, branch_id, register_id, opened_by_user_id, opened_at, opening_cash_amount, status, sync_status) VALUES (${[
            shiftId,
            input.branch.id,
            input.register.id,
            input.user.id,
            occurredAt,
            input.openingCashAmount ?? 0,
            "open",
            "pending",
          ]
            .map(sqlValue)
            .join(", ")});`
        : `UPDATE shifts_local SET closed_by_user_id = ${sqlValue(input.user.id)}, closed_at = ${sqlValue(occurredAt)}, closing_cash_amount = ${sqlValue(input.closingCashAmount ?? 0)}, reconciliation_total_sales = ${sqlValue(reconciliation?.totalSales)}, reconciliation_cash_payments = ${sqlValue(reconciliation?.cashPayments)}, reconciliation_non_cash_payments = ${sqlValue(reconciliation?.nonCashPayments)}, reconciliation_expected_cash = ${sqlValue(reconciliation?.expectedCash)}, reconciliation_variance = ${sqlValue(reconciliation?.variance)}, reconciliation_pending_count = ${sqlValue(reconciliation?.pendingCount)}, reconciliation_pending_total = ${sqlValue(reconciliation?.pendingTotal)}, status = 'closed', sync_status = 'pending' WHERE id = ${sqlValue(shiftId)};`,
      `INSERT INTO sync_queue_local (id, event_id, event_type, event_version, branch_id, source_system, source_mode, entity_type, entity_id, payload_json, status, attempt_count, created_at) VALUES (${[
        createId("sync"),
        eventId,
        eventType,
        1,
        input.branch.id,
        "branch_app",
        sourceMode,
        "shift",
        shiftId,
        JSON.stringify({
          event_id: eventId,
          event_type: eventType,
          event_version: "1",
          branch_id: input.branch.id,
          source_system: "branch_app",
          source_mode: sourceMode,
          entity_type: "shift",
          entity_id: shiftId,
          occurred_at: occurredAt,
          produced_by_user_id: input.user.id,
          payload,
        }),
        "pending",
        0,
        occurredAt,
      ]
        .map(sqlValue)
        .join(", ")});`,
      "COMMIT;",
    ].join("\n"),
  );

  return { shiftId, eventId };
}

function getActiveShift(branchId: string, registerId: string) {
  const [shift] = querySql<LocalShiftRow>(
    `SELECT id, branch_id, register_id, opened_at, opening_cash_amount, status, sync_status FROM shifts_local WHERE branch_id = ${sqlValue(branchId)} AND register_id = ${sqlValue(registerId)} AND status = 'open' ORDER BY opened_at DESC LIMIT 1;`,
  );

  return shift
    ? {
        id: shift.id,
        branchId: shift.branch_id,
        registerId: shift.register_id,
        openedAt: shift.opened_at,
        openingCashAmount: Number(shift.opening_cash_amount ?? 0),
        status: shift.status,
        syncStatus: shift.sync_status,
      }
    : null;
}

function getShiftReconciliationPreview(input: ShiftReconciliationPreviewInput) {
  assertValidShiftReconciliationPreviewInput(input);
  const activeShift = getActiveShift(input.branchId, input.registerId);
  if (!activeShift || activeShift.id !== input.shiftId) {
    throw new Error(
      "The active local shift does not match this reconciliation request.",
    );
  }

  const paidPayments = querySql<{ method: string; amount: number }>(
    `SELECT p.method, p.amount FROM payments_local p INNER JOIN sales_transactions_local t ON t.id = p.transaction_id WHERE t.shift_id = ${sqlValue(input.shiftId)} AND t.branch_id = ${sqlValue(input.branchId)} AND t.register_id = ${sqlValue(input.registerId)} AND lower(t.payment_status) = 'paid' AND lower(p.status) = 'paid';`,
  );
  const pendingTransactions = querySql<{ total: number }>(
    `SELECT grand_total as total FROM sales_transactions_local WHERE shift_id = ${sqlValue(input.shiftId)} AND branch_id = ${sqlValue(input.branchId)} AND register_id = ${sqlValue(input.registerId)} AND lower(payment_status) <> 'paid';`,
  );

  return calculateShiftReconciliation({
    openingCash: activeShift.openingCashAmount,
    closingCash: input.closingCashAmount,
    paidPayments: paidPayments.map((payment) => ({
      method: payment.method,
      amount: Number(payment.amount),
    })),
    pendingTransactions: pendingTransactions.map((transaction) => ({
      total: Number(transaction.total),
    })),
  });
}

function assertValidShiftReconciliationPreviewInput(
  input: ShiftReconciliationPreviewInput,
) {
  if (!input.branchId || !input.registerId || !input.shiftId) {
    throw new Error(
      "Shift reconciliation requires branch, register, and shift.",
    );
  }
  if (!Number.isFinite(input.closingCashAmount) || input.closingCashAmount < 0) {
    throw new Error("Closing cash must be a non-negative number.");
  }
}

function toShiftReconciliationPayload(summary: ShiftReconciliationSummary) {
  return {
    total_sales: summary.totalSales,
    cash_payments: summary.cashPayments,
    non_cash_payments: summary.nonCashPayments,
    opening_cash: summary.openingCash,
    expected_cash: summary.expectedCash,
    closing_cash: summary.closingCash,
    variance: summary.variance,
    pending_count: summary.pendingCount,
    pending_total: summary.pendingTotal,
  };
}

function assertValidShiftEventInput(input: ShiftEventInput) {
  const amount =
    input.action === "open"
      ? input.openingCashAmount ?? 0
      : input.closingCashAmount ?? 0;

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Shift cash amount must be a non-negative number.");
  }
}

function assertValidStockAdjustmentInput(input: StockAdjustmentInput) {
  if (!input.branch.id || !input.user.id || !input.product.id) {
    throw new Error("Stock adjustment requires branch, user, and product.");
  }
  if (!["adjustment_plus", "adjustment_minus"].includes(input.movementType)) {
    throw new Error("Unsupported stock adjustment type.");
  }
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new Error("Adjustment quantity must be greater than 0.");
  }
  if (!Number.isFinite(input.product.stockOnHand)) {
    throw new Error("Product stock must be a valid number.");
  }
  if (!input.reasonCode.trim()) {
    throw new Error("Adjustment reason is required.");
  }
}

function getLocalInventoryBalance(branchId: string, productId: string) {
  const [balance] = querySql<LocalInventoryBalanceRow>(
    `SELECT quantity, minimum_quantity FROM inventory_balances_local WHERE branch_id = ${sqlValue(branchId)} AND product_id = ${sqlValue(productId)} LIMIT 1;`,
  );

  return balance
    ? {
        quantity: Number(balance.quantity),
        minimumQuantity: Number(balance.minimum_quantity),
      }
    : null;
}

function saveStockAdjustment(input: StockAdjustmentInput) {
  assertValidStockAdjustmentInput(input);
  const occurredAt = new Date().toISOString();
  const movementId = createId("mov");
  const eventId = createId("evt");
  const sourceMode = normalizeSourceMode(input.sourceMode);
  const quantityDelta =
    input.movementType === "adjustment_plus"
      ? Math.abs(input.quantity)
      : -Math.abs(input.quantity);
  const currentBalance = getLocalInventoryBalance(
    input.branch.id,
    input.product.id,
  );
  const before = currentBalance?.quantity ?? input.product.stockOnHand;
  const after = before + quantityDelta;
  if (after < 0) {
    throw new Error("Adjustment cannot reduce stock below zero.");
  }
  const inventoryId = `inv_${input.branch.id}_${input.product.id}`;
  const minimumQuantity =
    currentBalance?.minimumQuantity ?? input.product.minimumQuantity;
  const payload = {
    stock_movement: {
      id: movementId,
      branch_id: input.branch.id,
      product_id: input.product.id,
      source_type: "stock_adjustment",
      source_id: movementId,
      movement_type: input.movementType,
      quantity_delta: quantityDelta,
      quantity_before: before,
      quantity_after: after,
      reason_code: input.reasonCode,
      notes: input.notes ?? null,
      performed_by_user_id: input.user.id,
      movement_at: occurredAt,
    },
  };

  runSql(
    [
      "BEGIN IMMEDIATE;",
      `INSERT INTO inventory_balances_local (id, branch_id, product_id, quantity, minimum_quantity, updated_at) VALUES (${[
        inventoryId,
        input.branch.id,
        input.product.id,
        after,
        minimumQuantity,
        occurredAt,
      ]
        .map(sqlValue)
        .join(
          ", ",
        )}) ON CONFLICT(branch_id, product_id) DO UPDATE SET quantity = ${sqlValue(after)}, minimum_quantity = excluded.minimum_quantity, updated_at = excluded.updated_at;`,
      `INSERT INTO stock_movements_local (id, branch_id, product_id, source_type, source_id, movement_type, quantity_delta, quantity_before, quantity_after, reason_code, notes, performed_by_user_id, occurred_at, sync_status) VALUES (${[
        movementId,
        input.branch.id,
        input.product.id,
        "stock_adjustment",
        movementId,
        input.movementType,
        quantityDelta,
        before,
        after,
        input.reasonCode,
        input.notes ?? null,
        input.user.id,
        occurredAt,
        "pending",
      ]
        .map(sqlValue)
        .join(", ")});`,
      `INSERT INTO sync_queue_local (id, event_id, event_type, event_version, branch_id, source_system, source_mode, entity_type, entity_id, payload_json, status, attempt_count, created_at) VALUES (${[
        createId("sync"),
        eventId,
        "stock_movement.created",
        1,
        input.branch.id,
        "branch_app",
        sourceMode,
        "stock_movement",
        movementId,
        JSON.stringify({
          event_id: eventId,
          event_type: "stock_movement.created",
          event_version: "1",
          branch_id: input.branch.id,
          source_system: "branch_app",
          source_mode: sourceMode,
          entity_type: "stock_movement",
          entity_id: movementId,
          occurred_at: occurredAt,
          produced_by_user_id: input.user.id,
          payload,
        }),
        "pending",
        0,
        occurredAt,
      ]
        .map(sqlValue)
        .join(", ")});`,
      "COMMIT;",
    ].join("\n"),
  );

  return {
    movementId,
    eventId,
    quantityBefore: before,
    quantityAfter: after,
  };
}

function getReplayEndpoint(apiBaseUrl: string, item: LocalSyncQueueRow) {
  return item.event_type === checkoutEventType
    ? `${apiBaseUrl}/sync/bundles`
    : `${apiBaseUrl}/sync/events`;
}

function markReplayAcknowledged(
  item: LocalSyncQueueRow,
  nextStatus: SyncStatus,
  acknowledgementStatus?: string,
) {
  const acknowledgedAt = new Date().toISOString();
  const sharedUpdates = `UPDATE sync_queue_local SET status = ${sqlValue(nextStatus)}, acknowledged_at = ${sqlValue(acknowledgedAt)}, ack_status = ${sqlValue(acknowledgementStatus ?? "synced")}, last_error_code = NULL, last_error_message = NULL WHERE id = ${sqlValue(item.id)};`;

  if (item.event_type === checkoutEventType) {
    runSql(
      `${sharedUpdates}
       UPDATE sales_transactions_local SET sync_status = ${sqlValue(nextStatus)} WHERE id = ${sqlValue(item.entity_id)};
       UPDATE payments_local SET sync_status = ${sqlValue(nextStatus)} WHERE transaction_id = ${sqlValue(item.entity_id)};
       UPDATE stock_movements_local SET sync_status = ${sqlValue(nextStatus)} WHERE source_id = ${sqlValue(item.entity_id)};`,
    );
    return;
  }

  if (item.event_type === "stock_movement.created") {
    runSql(
      `${sharedUpdates}
       UPDATE stock_movements_local SET sync_status = ${sqlValue(nextStatus)} WHERE id = ${sqlValue(item.entity_id)};`,
    );
    return;
  }

  runSql(
    `${sharedUpdates}
     UPDATE shifts_local SET sync_status = ${sqlValue(nextStatus)} WHERE id = ${sqlValue(item.entity_id)};`,
  );
}

function registerLocalStoreHandlers() {
  ipcMain.handle("omnia:local-store:save-checkout", (_event, input) =>
    saveCheckoutLocally(input as SaveCheckoutInput),
  );
  ipcMain.handle("omnia:local-store:list-transactions", () =>
    listLocalTransactions(),
  );
  ipcMain.handle("omnia:local-store:list-sync-queue", () =>
    listLocalSyncQueue(),
  );
  ipcMain.handle("omnia:local-store:list-inventory-balances", () =>
    listLocalInventoryBalances(),
  );
  ipcMain.handle("omnia:local-store:list-stock-movements", () =>
    listLocalStockMovements(),
  );
  ipcMain.handle("omnia:local-store:save-stock-adjustment", (_event, input) =>
    saveStockAdjustment(input as StockAdjustmentInput),
  );
  ipcMain.handle("omnia:local-store:replay-sync", (_event, input) =>
    replayPendingSync(input as { apiBaseUrl: string; token?: string }),
  );
  ipcMain.handle("omnia:local-store:save-shift-event", (_event, input) =>
    saveShiftEvent(input as ShiftEventInput),
  );
  ipcMain.handle(
    "omnia:local-store:get-active-shift",
    (_event, input: { branchId: string; registerId: string }) =>
      getActiveShift(input.branchId, input.registerId),
  );
  ipcMain.handle(
    "omnia:local-store:get-shift-reconciliation-preview",
    (_event, input) =>
      getShiftReconciliationPreview(input as ShiftReconciliationPreviewInput),
  );
}

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 640,
    title: "Omnia",
    backgroundColor: "#f7f8fa",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' http://localhost:* http://127.0.0.1:*;",
          ],
        },
      });
    },
  );

  mainWindow.webContents.on("will-navigate", (event, url) => {
    const allowedUrl = isDev ? devServerUrl : "file://";

    if (!url.startsWith(allowedUrl)) {
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) {
      void shell.openExternal(url);
    }

    return { action: "deny" };
  });

  if (isDev) {
    void mainWindow.loadURL(devServerUrl);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../out/index.html"));
  }
}

function registerAuthSessionHandlers() {
  ipcMain.handle("omnia:auth-session:read", () => readAuthSession());
  ipcMain.handle("omnia:auth-session:write", (_event, input) =>
    writeAuthSession(input as AuthTokenPair),
  );
  ipcMain.handle("omnia:auth-session:clear", () => clearAuthSession());
}

function isSafeExternalUrl(url: string) {
  try {
    const parsedUrl = new URL(url);

    return allowedExternalProtocols.has(parsedUrl.protocol);
  } catch {
    return false;
  }
}

app.whenReady().then(() => {
  ensureLocalStore();
  registerLocalStoreHandlers();
  registerAuthSessionHandlers();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
