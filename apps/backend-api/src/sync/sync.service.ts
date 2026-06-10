import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import {
  PaymentStatus,
  Prisma,
  ShiftStatus,
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
        quantity_before: quantitySchema.optional(),
        quantity_after: quantitySchema.optional(),
        reason_code: z.string().min(1),
        notes: z.string().nullable().optional(),
        performed_by_user_id: z.string().nullable().optional(),
        movement_at: z.string().datetime(),
      }),
    ),
  }),
});

type ParsedSyncBundle = z.infer<typeof syncBundleSchema>;

const shiftEventSchema = z.object({
  event_id: z.string().min(1),
  event_type: z.enum(["shift.opened", "shift.closed"]),
  event_version: z.coerce.number().int().positive(),
  branch_id: z.string().min(1),
  source_system: z.string().min(1),
  source_mode: z.enum(["online", "offline_replay"]),
  entity_type: z.literal("shift"),
  entity_id: z.string().min(1),
  occurred_at: z.string().datetime(),
  produced_by_user_id: z.string().min(1).optional(),
  payload: z.object({
    shift: z.object({
      id: z.string().min(1),
      branch_id: z.string().min(1),
      register_id: z.string().min(1),
      action: z.enum(["open", "close"]).optional(),
      opened_by_user_id: z.string().min(1).optional(),
      closed_by_user_id: z.string().min(1).optional(),
      opened_at: z.string().datetime().optional(),
      closed_at: z.string().datetime().optional(),
      occurred_at: z.string().datetime().optional(),
      opening_cash_amount: moneySchema.optional(),
      closing_cash_amount: moneySchema.nullable().optional(),
      reconciliation: z
        .object({
          total_sales: moneySchema,
          cash_payments: moneySchema,
          non_cash_payments: moneySchema,
          opening_cash: moneySchema,
          expected_cash: moneySchema,
          closing_cash: moneySchema,
          variance: moneySchema,
          pending_count: z.coerce.number().int().nonnegative(),
          pending_total: moneySchema,
        })
        .optional(),
    }),
  }),
});

type ParsedShiftEvent = z.infer<typeof shiftEventSchema>;

const stockMovementCreatedEventSchema = z.object({
  event_id: z.string().min(1),
  event_type: z.literal("stock_movement.created"),
  event_version: z.coerce.number().int().positive(),
  branch_id: z.string().min(1),
  source_system: z.string().min(1),
  source_mode: z.enum(["online", "offline_replay"]),
  entity_type: z.literal("stock_movement"),
  entity_id: z.string().min(1),
  occurred_at: z.string().datetime(),
  produced_by_user_id: z.string().min(1).optional(),
  payload: z.object({
    stock_movement: z.object({
      id: z.string().min(1),
      branch_id: z.string().min(1),
      product_id: z.string().min(1),
      source_type: z.string().min(1),
      source_id: z.string().min(1).nullable().optional(),
      movement_type: z.enum([
        "sale_out",
        "stock_in",
        "adjustment_plus",
        "adjustment_minus",
        "sync_correction",
      ]),
      quantity_delta: quantitySchema,
      quantity_before: quantitySchema.optional(),
      quantity_after: quantitySchema.optional(),
      reason_code: z.string().min(1),
      notes: z.string().nullable().optional(),
      performed_by_user_id: z.string().min(1).nullable().optional(),
      movement_at: z.string().datetime(),
    }),
  }),
});

type ParsedStockMovementCreatedEvent = z.infer<
  typeof stockMovementCreatedEventSchema
>;

