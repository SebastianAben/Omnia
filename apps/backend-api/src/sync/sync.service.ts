import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import {
  PaymentStatus,
  Prisma,
  SourceMode,
  StockMovementType,
  SyncJobStatus,
  SyncLogStatus,
  TransactionStatus,
} from "@prisma/client";
import { z } from "zod";

import { ok } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";
import { QueueService } from "../queue/queue.service";
import { SyncEventDto } from "./sync.dto";

const paymentStatusSchema = z.enum([
  "pending",
  "paid",
  "partially_paid",
  "failed",
]);

const moneySchema = z.number().finite().nonnegative();
const quantitySchema = z.number().finite();

const syncBundleSchema = z.object({
  event_id: z.string().min(1),
  event_type: z.literal("transaction.bundle"),
  event_version: z.coerce.number().int().positive(),
  branch_id: z.string().min(1),
  source_system: z.literal("branch_app"),
  source_mode: z.enum(["online", "offline_replay"]),
  occurred_at: z.string().datetime(),
  produced_by_user_id: z.string().min(1).optional(),
  payload: z.object({
    transaction: z.object({
      id: z.string().min(1),
      transaction_no: z.string().min(1),
      branch_id: z.string().min(1),
      register_id: z.string().min(1),
      shift_id: z.string().min(1).nullable().optional(),
      cashier_user_id: z.string().min(1),
      transaction_datetime: z.string().datetime(),
      subtotal_amount: moneySchema,
      discount_amount: moneySchema.default(0),
      tax_amount: moneySchema.default(0),
      total_amount: moneySchema,
      payment_status: z.enum(["pending", "paid", "partially_paid"]),
      transaction_status: z.enum(["completed", "voided"]),
      source_mode: z.enum(["online", "offline_replay"]),
      local_reference_id: z.string().min(1).nullable().optional(),
    }),
    items: z
      .array(
        z.object({
          id: z.string().min(1),
          product_id: z.string().min(1),
          product_name_snapshot: z.string().min(1),
          sku_snapshot: z.string().min(1),
          unit_price: moneySchema,
          quantity: quantitySchema.positive(),
          discount_amount: moneySchema.default(0),
          tax_amount: moneySchema.default(0),
          line_total: moneySchema,
        }),
      )
      .min(1),
    payments: z.array(
      z.object({
        id: z.string().min(1),
        payment_method_code: z.string().min(1),
        amount: moneySchema,
        payment_status: paymentStatusSchema,
        payment_reference: z.string().nullable().optional(),
        paid_at: z.string().datetime().nullable().optional(),
        notes: z.string().nullable().optional(),
      }),
    ),
    stock_movements: z.array(
      z.object({
        id: z.string().min(1),
        product_id: z.string().min(1),
        source_type: z.string().min(1),
        source_id: z.string().nullable().optional(),
        movement_type: z.enum([
          "sale_out",
          "stock_in",
          "adjustment_plus",
          "adjustment_minus",
          "sync_correction",
        ]),
        quantity_delta: quantitySchema,
        reason_code: z.string().min(1),
        notes: z.string().nullable().optional(),
        performed_by_user_id: z.string().nullable().optional(),
        movement_at: z.string().datetime(),
      }),
    ),
  }),
});

type ParsedSyncBundle = z.infer<typeof syncBundleSchema>;

@Injectable()
export class SyncService {
  constructor(
    @Inject(QueueService) private readonly queueService: QueueService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async receiveEvent(dto: SyncEventDto, idempotencyKey?: string) {
    const idempotencyKeyValue = idempotencyKey ?? dto.event_id;
    const queueJobId = await this.queueService.enqueueSyncEvent(
      idempotencyKeyValue,
      {
        ...dto,
        idempotency_key: idempotencyKeyValue,
      },
    );

    return {
      success: true,
      data: {
        event_id: dto.event_id,
        status: "received",
        idempotency_key: idempotencyKeyValue,
        queue_job_id: queueJobId,
      },
    };
  }

  async receiveBundle(input: unknown, idempotencyKey?: string) {
    const parsed = syncBundleSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException({
        success: false,
        message: "validation failed",
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.issues,
        },
      });
    }

    const bundle = parsed.data;
    const idempotencyKeyValue = idempotencyKey ?? bundle.event_id;
    const duplicate = await this.prisma.syncLog.findFirst({
      where: {
        OR: [
          { eventId: bundle.event_id },
          { idempotencyKey: idempotencyKeyValue },
        ],
      },
      select: {
        eventId: true,
        entityId: true,
        loggedAt: true,
        status: true,
        syncJobId: true,
      },
    });

    if (duplicate) {
      return ok({
        event_id: bundle.event_id,
        entity_id: duplicate.entityId,
        result_status: "duplicate_ignored",
        processed_at: duplicate.loggedAt,
        sync_job_id: duplicate.syncJobId,
      });
    }

