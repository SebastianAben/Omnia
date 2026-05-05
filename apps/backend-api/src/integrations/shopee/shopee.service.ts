import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { Prisma } from "@prisma/client";

import { CurrentUser } from "../../auth/dto";
import { ok } from "../../common/http";
import { appConfig } from "../../config/app.config";
import { PrismaService } from "../../prisma/prisma.service";
import { QueueService } from "../../queue/queue.service";
import {
  ConnectShopeeStoreDto,
  CreateProductMappingDto,
  ShopeeOrderWebhookDto,
} from "./shopee.dto";

const SHOPEE_PROVIDER = "shopee";

type ListMappingsFilters = {
  channel_store_id?: string;
  product_id?: string;
  mapping_status?: string;
};

type ListOrdersFilters = {
  order_status?: string;
  payment_status?: string;
  from?: string;
  to?: string;
};

type WebhookHeaders = {
  secret?: string;
  timestamp?: string;
};

@Injectable()
export class ShopeeService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(QueueService) private readonly queueService: QueueService,
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {}

  async connectStore(dto: ConnectShopeeStoreDto) {
    const channel = await this.ensureShopeeChannel();
    const store = await this.prisma.channelStore.upsert({
      where: {
        salesChannelId_externalStoreId: {
          salesChannelId: channel.id,
          externalStoreId: dto.external_store_id,
        },
      },
      update: {
        storeName: dto.store_name,
        authStatus: "connected",
        credentialReference: dto.credential_reference,
        authPayload: dto.auth_payload
          ? (dto.auth_payload as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        isActive: true,
        connectedAt: new Date(),
      },
      create: {
        salesChannelId: channel.id,
        storeName: dto.store_name,
        externalStoreId: dto.external_store_id,
        authStatus: "connected",
        credentialReference: dto.credential_reference,
        authPayload: dto.auth_payload as Prisma.InputJsonValue | undefined,
        isActive: true,
        connectedAt: new Date(),
      },
    });

    return ok(this.serializeStore(store));
  }

  async listStores() {
    const channel = await this.ensureShopeeChannel();
    const stores = await this.prisma.channelStore.findMany({
      where: { salesChannelId: channel.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { productMappings: true, onlineOrders: true },
        },
      },
    });

    return ok(stores.map((store) => this.serializeStore(store)));
  }

  async createProductMapping(dto: CreateProductMappingDto, user?: CurrentUser) {
    const [store, product] = await Promise.all([
      this.findShopeeStore(dto.channel_store_id),
      this.prisma.product.findUnique({
        where: { id: dto.product_id },
        select: { id: true, sku: true, name: true },
      }),
    ]);
    if (!product) {
      throw new NotFoundException("Product not found");
    }

    const mapping = await this.prisma.productChannelMapping.upsert({
      where: {
        channelStoreId_externalSku: {
          channelStoreId: store.id,
          externalSku: dto.external_sku,
        },
      },
      update: {
        productId: product.id,
        externalProductId: dto.external_product_id,
        mappingStatus: "mapped",
        createdByUserId: user?.id,
      },
      create: {
        channelStoreId: store.id,
        productId: product.id,
        externalProductId: dto.external_product_id,
        externalSku: dto.external_sku,
        mappingStatus: "mapped",
        createdByUserId: user?.id,
      },
      include: { product: true, channelStore: true },
    });

    return ok(this.serializeMapping(mapping));
  }

  async listProductMappings(filters: ListMappingsFilters) {
    const mappings = await this.prisma.productChannelMapping.findMany({
      where: {
        channelStoreId: filters.channel_store_id,
        productId: filters.product_id,
        mappingStatus: filters.mapping_status,
        channelStore: {
          salesChannel: { code: SHOPEE_PROVIDER },
        },
      },
      orderBy: { updatedAt: "desc" },
      include: { product: true, channelStore: true },
      take: 200,
    });

    return ok(mappings.map((mapping) => this.serializeMapping(mapping)));
  }

  async listOrders(filters: ListOrdersFilters) {
    const orders = await this.prisma.onlineOrder.findMany({
      where: {
        salesChannel: { code: SHOPEE_PROVIDER },
        orderStatus: filters.order_status,
        paymentStatus: filters.payment_status,
        orderDatetime: {
          gte: filters.from ? new Date(filters.from) : undefined,
          lte: filters.to ? new Date(filters.to) : undefined,
        },
      },
      orderBy: { orderDatetime: "desc" },
      include: {
        channelStore: true,
        branch: true,
        _count: { select: { items: true } },
      },
      take: 200,
    });

    return ok(
      orders.map((order) => ({
        id: order.id,
        external_order_id: order.externalOrderId,
        channel_store_id: order.channelStoreId,
        store_name: order.channelStore.storeName,
        branch_id: order.branchId,
        branch_name: order.branch?.name ?? null,
        store: {
          id: order.channelStore.id,
          store_name: order.channelStore.storeName,
        },
        order_datetime: order.orderDatetime,
        order_status: order.orderStatus,
        payment_status: order.paymentStatus,
        mapping_status: order.mappingStatus,
        total_amount: order.totalAmount,
        item_count: order._count.items,
        imported_at: order.importedAt,
        processed_at: order.processedAt,
      })),
    );
  }

  async getOrder(orderId: string) {
    const order = await this.prisma.onlineOrder.findFirst({
      where: { id: orderId, salesChannel: { code: SHOPEE_PROVIDER } },
      include: {
        channelStore: true,
        branch: true,
        items: { include: { product: true }, orderBy: { createdAt: "asc" } },
        integrationJobs: { orderBy: { createdAt: "desc" }, take: 10 },
        integrationLogs: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!order) {
      throw new NotFoundException("Shopee order not found");
    }

    return ok({
      id: order.id,
      external_order_id: order.externalOrderId,
      channel_store_id: order.channelStoreId,
      store_name: order.channelStore.storeName,
      branch_id: order.branchId,
      branch_name: order.branch?.name ?? null,
      order_datetime: order.orderDatetime,
      order_status: order.orderStatus,
      payment_status: order.paymentStatus,
      mapping_status: order.mappingStatus,
      subtotal_amount: order.subtotalAmount,
      discount_amount: order.discountAmount,
      shipping_amount: order.shippingAmount,
      total_amount: order.totalAmount,
      imported_at: order.importedAt,
      processed_at: order.processedAt,
      items: order.items.map((item) => ({
        id: item.id,
        product_id: item.productId,
        internal_sku: item.product?.sku ?? null,
        external_product_id: item.externalProductId,
        external_sku: item.externalSku,
        product_name: item.productNameSnapshot,
        product_name_snapshot: item.productNameSnapshot,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        line_total: item.lineTotal,
        mapping_status: item.mappingStatus,
      })),
      jobs: order.integrationJobs,
      logs: order.integrationLogs,
    });
  }

  async receiveOrderWebhook(
    dto: ShopeeOrderWebhookDto,
    headers: WebhookHeaders,
  ) {
    this.assertWebhookSecret(headers);
    const channel = await this.ensureShopeeChannel();
    const store = await this.resolveWebhookStore(channel.id, dto);
    const eventType = dto.event_type ?? "order.created";

    let webhookEvent;
    try {
      webhookEvent = await this.prisma.webhookEvent.create({
        data: {
          provider: SHOPEE_PROVIDER,
          eventReference: dto.event_reference,
          eventType,
          externalOrderId: dto.external_order_id,
          channelStoreId: store.id,
          status: "received",
          rawPayload: dto as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      if (this.isUniqueConflict(error)) {
        const existing = await this.prisma.onlineOrder.findUnique({
          where: {
            channelStoreId_externalOrderId: {
              channelStoreId: store.id,
              externalOrderId: dto.external_order_id,
            },
          },
          select: { id: true, mappingStatus: true },
        });
        return ok({
          message: "webhook accepted",
          duplicate: true,
          online_order_id: existing?.id ?? null,
          mapping_status: existing?.mappingStatus ?? null,
        });
      }
      throw error;
    }

    const job = await this.prisma.integrationJob.create({
      data: {
        provider: SHOPEE_PROVIDER,
        jobType: "shopee.order_webhook",
        status: "processing",
        attemptCount: 1,
        payload: dto as unknown as Prisma.InputJsonValue,
        lastAttemptAt: new Date(),
      },
    });
    await this.prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { integrationJobId: job.id },
    });

    const result = await this.importOrder(channel.id, store.id, dto, job.id);
    await this.queueService.enqueueIntegrationJob(job.id, {
      provider: SHOPEE_PROVIDER,
      job_id: job.id,
      online_order_id: result.onlineOrderId,
      event_reference: dto.event_reference,
    });

    return ok({
      message: "webhook accepted",
      duplicate: false,
      online_order_id: result.onlineOrderId,
      integration_job_id: job.id,
      mapping_status: result.mappingStatus,
      unmapped_skus: result.unmappedSkus,
    });
  }

  async retryJob(jobId: string) {
    const job = await this.prisma.integrationJob.findFirst({
      where: { id: jobId, provider: SHOPEE_PROVIDER },
    });
    if (!job) {
      throw new NotFoundException("Shopee integration job not found");
    }
    if (job.status !== "failed") {
      throw new ConflictException(
        "Only failed Shopee integration jobs can be retried",
      );
    }

    const nextAttemptCount = job.attemptCount + 1;
    const updated = await this.prisma.integrationJob.update({
      where: { id: job.id },
      data: {
        status: "pending",
        attemptCount: nextAttemptCount,
        lastAttemptAt: new Date(),
        nextRetryAt: null,
      },
    });
    await this.prisma.integrationLog.create({
      data: {
        integrationJobId: job.id,
        provider: SHOPEE_PROVIDER,
        logLevel: "info",
        eventType: "job.retry",
        status: "retry_queued",
        message: "Failed Shopee integration job requeued by HQ Admin.",
        payload: { attempt_count: nextAttemptCount },
      },
    });
    await this.queueService.enqueueIntegrationJob(
      `${job.id}-retry-${nextAttemptCount}`,
      {
        provider: SHOPEE_PROVIDER,
        job_id: job.id,
        retry_of_job_id: job.id,
        attempt_count: nextAttemptCount,
      },
    );

    return ok({
      id: updated.id,
      status: updated.status,
      attempt_count: updated.attemptCount,
      last_attempt_at: updated.lastAttemptAt,
    });
  }

  async monitoringSnapshot() {
    const channel = await this.ensureShopeeChannel();
    const [
      stores,
      mappingCount,
      orderGroups,
      jobGroups,
      unmappedItems,
      lastLog,
      failedJobRows,
    ] = await Promise.all([
      this.prisma.channelStore.count({
        where: { salesChannelId: channel.id, isActive: true },
      }),
      this.prisma.productChannelMapping.count({
        where: {
          mappingStatus: "mapped",
          channelStore: { salesChannelId: channel.id },
        },
      }),
      this.prisma.onlineOrder.groupBy({
        by: ["mappingStatus"],
        where: { salesChannelId: channel.id },
        _count: { _all: true },
      }),
      this.prisma.integrationJob.groupBy({
        by: ["status"],
        where: { provider: SHOPEE_PROVIDER },
        _count: { _all: true },
      }),
      this.prisma.onlineOrderItem.count({
        where: {
          mappingStatus: { in: ["needs_mapping", "unmapped"] },
          onlineOrder: { salesChannelId: channel.id },
        },
      }),
      this.prisma.integrationLog.findFirst({
        where: { provider: SHOPEE_PROVIDER },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.integrationJob.findMany({
        where: { provider: SHOPEE_PROVIDER, status: "failed" },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
    ]);

    const orderCounts = new Map(
      orderGroups.map((group) => [group.mappingStatus, group._count._all]),
    );
    const jobCounts = new Map(
      jobGroups.map((group) => [group.status, group._count._all]),
    );
    const failedJobCount = jobCounts.get("failed") ?? 0;

    const orderCount = Array.from(orderCounts.values()).reduce(
      (sum, count) => sum + count,
      0,
    );
    const healthStatus =
      failedJobCount > 0 || unmappedItems > 0
        ? "attention_required"
        : "healthy";

    return ok({
      integration: SHOPEE_PROVIDER,
      mock_mode: this.config.shopeeMockMode,
      status: healthStatus,
      health_status: healthStatus,
      active_store_count: stores,
      connected_store_count: stores,
      active_mapping_count: mappingCount,
      order_count: orderCount,
      imported_order_count: orderCount,
      mapped_order_count: orderCounts.get("mapped") ?? 0,
      needs_mapping_order_count: orderCounts.get("needs_mapping") ?? 0,
      unmapped_item_count: unmappedItems,
      pending_job_count: jobCounts.get("pending") ?? 0,
      processing_job_count: jobCounts.get("processing") ?? 0,
      failed_job_count: failedJobCount,
      success_job_count: jobCounts.get("success") ?? 0,
      failed_jobs: failedJobRows.map((job) => ({
        id: job.id,
        job_type: job.jobType,
        status: job.status,
        attempt_count: job.attemptCount,
        last_error: job.errorMessage,
        error_code: job.errorCode,
        last_attempt_at: job.lastAttemptAt,
        next_retry_at: job.nextRetryAt,
        created_at: job.createdAt,
      })),
      recent_errors:
        lastLog?.logLevel === "error"
          ? [
              {
                id: lastLog.id,
                message:
                  lastLog.errorMessage ??
                  lastLog.message ??
                  "Shopee integration error",
                created_at: lastLog.createdAt,
              },
            ]
          : [],
      last_checked_at: new Date(),
      last_event_at: lastLog?.createdAt ?? null,
      last_event_status: lastLog?.status ?? null,
      last_error_code: lastLog?.errorCode ?? null,
      last_error_message: lastLog?.errorMessage ?? null,
    });
  }

  private async importOrder(
    salesChannelId: string,
    channelStoreId: string,
    dto: ShopeeOrderWebhookDto,
    jobId: string,
  ): Promise<{
    onlineOrderId: string;
    mappingStatus: string;
    unmappedSkus: string[];
  }> {
    const mappings = await this.prisma.productChannelMapping.findMany({
      where: {
        channelStoreId,
        externalSku: { in: dto.items.map((item) => item.external_sku ?? "") },
        mappingStatus: "mapped",
      },
    });
    const mappingBySku = new Map(
      mappings.map((mapping) => [mapping.externalSku, mapping.productId]),
    );
    const unmappedSkus = dto.items
      .filter(
        (item) => !item.external_sku || !mappingBySku.has(item.external_sku),
      )
      .map((item) => item.external_sku ?? "missing-sku");
    const mappingStatus = unmappedSkus.length > 0 ? "needs_mapping" : "mapped";
    const existingOrder = await this.prisma.onlineOrder.findUnique({
      where: {
        channelStoreId_externalOrderId: {
          channelStoreId,
          externalOrderId: dto.external_order_id,
        },
      },
      select: { id: true, mappingStatus: true },
    });
    if (existingOrder) {
      await this.prisma.integrationLog.create({
        data: {
          integrationJobId: jobId,
          provider: SHOPEE_PROVIDER,
          logLevel: "info",
          eventType: "order.import",
          status: "duplicate_order_ignored",
          message:
            "Shopee order already exists; webhook event did not create duplicate items.",
          onlineOrderId: existingOrder.id,
          payload: { external_order_id: dto.external_order_id },
        },
      });
      await this.prisma.integrationJob.update({
        where: { id: jobId },
        data: {
          status: "success",
          onlineOrderId: existingOrder.id,
        },
      });
      await this.prisma.webhookEvent.updateMany({
        where: {
          provider: SHOPEE_PROVIDER,
          externalOrderId: dto.external_order_id,
          eventReference: dto.event_reference,
        },
        data: { status: "duplicate_order_ignored", processedAt: new Date() },
      });

      return {
        onlineOrderId: existingOrder.id,
        mappingStatus: existingOrder.mappingStatus,
        unmappedSkus: [],
      };
    }

    const onlineOrder = await this.prisma.onlineOrder.create({
      data: {
        salesChannelId,
        channelStoreId,
        externalOrderId: dto.external_order_id,
        branchId: dto.branch_id,
        orderDatetime: new Date(dto.order_datetime),
        orderStatus: dto.order_status ?? "created",
        paymentStatus: dto.payment_status ?? "pending",
        mappingStatus,
        subtotalAmount: dto.subtotal_amount ?? 0,
        discountAmount: dto.discount_amount ?? 0,
        shippingAmount: dto.shipping_amount ?? 0,
        totalAmount: dto.total_amount ?? 0,
        rawPayload: dto as unknown as Prisma.InputJsonValue,
        processedAt: mappingStatus === "mapped" ? new Date() : null,
        items: {
          create: dto.items.map((item) => {
            const productId = item.external_sku
              ? mappingBySku.get(item.external_sku)
              : undefined;
            return {
              productId,
              externalProductId: item.external_product_id,
              externalSku: item.external_sku,
              productNameSnapshot: item.product_name_snapshot,
              unitPrice: item.unit_price,
              quantity: item.quantity,
              lineTotal: item.line_total,
              mappingStatus: productId ? "mapped" : "unmapped",
              rawPayload: item as unknown as Prisma.InputJsonValue,
            };
          }),
        },
      },
      include: { items: true },
    });

    if (unmappedSkus.length > 0) {
      await this.prisma.integrationLog.create({
        data: {
          integrationJobId: jobId,
          provider: SHOPEE_PROVIDER,
          logLevel: "error",
          eventType: "order.mapping",
          status: "needs_mapping",
          message:
            "Shopee order imported with unmapped SKU items; stock was not mutated.",
          errorCode: "INTEGRATION_MAPPING_NOT_FOUND",
          errorMessage: `Unmapped Shopee SKU(s): ${unmappedSkus.join(", ")}`,
          onlineOrderId: onlineOrder.id,
          payload: {
            external_order_id: dto.external_order_id,
            unmapped_skus: unmappedSkus,
          },
        },
      });
      await this.prisma.integrationJob.update({
        where: { id: jobId },
        data: {
          status: "failed",
          onlineOrderId: onlineOrder.id,
          errorCode: "INTEGRATION_MAPPING_NOT_FOUND",
          errorMessage: `Unmapped Shopee SKU(s): ${unmappedSkus.join(", ")}`,
        },
      });
    } else {
      await this.prisma.integrationLog.create({
        data: {
          integrationJobId: jobId,
          provider: SHOPEE_PROVIDER,
          logLevel: "info",
          eventType: "order.import",
          status: "success",
          message: "Shopee order imported successfully.",
          onlineOrderId: onlineOrder.id,
          payload: { external_order_id: dto.external_order_id },
        },
      });
      await this.prisma.integrationJob.update({
        where: { id: jobId },
        data: { status: "success", onlineOrderId: onlineOrder.id },
      });
    }

    await this.prisma.webhookEvent.updateMany({
      where: {
        provider: SHOPEE_PROVIDER,
        externalOrderId: dto.external_order_id,
        eventReference: dto.event_reference,
      },
      data: {
        status: mappingStatus === "mapped" ? "processed" : "needs_mapping",
        processedAt: new Date(),
      },
    });

    return { onlineOrderId: onlineOrder.id, mappingStatus, unmappedSkus };
  }

  private assertWebhookSecret(headers: WebhookHeaders): void {
    if (headers.secret !== this.config.shopeeWebhookSecret) {
      throw new BadRequestException("Invalid Shopee webhook secret");
    }

    if (!headers.timestamp) {
      return;
    }

    const timestamp = Number(headers.timestamp);
    if (!Number.isFinite(timestamp)) {
      throw new BadRequestException("Invalid Shopee webhook timestamp");
    }

    const timestampMs =
      timestamp > 10_000_000_000 ? timestamp : timestamp * 1000;
    const skewSeconds = Math.abs(Date.now() - timestampMs) / 1000;
    if (skewSeconds > this.config.shopeeWebhookMaxSkewSeconds) {
      throw new BadRequestException(
        "Shopee webhook timestamp skew is too large",
      );
    }
  }

  private async resolveWebhookStore(
    salesChannelId: string,
    dto: ShopeeOrderWebhookDto,
  ) {
    if (dto.channel_store_id) {
      return this.findShopeeStore(dto.channel_store_id);
    }
    if (dto.external_store_id) {
      const store = await this.prisma.channelStore.findUnique({
        where: {
          salesChannelId_externalStoreId: {
            salesChannelId,
            externalStoreId: dto.external_store_id,
          },
        },
      });
      if (store?.isActive) {
        return store;
      }
    }

    throw new BadRequestException("Shopee channel store is required");
  }

  private async findShopeeStore(id: string) {
    const store = await this.prisma.channelStore.findFirst({
      where: { id, salesChannel: { code: SHOPEE_PROVIDER } },
    });
    if (!store) {
      throw new NotFoundException("Shopee store not found");
    }
    return store;
  }

  private async ensureShopeeChannel() {
    return this.prisma.salesChannel.upsert({
      where: { code: SHOPEE_PROVIDER },
      update: { name: "Shopee", type: "marketplace", isActive: true },
      create: {
        code: SHOPEE_PROVIDER,
        name: "Shopee",
        type: "marketplace",
      },
    });
  }

  private isUniqueConflict(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    );
  }

  private serializeStore(store: {
    id: string;
    storeName: string;
    externalStoreId: string;
    authStatus: string;
    credentialReference: string | null;
    isActive: boolean;
    connectedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    _count?: { productMappings: number; onlineOrders: number };
  }) {
    return {
      id: store.id,
      store_name: store.storeName,
      external_store_id: store.externalStoreId,
      auth_status: store.authStatus,
      status: store.authStatus,
      credential_reference: store.credentialReference,
      is_active: store.isActive,
      connected_at: store.connectedAt,
      last_sync_at: null,
      created_at: store.createdAt,
      updated_at: store.updatedAt,
      product_mapping_count: store._count?.productMappings,
      online_order_count: store._count?.onlineOrders,
    };
  }

  private serializeMapping(mapping: {
    id: string;
    channelStoreId: string;
    productId: string;
    externalProductId: string | null;
    externalSku: string;
    mappingStatus: string;
    createdAt: Date;
    updatedAt: Date;
    product?: { id: string; sku: string; name: string };
    channelStore?: { storeName: string };
  }) {
    return {
      id: mapping.id,
      channel_store_id: mapping.channelStoreId,
      store_name: mapping.channelStore?.storeName,
      product_id: mapping.productId,
      product: mapping.product
        ? {
            id: mapping.product.id,
            sku: mapping.product.sku,
            name: mapping.product.name,
          }
        : undefined,
      internal_sku: mapping.product?.sku,
      internal_product_name: mapping.product?.name,
      external_product_id: mapping.externalProductId,
      external_sku: mapping.externalSku,
      mapping_status: mapping.mappingStatus,
      last_sync_status: "prepared",
      created_at: mapping.createdAt,
      updated_at: mapping.updatedAt,
    };
  }
}
