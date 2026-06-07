import assert from "node:assert/strict";
import test from "node:test";

import { BadRequestException, ForbiddenException } from "@nestjs/common";

import type { CurrentUser } from "../auth/dto";
import { SyncController } from "./sync.controller";
import { SyncService } from "./sync.service";

const branchUser: CurrentUser = {
  id: "cashier-1",
  full_name: "Cashier",
  username: "cashier",
  role_code: "cashier",
  branch_id: "branch-a",
};

const validBundle = {
  event_id: "event-transaction-1",
  event_type: "transaction.bundle",
  event_version: 1,
  branch_id: "branch-a",
  source_system: "branch_app",
  source_mode: "offline_replay",
  occurred_at: "2026-06-07T00:00:00.000Z",
  produced_by_user_id: "cashier-1",
  payload: {
    transaction: {
      id: "transaction-1",
      transaction_no: "TRX-001",
      branch_id: "branch-a",
      register_id: "register-1",
      shift_id: null,
      cashier_user_id: "cashier-1",
      transaction_datetime: "2026-06-07T00:00:00.000Z",
      subtotal_amount: 100000,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: 100000,
      payment_status: "paid",
      transaction_status: "completed",
      source_mode: "offline_replay",
      local_reference_id: "local-transaction-1",
    },
    items: [
      {
        id: "item-1",
        product_id: "product-1",
        product_name_snapshot: "Product",
        sku_snapshot: "SKU-1",
        unit_price: 100000,
        quantity: 1,
        discount_amount: 0,
        tax_amount: 0,
        line_total: 100000,
      },
    ],
    payments: [
      {
        id: "payment-1",
        payment_method_code: "cash",
        amount: 100000,
        payment_status: "paid",
        paid_at: "2026-06-07T00:00:00.000Z",
      },
    ],
    stock_movements: [
      {
        id: "movement-1",
        product_id: "product-1",
        source_type: "sales_transaction",
        source_id: "transaction-1",
        movement_type: "sale_out",
        quantity_delta: -1,
        reason_code: "sale",
        performed_by_user_id: "cashier-1",
        movement_at: "2026-06-07T00:00:00.000Z",
      },
    ],
  },
};

const validStockMovementEvent = {
  event_id: "event-stock-movement-1",
  event_type: "stock_movement.created" as const,
  event_version: "1",
  branch_id: "branch-a",
  source_system: "branch_app",
  source_mode: "offline_replay" as const,
  entity_type: "stock_movement",
  entity_id: "movement-standalone-1",
  occurred_at: "2026-06-07T00:00:00.000Z",
  produced_by_user_id: "cashier-1",
  payload: {
    stock_movement: {
      id: "movement-standalone-1",
      branch_id: "branch-a",
      product_id: "product-1",
      source_type: "inventory_adjustment",
      source_id: "adjustment-1",
      movement_type: "adjustment_plus" as const,
      quantity_delta: 1,
      quantity_before: 5,
      quantity_after: 6,
      reason_code: "manual_adjustment",
      performed_by_user_id: "cashier-1",
      movement_at: "2026-06-07T00:00:00.000Z",
    },
  },
};

test("SyncController rejects branch users replaying another branch bundle", () => {
  let called = false;
  const controller = new SyncController({
    receiveBundle: () => {
      called = true;
    },
  } as unknown as SyncService);

  assert.throws(
    () =>
      controller.receiveBundle(
        { user: branchUser },
        { ...validBundle, branch_id: "branch-b" },
      ),
    ForbiddenException,
  );
  assert.equal(called, false);
});

test("SyncController rejects events produced as another user", () => {
  let called = false;
  const controller = new SyncController({
    receiveEvent: () => {
      called = true;
    },
  } as unknown as SyncService);

  assert.throws(
    () =>
      controller.receiveEvent(
        { user: branchUser },
        {
          ...validStockMovementEvent,
          produced_by_user_id: "another-user",
        },
      ),
    ForbiddenException,
  );
  assert.equal(called, false);
});

