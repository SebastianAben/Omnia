const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4000/api/v1";

async function invokeJson(method, path, body, headers = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new Error(
        `${method} ${path} returned HTTP ${response.status}: ${text}`,
      );
    }

    if (!data || data.success !== true) {
      throw new Error(`${method} ${path} did not return success=true`);
    }

    console.log(`[ok] ${method} ${path}`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function invokeStatus(method, path, headers = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers,
      signal: controller.signal,
    });

    return response.status;
  } finally {
    clearTimeout(timer);
  }
}

console.log(`Running Omnia MVP smoke checks against ${apiBaseUrl}`);

await invokeJson("GET", "/health");

const cashierLogin = await invokeJson("POST", "/auth/login", {
  username: "demo.cashier",
  password: "password123",
  device_id: "mvp-smoke-cashier-node",
});
const cashierToken = cashierLogin.data.token;

const adminLogin = await invokeJson("POST", "/auth/login", {
  username: "demo.admin",
  password: "password123",
  device_id: "mvp-smoke-admin-node",
});
const adminToken = adminLogin.data.token;
const adminHeaders = { authorization: `Bearer ${adminToken}` };

const products = await invokeJson("GET", "/products", undefined, adminHeaders);
const branches = await invokeJson("GET", "/branches", undefined, adminHeaders);
const registers = await invokeJson(
  "GET",
  "/registers",
  undefined,
  adminHeaders,
);

const branchId = branches.data[0]?.id;
const register = registers.data.find((item) => item.branch_id === branchId);
if (!branchId || !register) {
  throw new Error("No branch/register found for smoke check");
}

const eventId = `mvp-smoke-${crypto.randomUUID()}`;
const transactionId = `txn-${eventId}`;
const product = products.data[0];
const occurredAt = new Date().toISOString();
const cashierUserId = cashierLogin.data.user.id;

const bundle = {
  event_id: eventId,
  event_type: "transaction.bundle",
  event_version: 1,
  branch_id: branchId,
  source_system: "branch_app",
  source_mode: "offline_replay",
  occurred_at: occurredAt,
  produced_by_user_id: cashierUserId,
  payload: {
    transaction: {
      id: transactionId,
      transaction_no: `SMOKE-${eventId.slice(10, 18)}`,
      branch_id: branchId,
      register_id: register.id,
      shift_id: null,
      cashier_user_id: cashierUserId,
      transaction_datetime: occurredAt,
      subtotal_amount: 15000,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: 15000,
      payment_status: "paid",
      transaction_status: "completed",
      source_mode: "offline_replay",
      local_reference_id: eventId,
    },
    items: [
      {
        id: `item-${eventId}`,
        product_id: product.id,
        product_name_snapshot: product.name,
        sku_snapshot: product.sku,
        unit_price: 15000,
        quantity: 1,
        discount_amount: 0,
        tax_amount: 0,
        line_total: 15000,
      },
    ],
    payments: [
      {
        id: `pay-${eventId}`,
        payment_method_code: "cash",
        amount: 15000,
        payment_status: "paid",
        paid_at: occurredAt,
      },
    ],
    stock_movements: [
      {
        id: `stock-${eventId}`,
        product_id: product.id,
        source_type: "sales_transaction",
        source_id: transactionId,
        movement_type: "sale_out",
        quantity_delta: -1,
        reason_code: "sale",
        performed_by_user_id: cashierUserId,
        movement_at: occurredAt,
      },
    ],
  },
};

const syncHeaders = {
  authorization: `Bearer ${cashierToken}`,
  "idempotency-key": eventId,
};
await invokeJson("POST", "/sync/bundles", bundle, syncHeaders);

const duplicate = await invokeJson(
  "POST",
  "/sync/bundles",
  bundle,
  syncHeaders,
);
if (duplicate.data.result_status !== "duplicate_ignored") {
  throw new Error(
    `Expected duplicate_ignored, got ${duplicate.data.result_status}`,
  );
}

await invokeJson("GET", "/dashboard/central", undefined, adminHeaders);
await invokeJson("GET", "/ai/insights", undefined, adminHeaders);

const llmGeneration = await invokeJson(
  "POST",
  "/ai/insights/generate",
  undefined,
  adminHeaders,
  30000,
);
const allowedGenerationStatuses = new Set([
  "success",
  "failed",
  "insufficient_data",
  "cached",
  "fresh_cache",
]);
if (!allowedGenerationStatuses.has(llmGeneration.data.status)) {
  throw new Error(
    `Unexpected LLM generation status: ${llmGeneration.data.status}`,
  );
}
console.log(`[ok] LLM generation status ${llmGeneration.data.status}`);

const shopeeStatus = await invokeStatus(
  "GET",
  "/integrations/shopee/stores",
  adminHeaders,
);
if (shopeeStatus !== 404) {
  throw new Error(
    `Expected inactive Shopee route to return 404, got ${shopeeStatus}`,
  );
}
console.log("[ok] Shopee integration route is not exposed");

console.log("MVP smoke checks completed.");
