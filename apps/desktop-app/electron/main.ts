import { app, BrowserWindow, ipcMain, shell } from "electron";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const isDev = process.env.NODE_ENV !== "production";
const devServerUrl = process.env.OMNIA_DESKTOP_URL ?? "http://localhost:3000";
const checkoutEventType = "transaction.bundle";

type SyncStatus = "pending" | "queued" | "synced" | "failed" | "conflict";

type LocalStoreProduct = {
  id: string;
  sku: string;
  name: string;
  price: number;
  stockOnHand: number;
};

type SaveCheckoutInput = {
  branch: { id: string; code: string; name: string };
  register: { id: string; name: string };
  user: { id: string };
  shiftId?: string | null;
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
  openingCashAmount?: number;
  closingCashAmount?: number;
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
  last_error_code?: string | null;
  last_error_message?: string | null;
};

const createId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

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
const getLocalDbPath = () => path.join(getDesktopRoot(), ".omnia", "omnia-local.db");
const getLocalSchemaPath = () => path.join(getDesktopRoot(), "local-store", "schema.sql");

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
    "ALTER TABLE sync_queue_local ADD COLUMN next_retry_at TEXT;",
    "ALTER TABLE sync_queue_local ADD COLUMN last_error_code TEXT;",
    "ALTER TABLE sync_queue_local ADD COLUMN last_error_message TEXT;",
    "ALTER TABLE sync_queue_local ADD COLUMN acknowledged_at TEXT;",
    "ALTER TABLE sync_queue_local ADD COLUMN ack_status TEXT;",
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
  const createdAt = new Date().toISOString();
  const transactionId = createId("trx");
  const eventId = createId("evt");
  const transactionNo = `TRX-${input.branch.code}-${input.register.id}-${Date.now()}`;
  const paymentId = createId("pay");

  const payload = {
    transaction: {
      id: transactionId,
      transaction_no: transactionNo,
      branch_id: input.branch.id,
      register_id: input.register.id,
      shift_id: input.shiftId ?? null,
      cashier_user_id: input.user.id,
      transaction_datetime: createdAt,
      subtotal_amount: input.totals.subtotal,
      discount_amount: input.totals.discountTotal,
      tax_amount: input.totals.taxTotal,
      total_amount: input.totals.grandTotal,
      payment_status: input.paymentStatus,
      transaction_status: "completed",
      source_mode: "online",
      local_reference_id: transactionId,
    },
    items: input.lines.map((line) => ({
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
        amount: input.totals.grandTotal,
        payment_status: input.paymentStatus,
        payment_reference: null,
        paid_at: input.paymentStatus === "paid" ? createdAt : null,
        notes:
          input.paymentMethod === "cash"
            ? `amount_received:${input.amountReceived}`
            : null,
      },
    ],
    stock_movements: input.lines.map((line) => ({
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
    source_mode: "online",
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
      input.totals.subtotal,
      input.totals.discountTotal,
      input.totals.taxTotal,
      input.totals.grandTotal,
      input.paymentStatus,
      "pending",
      createdAt,
    ].map(sqlValue).join(", ")});`,
    ...input.lines.map(
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
        ].map(sqlValue).join(", ")});`,
    ),
    `INSERT INTO payments_local (id, transaction_id, method, amount, status, recorded_at, sync_status) VALUES (${[
      paymentId,
      transactionId,
      input.paymentMethod,
      input.totals.grandTotal,
      input.paymentStatus,
      createdAt,
      "pending",
    ].map(sqlValue).join(", ")});`,
    ...input.lines.flatMap((line, index) => {
      const before = line.product.stockOnHand;
      const after = Math.max(before - line.quantity, 0);
      const inventoryId = `inv_${input.branch.id}_${line.product.id}`;

      return [
        `INSERT INTO inventory_balances_local (id, branch_id, product_id, quantity, minimum_quantity, updated_at) VALUES (${[
          inventoryId,
          input.branch.id,
          line.product.id,
          after,
          0,
          createdAt,
        ].map(sqlValue).join(", ")}) ON CONFLICT(branch_id, product_id) DO UPDATE SET quantity = MAX(inventory_balances_local.quantity - ${sqlValue(line.quantity)}, 0), updated_at = excluded.updated_at;`,
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
        ].map(sqlValue).join(", ")});`,
      ];
    }),
    `INSERT INTO sync_queue_local (id, event_id, event_type, event_version, branch_id, source_system, source_mode, entity_type, entity_id, payload_json, status, attempt_count, created_at) VALUES (${[
      createId("sync"),
      eventId,
      checkoutEventType,
      1,
      input.branch.id,
      "branch_app",
      "online",
      "sales_transaction",
      transactionId,
      JSON.stringify(syncEnvelope),
      "pending",
      0,
      createdAt,
    ].map(sqlValue).join(", ")});`,
    "COMMIT;",
  ];

  runSql(statements.join("\n"));

  return {
    transactionId,
    transactionNo,
    eventId,
    total: input.totals.grandTotal,
  };
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
    amountReceived: Number(transaction.amount ?? transaction.grand_total),
    createdAt: transaction.created_at,
    syncStatus: transaction.sync_status,
  }));
}

function listLocalSyncQueue() {
  return querySql<LocalSyncQueueRow>(
    `SELECT id, event_id, event_type, branch_id, entity_id, payload_json, status, attempt_count, created_at, last_error_code, last_error_message FROM sync_queue_local ORDER BY created_at DESC LIMIT 100;`,
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
    lastErrorCode: row.last_error_code ?? undefined,
    lastErrorMessage: row.last_error_message ?? undefined,
  }));
}

async function replayPendingSync(input: { apiBaseUrl: string; token?: string }) {
  const pending = querySql<LocalSyncQueueRow>(
    `SELECT * FROM sync_queue_local WHERE event_type = 'transaction.bundle' AND status IN ('pending', 'failed') ORDER BY created_at ASC LIMIT 10;`,
  );
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    const attemptedAt = new Date().toISOString();
    runSql(
      `UPDATE sync_queue_local SET status = 'queued', attempt_count = attempt_count + 1, last_attempt_at = ${sqlValue(attemptedAt)} WHERE id = ${sqlValue(item.id)};`,
    );

    try {
      const response = await fetch(`${input.apiBaseUrl}/sync/bundles`, {
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
        throw new Error(body?.message ?? `HTTP ${response.status}`);
      }

      const nextStatus =
        body.data?.result_status === "conflict" ? "conflict" : "synced";
      runSql(
        `UPDATE sync_queue_local SET status = ${sqlValue(nextStatus)}, acknowledged_at = ${sqlValue(new Date().toISOString())}, ack_status = ${sqlValue(body.data?.result_status ?? "synced")}, last_error_code = NULL, last_error_message = NULL WHERE id = ${sqlValue(item.id)};
         UPDATE sales_transactions_local SET sync_status = ${sqlValue(nextStatus)} WHERE id = ${sqlValue(item.entity_id)};
         UPDATE payments_local SET sync_status = ${sqlValue(nextStatus)} WHERE transaction_id = ${sqlValue(item.entity_id)};
         UPDATE stock_movements_local SET sync_status = ${sqlValue(nextStatus)} WHERE source_id = ${sqlValue(item.entity_id)};`,
      );
      synced += nextStatus === "synced" ? 1 : 0;
      failed += nextStatus === "conflict" ? 1 : 0;
    } catch (error) {
      failed += 1;
      runSql(
        `UPDATE sync_queue_local SET status = 'failed', last_error_code = 'REPLAY_FAILED', last_error_message = ${sqlValue(error instanceof Error ? error.message : String(error))} WHERE id = ${sqlValue(item.id)};`,
      );
    }
  }

  return { attempted: pending.length, synced, failed };
}

function saveShiftEvent(input: ShiftEventInput) {
  const occurredAt = new Date().toISOString();
  const shiftId = createId("shift");
  const eventId = createId("evt");
  const eventType = `shift.${input.action}`;
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
      occurred_at: occurredAt,
    },
  };

  runSql(
    [
      "BEGIN IMMEDIATE;",
      input.action === "open"
        ? `INSERT OR REPLACE INTO shifts_local (id, branch_id, register_id, opened_by_user_id, opened_at, opening_cash_amount, status, sync_status) VALUES (${[
            shiftId,
            input.branch.id,
            input.register.id,
            input.user.id,
            occurredAt,
            input.openingCashAmount ?? 0,
            "open",
            "pending",
          ].map(sqlValue).join(", ")});`
        : `UPDATE shifts_local SET closed_by_user_id = ${sqlValue(input.user.id)}, closed_at = ${sqlValue(occurredAt)}, closing_cash_amount = ${sqlValue(input.closingCashAmount ?? 0)}, status = 'closed', sync_status = 'pending' WHERE branch_id = ${sqlValue(input.branch.id)} AND register_id = ${sqlValue(input.register.id)} AND status = 'open';`,
      `INSERT INTO sync_queue_local (id, event_id, event_type, event_version, branch_id, source_system, source_mode, entity_type, entity_id, payload_json, status, attempt_count, created_at) VALUES (${[
        createId("sync"),
        eventId,
        eventType,
        1,
        input.branch.id,
        "branch_app",
        "online",
        "shift",
        shiftId,
        JSON.stringify({
          event_id: eventId,
          event_type: eventType,
          event_version: 1,
          branch_id: input.branch.id,
          source_system: "branch_app",
          source_mode: "online",
          occurred_at: occurredAt,
          produced_by_user_id: input.user.id,
          payload,
        }),
        "pending",
        0,
        occurredAt,
      ].map(sqlValue).join(", ")});`,
      "COMMIT;",
    ].join("\n"),
  );

  return { shiftId, eventId };
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
  ipcMain.handle("omnia:local-store:replay-sync", (_event, input) =>
    replayPendingSync(input as { apiBaseUrl: string; token?: string }),
  );
  ipcMain.handle("omnia:local-store:save-shift-event", (_event, input) =>
    saveShiftEvent(input as ShiftEventInput),
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
      sandbox: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  if (isDev) {
    void mainWindow.loadURL(devServerUrl);
  } else {
    void mainWindow.loadFile(
      path.join(__dirname, "../.next/server/app/index.html"),
    );
  }
}

app.whenReady().then(() => {
  ensureLocalStore();
  registerLocalStoreHandlers();
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