test("SyncService returns idempotent duplicate result before applying bundle", async () => {
  const processedAt = new Date("2026-06-07T01:00:00.000Z");
  let transactionCalled = false;
  let queued = false;
  const service = new SyncService(
    {
      enqueueSyncBundle: async () => {
        queued = true;
        return "queue-job-1";
      },
    } as never,
    {
      syncLog: {
        findFirst: async () => ({
          eventId: validBundle.event_id,
          entityId: validBundle.payload.transaction.id,
          loggedAt: processedAt,
          status: "APPLIED",
          syncJobId: "sync-job-1",
        }),
      },
      $transaction: async () => {
        transactionCalled = true;
      },
    } as never,
  );

  const result = await service.receiveBundle(validBundle, validBundle.event_id);

  assert.equal(result.success, true);
  assert.equal(result.data.result_status, "duplicate_ignored");
  assert.equal(result.data.entity_id, validBundle.payload.transaction.id);
  assert.equal(result.data.sync_job_id, "sync-job-1");
  assert.equal(result.data.processed_at, processedAt);
  assert.equal(transactionCalled, false);
  assert.equal(queued, false);
});

test("SyncService rejects bundle when item subtotal does not match transaction subtotal", async () => {
  let transactionCalled = false;
  const service = new SyncService(
    {
      enqueueSyncBundle: async () => "queue-job-1",
    } as never,
    {
      syncLog: {
        findFirst: async () => null,
      },
      $transaction: async () => {
        transactionCalled = true;
      },
    } as never,
  );

  await assert.rejects(
    () =>
      service.receiveBundle({
        ...validBundle,
        payload: {
          ...validBundle.payload,
          transaction: {
            ...validBundle.payload.transaction,
            subtotal_amount: 110000,
            total_amount: 110000,
          },
          payments: [
            {
              ...validBundle.payload.payments[0],
              amount: 110000,
            },
          ],
        },
      }),
    BadRequestException,
  );

  assert.equal(transactionCalled, false);
});

test("SyncService rejects bundle when source mode does not match transaction source mode", async () => {
  let transactionCalled = false;
  const service = new SyncService(
    {
      enqueueSyncBundle: async () => "queue-job-1",
    } as never,
    {
      syncLog: {
        findFirst: async () => null,
      },
      $transaction: async () => {
        transactionCalled = true;
      },
    } as never,
  );

  await assert.rejects(
    () =>
      service.receiveBundle({
        ...validBundle,
        source_mode: "online",
      }),
    BadRequestException,
  );

  assert.equal(transactionCalled, false);
});

test("SyncService rejects inconsistent paid bundle before database transaction", async () => {
  let transactionCalled = false;
  const service = new SyncService(
    {
      enqueueSyncBundle: async () => "queue-job-1",
    } as never,
    {
      syncLog: {
        findFirst: async () => null,
      },
      $transaction: async () => {
        transactionCalled = true;
      },
    } as never,
  );

  await assert.rejects(
    () =>
      service.receiveBundle({
        ...validBundle,
        payload: {
          ...validBundle.payload,
          transaction: {
            ...validBundle.payload.transaction,
            total_amount: 90000,
          },
        },
      }),
    BadRequestException,
  );

  assert.equal(transactionCalled, false);
});

test("SyncService rejects invalid standalone stock movement direction", async () => {
  let transactionCalled = false;
  const service = new SyncService(
    {
      enqueueSyncEvent: async () => "queue-job-1",
    } as never,
    {
      syncLog: {
        findFirst: async () => null,
      },
      $transaction: async () => {
        transactionCalled = true;
      },
    } as never,
  );

  await assert.rejects(
    () =>
      service.receiveEvent({
        ...validStockMovementEvent,
        payload: {
          stock_movement: {
            ...validStockMovementEvent.payload.stock_movement,
            movement_type: "adjustment_plus",
            quantity_delta: -1,
          },
        },
      }),
    BadRequestException,
  );

  assert.equal(transactionCalled, false);
});