@Injectable()
export class SyncService {
  constructor(
    @Inject(QueueService) private readonly queueService: QueueService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async receiveEvent(dto: SyncEventDto, idempotencyKey?: string) {
    if (
      dto.event_type === "shift.opened" ||
      dto.event_type === "shift.closed"
    ) {
      return this.receiveShiftEvent(dto, idempotencyKey);
    }
    if (dto.event_type === "stock_movement.created") {
      return this.receiveStockMovementCreatedEvent(dto, idempotencyKey);
    }

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

  private async receiveShiftEvent(dto: SyncEventDto, idempotencyKey?: string) {
    const parsed = shiftEventSchema.safeParse(dto);

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

    const event = parsed.data;
    const idempotencyKeyValue = idempotencyKey ?? event.event_id;
    const duplicate = await this.prisma.syncLog.findFirst({
      where: {
        OR: [
          { eventId: event.event_id },
          { idempotencyKey: idempotencyKeyValue },
        ],
      },
      select: {
        entityId: true,
        loggedAt: true,
        status: true,
        syncJobId: true,
      },
    });

    if (duplicate) {
      return ok({
        event_id: event.event_id,
        entity_id: duplicate.entityId,
        result_status: "duplicate_ignored",
        processed_at: duplicate.loggedAt,
        sync_job_id: duplicate.syncJobId,
        queue_job_id: null,
      });
    }

    const result = await this.applyShiftEvent(event, idempotencyKeyValue);
    const queueJobId = await this.enqueueShiftJobSafely(event, result);

    return ok({
      event_id: event.event_id,
      entity_id: event.payload.shift.id,
      result_status: result.resultStatus,
      processed_at: result.processedAt,
      sync_job_id: result.syncJobId,
      queue_job_id: queueJobId,
    });
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
    validateBundleConsistency(bundle);

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

  private async applyShiftEvent(
    event: ParsedShiftEvent,
    idempotencyKey: string,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.validateShiftReferences(tx, event);

        const job = await tx.syncJob.create({
          data: {
            branchId: event.branch_id,
            triggeredByUserId: event.produced_by_user_id,
            jobType: toShiftJobType(event.event_type),
            entityType: "shift",
            entityId: event.payload.shift.id,
            payloadReference: event.event_id,
            status: SyncJobStatus.PROCESSING,
            attemptCount: 1,
            lastAttemptAt: new Date(),
          },
        });

        const resultStatus =
          event.event_type === "shift.opened"
            ? await this.applyShiftOpened(tx, event)
            : await this.applyShiftClosed(tx, event);

        await tx.syncLog.create({
          data: {
            syncJobId: job.id,
            eventId: event.event_id,
            eventType: event.event_type,
            eventVersion: String(event.event_version),
            branchId: event.branch_id,
            entityType: "shift",
            entityId: event.payload.shift.id,
            status: SyncLogStatus.APPLIED,
            logLevel: "info",
            message: toShiftSyncLogMessage(event.event_type, resultStatus),
            idempotencyKey,
            payload: event as unknown as Prisma.InputJsonValue,
            producedById: event.produced_by_user_id,
            occurredAt: new Date(event.occurred_at),
          },
        });

        await tx.syncJob.update({
          where: { id: job.id },
          data: { status: SyncJobStatus.SUCCESS },
        });

        await tx.auditLog.create({
          data: {
            userId: event.produced_by_user_id,
            branchId: event.branch_id,
            entityType: "shift",
            entityId: event.payload.shift.id,
            action: toShiftAuditAction(event.event_type),
            note: `Applied sync event ${event.event_id}`,
          },
        });

        return {
          syncJobId: job.id,
          resultStatus,
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

  private async validateShiftReferences(
    tx: Prisma.TransactionClient,
    event: ParsedShiftEvent,
  ) {
    const shift = event.payload.shift;

    if (event.branch_id !== shift.branch_id) {
      throw validationError("branch_id does not match shift.branch_id");
    }
    if (event.entity_id !== shift.id) {
      throw validationError("entity_id does not match shift.id");
    }
    if (event.event_type === "shift.opened" && shift.action === "close") {
      throw validationError("shift.opened payload action must not be close");
    }
    if (event.event_type === "shift.closed" && shift.action === "open") {
      throw validationError("shift.closed payload action must not be open");
    }
    if (event.event_type === "shift.opened" && !shift.opened_by_user_id) {
      throw validationError("opened_by_user_id is required for shift.opened");
    }
    if (event.event_type === "shift.closed" && !shift.closed_by_user_id) {
      throw validationError("closed_by_user_id is required for shift.closed");
    }

    const userId =
      event.event_type === "shift.opened"
        ? shift.opened_by_user_id
        : shift.closed_by_user_id;
    const [branch, register, user] = await Promise.all([
      tx.branch.findFirst({
        where: { id: event.branch_id, isActive: true },
      }),
      tx.register.findFirst({
        where: {
          id: shift.register_id,
          branchId: event.branch_id,
          isActive: true,
        },
      }),
      tx.user.findFirst({
        where: {
          id: userId,
          isActive: true,
          OR: [{ branchId: event.branch_id }, { branchId: null }],
        },
      }),
    ]);

    if (!branch) {
      throw validationError("branch_id is not registered");
    }
    if (!register) {
      throw validationError("register_id is not valid for branch_id");
    }
    if (!user) {
      throw validationError("shift user_id is not registered");
    }
  }

  private async applyShiftOpened(
    tx: Prisma.TransactionClient,
    event: ParsedShiftEvent,
  ) {
    const shift = event.payload.shift;
    const existingShift = await tx.shift.findUnique({
      where: { id: shift.id },
      select: { id: true },
    });

    if (existingShift) {
      return "duplicate_ignored";
    }

    const activeRegisterShift = await tx.shift.findFirst({
      where: {
        registerId: shift.register_id,
        status: ShiftStatus.OPEN,
      },
      select: { id: true },
    });
    if (activeRegisterShift) {
      throw validationError("register already has an active shift");
    }

    await tx.shift.create({
      data: {
        id: shift.id,
        branchId: event.branch_id,
        registerId: shift.register_id,
        openedByUserId: shift.opened_by_user_id!,
        openedAt: new Date(
          shift.opened_at ?? shift.occurred_at ?? event.occurred_at,
        ),
        openingCashAmount: shift.opening_cash_amount,
        status: ShiftStatus.OPEN,
      },
    });

    return "synced";
  }

  private async applyShiftClosed(
    tx: Prisma.TransactionClient,
    event: ParsedShiftEvent,
  ) {
    const shift = event.payload.shift;
    const existingShift = await tx.shift.findUnique({
      where: { id: shift.id },
      select: {
        id: true,
        branchId: true,
        registerId: true,
        openedAt: true,
        status: true,
      },
    });

    if (!existingShift) {
      throw validationError("shift.id is not registered");
    }
    if (
      existingShift.branchId !== event.branch_id ||
      existingShift.registerId !== shift.register_id
    ) {
      throw validationError("shift branch_id/register_id does not match");
    }
    if (existingShift.status !== ShiftStatus.OPEN) {
      throw validationError("shift is not open");
    }

    const closedAt = new Date(
      shift.closed_at ?? shift.occurred_at ?? event.occurred_at,
    );
    if (closedAt < existingShift.openedAt) {
      throw validationError("closed_at cannot be before opened_at");
    }

    await tx.shift.update({
      where: { id: shift.id },
      data: {
        closedByUserId: shift.closed_by_user_id!,
        closedAt,
        closingCashAmount: shift.closing_cash_amount ?? undefined,
        status: ShiftStatus.CLOSED,
      },
    });

    return "synced";
  }

  private async enqueueShiftJobSafely(
    event: ParsedShiftEvent,
    result: { syncJobId: string; resultStatus: string },
  ): Promise<string | null> {
    try {
      return await this.queueService.enqueueSyncEvent(event.event_id, {
        event_id: event.event_id,
        sync_job_id: result.syncJobId,
        result_status: result.resultStatus,
      });
    } catch (error) {
      await this.prisma.syncLog.update({
        where: { eventId: event.event_id },
        data: {
          message:
            "Shift sync event applied; BullMQ acknowledgement job was not queued.",
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });

      return null;
    }
  }

  private async receiveStockMovementCreatedEvent(
    dto: SyncEventDto,
    idempotencyKey?: string,
  ) {
    const parsed = stockMovementCreatedEventSchema.safeParse(dto);

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

    const event = parsed.data;
    validateStockMovementEventConsistency(event);

    const idempotencyKeyValue = idempotencyKey ?? event.event_id;
    const duplicate = await this.prisma.syncLog.findFirst({
      where: {
        OR: [
          { eventId: event.event_id },
          { idempotencyKey: idempotencyKeyValue },
        ],
      },
      select: {
        entityId: true,
        loggedAt: true,
        status: true,
        syncJobId: true,
      },
    });

    if (duplicate) {
      return ok({
        event_id: event.event_id,
        entity_id: duplicate.entityId,
        result_status: "duplicate_ignored",
        processed_at: duplicate.loggedAt,
        sync_job_id: duplicate.syncJobId,
        queue_job_id: null,
      });
    }

    const result = await this.applyStockMovementCreatedEvent(
      event,
      idempotencyKeyValue,
    );
    const queueJobId = await this.enqueueStockMovementJobSafely(event, result);

    return ok({
      event_id: event.event_id,
      entity_id: event.payload.stock_movement.id,
      result_status: result.resultStatus,
      processed_at: result.processedAt,
      sync_job_id: result.syncJobId,
      queue_job_id: queueJobId,
    });
  }

  private async applyStockMovementCreatedEvent(
    event: ParsedStockMovementCreatedEvent,
    idempotencyKey: string,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.validateStockMovementEventReferences(tx, event);

        const movement = event.payload.stock_movement;
        const job = await tx.syncJob.create({
          data: {
            branchId: event.branch_id,
            triggeredByUserId: event.produced_by_user_id,
            jobType: "push_stock_movement_created",
            entityType: "stock_movement",
            entityId: movement.id,
            payloadReference: event.event_id,
            status: SyncJobStatus.PROCESSING,
            attemptCount: 1,
            lastAttemptAt: new Date(),
          },
        });

        const existingMovement = await tx.stockMovement.findUnique({
          where: { id: movement.id },
          select: { id: true },
        });

        let resultStatus = "synced";
        if (existingMovement) {
          resultStatus = "duplicate_ignored";
        } else {
          await this.applyStandaloneStockMovement(tx, event);
        }

        await tx.syncLog.create({
          data: {
            syncJobId: job.id,
            eventId: event.event_id,
            eventType: event.event_type,
            eventVersion: String(event.event_version),
            branchId: event.branch_id,
            entityType: "stock_movement",
            entityId: movement.id,
            status:
              resultStatus === "duplicate_ignored"
                ? SyncLogStatus.DUPLICATE_IGNORED
                : SyncLogStatus.APPLIED,
            logLevel: "info",
            message:
              resultStatus === "duplicate_ignored"
                ? "Stock movement already applied by movement id."
                : "Stock movement created sync event applied.",
            idempotencyKey,
            payload: event as unknown as Prisma.InputJsonValue,
            producedById: event.produced_by_user_id,
            occurredAt: new Date(event.occurred_at),
          },
        });

        await tx.syncJob.update({
          where: { id: job.id },
          data: { status: SyncJobStatus.SUCCESS },
        });

        await tx.auditLog.create({
          data: {
            userId:
              movement.performed_by_user_id ??
              event.produced_by_user_id ??
              undefined,
            branchId: event.branch_id,
            entityType: "stock_movement",
            entityId: movement.id,
            action:
              resultStatus === "duplicate_ignored"
                ? "sync_stock_movement_duplicate_ignored"
                : "sync_stock_movement_created",
            note: `Applied sync event ${event.event_id}`,
          },
        });

        return {
          syncJobId: job.id,
          resultStatus,
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

  private async validateStockMovementEventReferences(
    tx: Prisma.TransactionClient,
    event: ParsedStockMovementCreatedEvent,
  ) {
    const movement = event.payload.stock_movement;

    if (event.branch_id !== movement.branch_id) {
      throw validationError(
        "branch_id does not match stock_movement.branch_id",
      );
    }
    if (event.entity_id !== movement.id) {
      throw validationError("entity_id does not match stock_movement.id");
    }

    const userIds = [
      movement.performed_by_user_id,
      event.produced_by_user_id,
    ].filter((userId): userId is string => Boolean(userId));
    const [branch, product, users] = await Promise.all([
      tx.branch.findUnique({ where: { id: event.branch_id } }),
      tx.product.findUnique({ where: { id: movement.product_id } }),
      userIds.length > 0
        ? tx.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true },
          })
        : Promise.resolve([]),
    ]);

    if (!branch) {
      throw validationError("branch_id is not registered");
    }
    if (!product) {
      throw validationError("product_id is not registered");
    }
    if (users.length !== new Set(userIds).size) {
      throw validationError("user_id is not registered");
    }
  }

  private async applyStandaloneStockMovement(
    tx: Prisma.TransactionClient,
    event: ParsedStockMovementCreatedEvent,
  ) {
    const movement = event.payload.stock_movement;
    const balance = await tx.inventoryBalance.upsert({
      where: {
        branchId_productId: {
          branchId: event.branch_id,
          productId: movement.product_id,
        },
      },
      create: {
        branchId: event.branch_id,
        productId: movement.product_id,
        quantityOnHand: 0,
      },
      update: {},
    });
    const before = new Prisma.Decimal(balance.quantityOnHand);
    const delta = new Prisma.Decimal(movement.quantity_delta);
    const after = before.plus(delta);
    assertStockMovementBalanceSnapshot(movement, before, after);
    if (after.lessThan(0)) {
      throw validationError(
        `insufficient central stock for product ${movement.product_id}`,
      );
    }

    await tx.stockMovement.create({
      data: {
        id: movement.id,
        branchId: event.branch_id,
        productId: movement.product_id,
        sourceType: movement.source_type,
        sourceId: movement.source_id ?? undefined,
        movementType: toStockMovementType(movement.movement_type),
        quantityDelta: delta,
        quantityBefore: before,
        quantityAfter: after,
        reasonCode: movement.reason_code,
        notes: movement.notes ?? undefined,
        performedByUserId: movement.performed_by_user_id ?? undefined,
        movementAt: new Date(movement.movement_at),
        syncStatus: "synced",
      },
    });

    await tx.inventoryBalance.update({
      where: {
        branchId_productId: {
          branchId: event.branch_id,
          productId: movement.product_id,
        },
      },
      data: {
        quantityOnHand: after,
      },
    });
  }

  private async enqueueStockMovementJobSafely(
    event: ParsedStockMovementCreatedEvent,
    result: { syncJobId: string; resultStatus: string },
  ): Promise<string | null> {
    try {
      return await this.queueService.enqueueSyncEvent(event.event_id, {
        event_id: event.event_id,
        sync_job_id: result.syncJobId,
        result_status: result.resultStatus,
      });
    } catch (error) {
      await this.prisma.syncLog.update({
        where: { eventId: event.event_id },
        data: {
          message:
            "Stock movement sync event applied; BullMQ acknowledgement job was not queued.",
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });

      return null;
    }
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

    const transactionAt = new Date(
      bundle.payload.transaction.transaction_datetime,
    );
    const [branch, register, cashier, shift] = await Promise.all([
      tx.branch.findFirst({
        where: { id: bundle.branch_id, isActive: true },
      }),
      tx.register.findFirst({
        where: {
          id: bundle.payload.transaction.register_id,
          branchId: bundle.branch_id,
          isActive: true,
        },
      }),
      tx.user.findFirst({
        where: {
          id: bundle.payload.transaction.cashier_user_id,
          isActive: true,
          branchId: bundle.branch_id,
        },
      }),
      bundle.payload.transaction.shift_id
        ? tx.shift.findFirst({
            where: {
              id: bundle.payload.transaction.shift_id,
              branchId: bundle.branch_id,
              registerId: bundle.payload.transaction.register_id,
            },
            select: {
              openedAt: true,
              closedAt: true,
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
      throw validationError("shift_id is not valid for branch/register");
    }
    if (
      shift &&
      (transactionAt < shift.openedAt ||
        (shift.closedAt && transactionAt > shift.closedAt))
    ) {
      throw validationError("transaction_datetime is outside the shift window");
    }

    const productIds = new Set([
      ...bundle.payload.items.map((item) => item.product_id),
      ...bundle.payload.stock_movements.map((movement) => movement.product_id),
    ]);
    const products = await tx.product.findMany({
      where: { id: { in: [...productIds] }, isActive: true },
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
    assertStockMovementBalanceSnapshot(movement, before, after);
    if (after.lessThan(0)) {
      throw validationError(
        `insufficient central stock for product ${movement.product_id}`,
      );
    }

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

function validateBundleConsistency(bundle: ParsedSyncBundle): void {
  const { transaction, items, payments, stock_movements: movements } =
    bundle.payload;

  assertUniqueValues(
    "item.id",
    items.map((item) => item.id),
  );
  assertUniqueValues(
    "payment.id",
    payments.map((payment) => payment.id),
  );
  assertUniqueValues(
    "stock_movement.id",
    movements.map((movement) => movement.id),
  );

  const expectedTotal = decimal(transaction.subtotal_amount)
    .minus(transaction.discount_amount)
    .plus(transaction.tax_amount);

  if (bundle.source_mode !== transaction.source_mode) {
    throw validationError("source_mode does not match transaction.source_mode");
  }
  if (
    bundle.produced_by_user_id &&
    bundle.produced_by_user_id !== transaction.cashier_user_id
  ) {
    throw validationError(
      "produced_by_user_id does not match cashier_user_id",
    );
  }

  const itemSubtotal = items.reduce(
    (total, item) => total.plus(decimal(item.unit_price).mul(item.quantity)),
    new Prisma.Decimal(0),
  );

  if (!itemSubtotal.equals(transaction.subtotal_amount)) {
    throw validationError("transaction subtotal_amount is inconsistent");
  }

  const itemDiscountTotal = items.reduce(
    (total, item) => total.plus(item.discount_amount),
    new Prisma.Decimal(0),
  );
  if (!itemDiscountTotal.equals(transaction.discount_amount)) {
    throw validationError("transaction discount_amount is inconsistent");
  }

  if (!expectedTotal.equals(transaction.total_amount)) {
    throw validationError("transaction total_amount is inconsistent");
  }

  for (const item of items) {
    const expectedLineTotal = decimal(item.unit_price)
      .mul(item.quantity)
      .minus(item.discount_amount)
      .plus(item.tax_amount);

    if (!expectedLineTotal.equals(item.line_total)) {
      throw validationError(`line_total is inconsistent for item ${item.id}`);
    }
  }

  if (transaction.payment_status === "paid") {
    const paidAmount = payments
      .filter((payment) => payment.payment_status === "paid")
      .reduce(
        (total, payment) => total.plus(payment.amount),
        new Prisma.Decimal(0),
      );

    if (paidAmount.lessThan(transaction.total_amount)) {
      throw validationError("paid transaction requires sufficient payment");
    }
  }

  for (const movement of movements) {
    validateStockMovementDirection(
      movement.movement_type,
      movement.quantity_delta,
    );
    if (
      movement.source_id &&
      movement.source_id !== transaction.id
    ) {
      throw validationError(
        `stock movement source_id is inconsistent for ${movement.id}`,
      );
    }
    if (
      movement.performed_by_user_id &&
      movement.performed_by_user_id !== transaction.cashier_user_id
    ) {
      throw validationError(
        `stock movement actor is inconsistent for ${movement.id}`,
      );
    }
  }

  const itemQuantityByProduct = sumQuantityByProduct(
    items.map((item) => ({
      productId: item.product_id,
      quantity: decimal(item.quantity),
    })),
  );
  const movementQuantityByProduct = sumQuantityByProduct(
    movements
      .filter((movement) => movement.movement_type === "sale_out")
      .map((movement) => ({
        productId: movement.product_id,
        quantity: decimal(movement.quantity_delta).negated(),
      })),
  );

  if (
    itemQuantityByProduct.size !== movementQuantityByProduct.size ||
    [...itemQuantityByProduct].some(
      ([productId, quantity]) =>
        !quantity.equals(movementQuantityByProduct.get(productId) ?? -1),
    )
  ) {
    throw validationError(
      "sale stock movements do not match transaction item quantities",
    );
  }
}

function validateStockMovementEventConsistency(
  event: ParsedStockMovementCreatedEvent,
): void {
  const movement = event.payload.stock_movement;
  validateStockMovementDirection(
    movement.movement_type,
    movement.quantity_delta,
  );
}

function validateStockMovementDirection(
  movementType: string,
  quantityDelta: number,
): void {
  const delta = decimal(quantityDelta);

  if (movementType === "sale_out" && !delta.lessThan(0)) {
    throw validationError("sale_out movement quantity_delta must be negative");
  }
  if (movementType === "adjustment_minus" && !delta.lessThan(0)) {
    throw validationError(
      "adjustment_minus movement quantity_delta must be negative",
    );
  }
  if (
    (movementType === "stock_in" || movementType === "adjustment_plus") &&
    !delta.greaterThan(0)
  ) {
    throw validationError(
      `${movementType} movement quantity_delta must be positive`,
    );
  }
}

function assertUniqueValues(label: string, values: string[]): void {
  if (new Set(values).size !== values.length) {
    throw validationError(`${label} values must be unique`);
  }
}

function sumQuantityByProduct(
  rows: Array<{ productId: string; quantity: Prisma.Decimal }>,
) {
  const totals = new Map<string, Prisma.Decimal>();
  for (const row of rows) {
    totals.set(
      row.productId,
      (totals.get(row.productId) ?? new Prisma.Decimal(0)).plus(row.quantity),
    );
  }

  return totals;
}

function decimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

function toShiftJobType(eventType: ParsedShiftEvent["event_type"]): string {
  return eventType === "shift.opened"
    ? "push_shift_opened"
    : "push_shift_closed";
}

function toShiftAuditAction(eventType: ParsedShiftEvent["event_type"]): string {
  return eventType === "shift.opened"
    ? "sync_shift_opened"
    : "sync_shift_closed";
}

function toShiftSyncLogMessage(
  eventType: ParsedShiftEvent["event_type"],
  resultStatus: string,
): string {
  if (resultStatus === "duplicate_ignored") {
    return "Shift sync event already applied by shift id.";
  }

  return eventType === "shift.opened"
    ? "Shift opened sync event applied."
    : "Shift closed sync event applied.";
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

function assertStockMovementBalanceSnapshot(
  movement: {
    quantity_before?: unknown;
    quantity_after?: unknown;
    id: string;
  },
  before: Prisma.Decimal,
  after: Prisma.Decimal,
) {
  if (
    movement.quantity_before !== undefined &&
    !new Prisma.Decimal(movement.quantity_before as Prisma.Decimal.Value).equals(
      before,
    )
  ) {
    throw validationError(
      `stock movement quantity_before is inconsistent for ${movement.id}`,
    );
  }
  if (
    movement.quantity_after !== undefined &&
    !new Prisma.Decimal(movement.quantity_after as Prisma.Decimal.Value).equals(
      after,
    )
  ) {
    throw validationError(
      `stock movement quantity_after is inconsistent for ${movement.id}`,
    );
  }
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