    const result = await this.applyTransactionBundle(
      bundle,
      idempotencyKeyValue,
    );

    const queueJobId = await this.enqueueBundleJobSafely(bundle, result);

    return ok({
      event_id: bundle.event_id,
      entity_id: bundle.payload.transaction.id,
      result_status: result.resultStatus,
      processed_at: result.processedAt,
      sync_job_id: result.syncJobId,
      queue_job_id: queueJobId,
    });
  }

  async listJobs(filters: {
    branch_id?: string;
    status?: string;
    job_type?: string;
  }) {
    const jobs = await this.prisma.syncJob.findMany({
      where: {
        branchId: filters.branch_id,
        status: toSyncJobStatus(filters.status),
        jobType: filters.job_type,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        branch: {
          select: { code: true, name: true },
        },
      },
    });

    return ok(
      jobs.map((job) => ({
        id: job.id,
        branch_id: job.branchId,
        branch_code: job.branch.code,
        branch_name: job.branch.name,
        job_type: job.jobType,
        entity_type: job.entityType,
        entity_id: job.entityId,
        status: job.status.toLowerCase(),
        attempt_count: job.attemptCount,
        last_attempt_at: job.lastAttemptAt,
        next_retry_at: job.nextRetryAt,
        created_at: job.createdAt,
        updated_at: job.updatedAt,
      })),
    );
  }

  async listLogs(filters: {
    sync_job_id?: string;
    branch_id?: string;
    log_level?: string;
  }) {
    const logs = await this.prisma.syncLog.findMany({
      where: {
        syncJobId: filters.sync_job_id,
        branchId: filters.branch_id,
        logLevel: filters.log_level,
      },
      orderBy: { loggedAt: "desc" },
      take: 100,
    });

    return ok(
      logs.map((log) => ({
        id: log.id,
        sync_job_id: log.syncJobId,
        event_id: log.eventId,
        event_type: log.eventType,
        event_version: log.eventVersion,
        branch_id: log.branchId,
        entity_type: log.entityType,
        entity_id: log.entityId,
        status: log.status.toLowerCase(),
        log_level: log.logLevel,
        message: log.message,
        error_code: log.errorCode,
        error_message: log.errorMessage,
        occurred_at: log.occurredAt,
        logged_at: log.loggedAt,
      })),
    );
  }

  private async applyTransactionBundle(
    bundle: ParsedSyncBundle,
    idempotencyKey: string,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.validateBundleReferences(tx, bundle);

        const existingTransaction = await tx.salesTransaction.findFirst({
          where: {
            OR: [
              { id: bundle.payload.transaction.id },
              { transactionNo: bundle.payload.transaction.transaction_no },
            ],
          },
          select: { id: true },
        });

        if (existingTransaction) {
          return this.recordRejectedBundle(
            tx,
            bundle,
            idempotencyKey,
            "SYNC_CONFLICT",
            "Transaction already exists with a different sync event.",
          );
        }

        const job = await tx.syncJob.create({
          data: {
            branchId: bundle.branch_id,
            triggeredByUserId: bundle.produced_by_user_id,
            jobType: "push_transaction_bundle",
            entityType: "sales_transaction",
            entityId: bundle.payload.transaction.id,
            payloadReference: bundle.event_id,
            status: SyncJobStatus.PROCESSING,
            attemptCount: 1,
            lastAttemptAt: new Date(),
          },
        });

        await tx.salesTransaction.create({
          data: {
            id: bundle.payload.transaction.id,
            transactionNo: bundle.payload.transaction.transaction_no,
            branchId: bundle.payload.transaction.branch_id,
            registerId: bundle.payload.transaction.register_id,
            shiftId: bundle.payload.transaction.shift_id ?? undefined,
            cashierUserId: bundle.payload.transaction.cashier_user_id,
            transactionDatetime: new Date(
              bundle.payload.transaction.transaction_datetime,
            ),
            subtotalAmount: bundle.payload.transaction.subtotal_amount,
            discountAmount: bundle.payload.transaction.discount_amount,
            taxAmount: bundle.payload.transaction.tax_amount,
            totalAmount: bundle.payload.transaction.total_amount,
            paymentStatus: toPaymentStatus(
              bundle.payload.transaction.payment_status,
            ),
            transactionStatus: toTransactionStatus(
              bundle.payload.transaction.transaction_status,
            ),
            sourceMode: toSourceMode(bundle.payload.transaction.source_mode),
            localReferenceId:
              bundle.payload.transaction.local_reference_id ?? undefined,
            syncedAt: new Date(),
          },
        });

        await tx.salesTransactionItem.createMany({
          data: bundle.payload.items.map((item) => ({
            id: item.id,
            salesTransactionId: bundle.payload.transaction.id,
            productId: item.product_id,
            productNameSnapshot: item.product_name_snapshot,
            skuSnapshot: item.sku_snapshot,
            unitPrice: item.unit_price,
            quantity: item.quantity,
            discountAmount: item.discount_amount,
            taxAmount: item.tax_amount,
            lineTotal: item.line_total,
          })),
        });

        if (bundle.payload.payments.length > 0) {
          await tx.payment.createMany({
            data: bundle.payload.payments.map((payment) => ({
              id: payment.id,
              salesTransactionId: bundle.payload.transaction.id,
              paymentMethodCode: payment.payment_method_code,
              amount: payment.amount,
              paymentStatus: toPaymentStatus(payment.payment_status),
              paymentReference: payment.payment_reference ?? undefined,
              paidAt: payment.paid_at ? new Date(payment.paid_at) : undefined,
              notes: payment.notes ?? undefined,
            })),
          });
        }

        for (const movement of bundle.payload.stock_movements) {
          await this.applyStockMovement(tx, bundle, movement);
        }

        await tx.syncLog.create({
          data: {
            syncJobId: job.id,
            eventId: bundle.event_id,
            eventType: bundle.event_type,
            eventVersion: String(bundle.event_version),
            branchId: bundle.branch_id,
            entityType: "sales_transaction",
            entityId: bundle.payload.transaction.id,
            status: SyncLogStatus.APPLIED,
            logLevel: "info",
            message: "Transaction bundle applied atomically.",
            idempotencyKey,
            payload: bundle as unknown as Prisma.InputJsonValue,
            producedById: bundle.produced_by_user_id,
            occurredAt: new Date(bundle.occurred_at),
          },
        });

        await tx.syncJob.update({
          where: { id: job.id },
          data: { status: SyncJobStatus.SUCCESS },
        });

        await tx.auditLog.create({
          data: {
            userId: bundle.produced_by_user_id,
            branchId: bundle.branch_id,
            entityType: "sales_transaction",
            entityId: bundle.payload.transaction.id,
            action: "sync_transaction_bundle",
            note: `Applied sync event ${bundle.event_id}`,
          },
        });

        return {
          syncJobId: job.id,
          resultStatus: "synced",
          processedAt: new Date(),
        };
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException({
        success: false,
        message: "sync failed",
        error: {
          code: "SYNC_FAILED",
          details: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  private async validateBundleReferences(
    tx: Prisma.TransactionClient,
    bundle: ParsedSyncBundle,
  ) {
    if (bundle.branch_id !== bundle.payload.transaction.branch_id) {
      throw validationError("branch_id does not match transaction.branch_id");
    }

    const [branch, register, cashier, shift] = await Promise.all([
      tx.branch.findUnique({ where: { id: bundle.branch_id } }),
      tx.register.findFirst({
        where: {
          id: bundle.payload.transaction.register_id,
          branchId: bundle.branch_id,
        },
      }),
      tx.user.findUnique({
        where: { id: bundle.payload.transaction.cashier_user_id },
      }),
      bundle.payload.transaction.shift_id
        ? tx.shift.findFirst({
            where: {
              id: bundle.payload.transaction.shift_id,
              branchId: bundle.branch_id,
            },
          })
        : Promise.resolve(null),
    ]);

    if (!branch) {
      throw validationError("branch_id is not registered");
    }
    if (!register) {
      throw validationError("register_id is not valid for branch_id");
    }
    if (!cashier) {
      throw validationError("cashier_user_id is not registered");
    }
    if (bundle.payload.transaction.shift_id && !shift) {
      throw validationError("shift_id is not valid for branch_id");
    }

    const productIds = new Set([
      ...bundle.payload.items.map((item) => item.product_id),
      ...bundle.payload.stock_movements.map((movement) => movement.product_id),
    ]);
    const products = await tx.product.findMany({
      where: { id: { in: [...productIds] } },
      select: { id: true },
    });

    if (products.length !== productIds.size) {
      throw validationError("one or more product_id values are not registered");
    }
  }

  private async applyStockMovement(
    tx: Prisma.TransactionClient,
    bundle: ParsedSyncBundle,
    movement: ParsedSyncBundle["payload"]["stock_movements"][number],
  ) {
    const existingMovement = await tx.stockMovement.findUnique({
      where: { id: movement.id },
      select: { id: true },
    });

    if (existingMovement) {
      throw validationError("stock movement id already exists");
    }

    const balance = await tx.inventoryBalance.upsert({
      where: {
        branchId_productId: {
          branchId: bundle.branch_id,
          productId: movement.product_id,
        },
      },
      create: {
        branchId: bundle.branch_id,
        productId: movement.product_id,
        quantityOnHand: 0,
      },
      update: {},
    });
    const before = new Prisma.Decimal(balance.quantityOnHand);
    const delta = new Prisma.Decimal(movement.quantity_delta);
    const after = before.plus(delta);

    await tx.stockMovement.create({
      data: {
        id: movement.id,
        branchId: bundle.branch_id,
        productId: movement.product_id,
        sourceType: movement.source_type,
        sourceId: movement.source_id ?? bundle.payload.transaction.id,
        movementType: toStockMovementType(movement.movement_type),
        quantityDelta: delta,
        quantityBefore: before,
        quantityAfter: after,
        reasonCode: movement.reason_code,
        notes: movement.notes ?? undefined,
        performedByUserId:
          movement.performed_by_user_id ??
          bundle.payload.transaction.cashier_user_id,
        movementAt: new Date(movement.movement_at),
        syncStatus: "synced",
      },
    });

    await tx.inventoryBalance.update({
      where: {
        branchId_productId: {
          branchId: bundle.branch_id,
          productId: movement.product_id,
        },
      },
      data: {
        quantityOnHand: after,
      },
    });
  }

  private async recordRejectedBundle(
    tx: Prisma.TransactionClient,
    bundle: ParsedSyncBundle,
    idempotencyKey: string,
    errorCode: string,
    errorMessage: string,
  ) {
    const job = await tx.syncJob.create({
      data: {
        branchId: bundle.branch_id,
        triggeredByUserId: bundle.produced_by_user_id,
        jobType: "push_transaction_bundle",
        entityType: "sales_transaction",
        entityId: bundle.payload.transaction.id,
        payloadReference: bundle.event_id,
        status: SyncJobStatus.CONFLICT,
        attemptCount: 1,
        lastAttemptAt: new Date(),
      },
    });

    await tx.syncLog.create({
      data: {
        syncJobId: job.id,
        eventId: bundle.event_id,
        eventType: bundle.event_type,
        eventVersion: String(bundle.event_version),
        branchId: bundle.branch_id,
        entityType: "sales_transaction",
        entityId: bundle.payload.transaction.id,
        status: SyncLogStatus.CONFLICT_DETECTED,
        logLevel: "warn",
        message: errorMessage,
        idempotencyKey,
        payload: bundle as unknown as Prisma.InputJsonValue,
        errorCode,
        errorMessage,
        producedById: bundle.produced_by_user_id,
        occurredAt: new Date(bundle.occurred_at),
      },
    });

    return {
      syncJobId: job.id,
      resultStatus: "conflict",
      processedAt: new Date(),
    };
  }

  private async enqueueBundleJobSafely(
    bundle: ParsedSyncBundle,
    result: { syncJobId: string; resultStatus: string },
  ): Promise<string | null> {
    try {
      return await this.queueService.enqueueSyncBundle(bundle.event_id, {
        event_id: bundle.event_id,
        sync_job_id: result.syncJobId,
        result_status: result.resultStatus,
      });
    } catch (error) {
      await this.prisma.syncLog.update({
        where: { eventId: bundle.event_id },
        data: {
          message:
            "Transaction bundle applied; BullMQ acknowledgement job was not queued.",
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });

      return null;
    }
  }
}

function validationError(message: string): BadRequestException {
  return new BadRequestException({
    success: false,
    message: "validation failed",
    error: {
      code: "VALIDATION_ERROR",
      details: [{ message }],
    },
  });
}

function toPaymentStatus(status: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    pending: PaymentStatus.PENDING,
    paid: PaymentStatus.PAID,
    partially_paid: PaymentStatus.PARTIALLY_PAID,
    failed: PaymentStatus.FAILED,
  };

  return map[status] ?? PaymentStatus.PENDING;
}

function toTransactionStatus(status: string): TransactionStatus {
  return status === "voided"
    ? TransactionStatus.VOIDED
    : TransactionStatus.COMPLETED;
}

function toSourceMode(sourceMode: string): SourceMode {
  return sourceMode === "offline_replay"
    ? SourceMode.OFFLINE_REPLAY
    : SourceMode.ONLINE;
}

function toStockMovementType(movementType: string): StockMovementType {
  const map: Record<string, StockMovementType> = {
    sale_out: StockMovementType.SALE_OUT,
    stock_in: StockMovementType.STOCK_IN,
    adjustment_plus: StockMovementType.ADJUSTMENT_PLUS,
    adjustment_minus: StockMovementType.ADJUSTMENT_MINUS,
    sync_correction: StockMovementType.SYNC_CORRECTION,
  };

  return map[movementType] ?? StockMovementType.SYNC_CORRECTION;
}

function toSyncJobStatus(status?: string): SyncJobStatus | undefined {
  if (!status) {
    return undefined;
  }

  const normalized = status.toUpperCase();
  return Object.values(SyncJobStatus).includes(normalized as SyncJobStatus)
    ? (normalized as SyncJobStatus)
    : undefined;
}