test("SyncService rejects standalone movement when central stock would be negative", async () => {
  let movementCreated = false;
  const service = new SyncService(
    {
      enqueueSyncEvent: async () => "queue-job-1",
    } as never,
    {
      syncLog: {
        findFirst: async () => null,
      },
      $transaction: async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          branch: { findUnique: async () => ({ id: "branch-a" }) },
          product: { findUnique: async () => ({ id: "product-1" }) },
          user: { findMany: async () => [{ id: "cashier-1" }] },
          syncJob: {
            create: async () => ({ id: "sync-job-1" }),
          },
          stockMovement: {
            findUnique: async () => null,
            create: async () => {
              movementCreated = true;
            },
          },
          inventoryBalance: {
            upsert: async () => ({ quantityOnHand: 1 }),
          },
        }),
    } as never,
  );

  await assert.rejects(
    () =>
      service.receiveEvent({
        ...validStockMovementEvent,
        payload: {
          stock_movement: {
            ...validStockMovementEvent.payload.stock_movement,
            movement_type: "adjustment_minus",
            quantity_delta: -2,
            quantity_before: 1,
            quantity_after: -1,
          },
        },
      }),
    BadRequestException,
  );

  assert.equal(movementCreated, false);
});

test("SyncService rejects standalone movement with inconsistent balance snapshot", async () => {
  let movementCreated = false;
  const service = new SyncService(
    {
      enqueueSyncEvent: async () => "queue-job-1",
    } as never,
    {
      syncLog: {
        findFirst: async () => null,
      },
      $transaction: async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          branch: { findUnique: async () => ({ id: "branch-a" }) },
          product: { findUnique: async () => ({ id: "product-1" }) },
          user: { findMany: async () => [{ id: "cashier-1" }] },
          syncJob: {
            create: async () => ({ id: "sync-job-1" }),
          },
          stockMovement: {
            findUnique: async () => null,
            create: async () => {
              movementCreated = true;
            },
          },
          inventoryBalance: {
            upsert: async () => ({ quantityOnHand: 5 }),
          },
        }),
    } as never,
  );

  await assert.rejects(
    () =>
      service.receiveEvent({
        ...validStockMovementEvent,
        payload: {
          stock_movement: {
            ...validStockMovementEvent.payload.stock_movement,
            quantity_before: 5,
            quantity_after: 9,
          },
        },
      }),
    BadRequestException,
  );

  assert.equal(movementCreated, false);
});

test("SyncService rejects invalid sale stock movement direction", async () => {
  let transactionCalled = false;
  const service = new SyncService(
    {
      enqueueSyncBundle: async () => "queue-job-1",
    } as never,
    {
      syncLog: {
        findFirst: async () => null,
      },
      $transaction: async () => {
        transactionCalled = true;
      },
    } as never,
  );

  await assert.rejects(
    () =>
      service.receiveBundle({
        ...validBundle,
        payload: {
          ...validBundle.payload,
          stock_movements: [
            {
              ...validBundle.payload.stock_movements[0],
              quantity_delta: 1,
            },
          ],
        },
      }),
    BadRequestException,
  );

  assert.equal(transactionCalled, false);
});

test("SyncService rejects sale movements that do not match item quantities", async () => {
  let transactionCalled = false;
  const service = new SyncService(
    {
      enqueueSyncBundle: async () => "queue-job-1",
    } as never,
    {
      syncLog: {
        findFirst: async () => null,
      },
      $transaction: async () => {
        transactionCalled = true;
      },
    } as never,
  );

  await assert.rejects(
    () =>
      service.receiveBundle({
        ...validBundle,
        payload: {
          ...validBundle.payload,
          stock_movements: [
            {
              ...validBundle.payload.stock_movements[0],
              quantity_delta: -2,
            },
          ],
        },
      }),
    BadRequestException,
  );

  assert.equal(transactionCalled, false);
});

test("SyncService rejects bundle actor that differs from cashier", async () => {
  let transactionCalled = false;
  const service = new SyncService(
    {
      enqueueSyncBundle: async () => "queue-job-1",
    } as never,
    {
      syncLog: {
        findFirst: async () => null,
      },
      $transaction: async () => {
        transactionCalled = true;
      },
    } as never,
  );

  await assert.rejects(
    () =>
      service.receiveBundle({
        ...validBundle,
        produced_by_user_id: "another-user",
      }),
    BadRequestException,
  );

  assert.equal(transactionCalled, false);
});
