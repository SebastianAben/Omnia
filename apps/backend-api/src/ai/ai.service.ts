import { Inject, Injectable, Optional } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { Prisma, TransactionStatus } from "@prisma/client";
import { z } from "zod";

import { appConfig } from "../config/app.config";
import { ok } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";
import { toNumber } from "../reporting/reporting-query";
import { AiInsightQuery } from "./ai.dto";

const ANALYSIS_WINDOW_DAYS = 30;
const DEFAULT_MAX_INSIGHTS = 8;
const DEFAULT_MAX_CONTEXT_ROWS = 30;
const DEFAULT_GENERATION_COOLDOWN_MINUTES = 60;

export const LLM_CLIENT = "LLM_CLIENT";

type LlmConfig = Pick<
  ConfigType<typeof appConfig>,
  | "llmProvider"
  | "llmApiKey"
  | "llmModel"
  | "llmTimeoutMs"
  | "llmInsightTtlMinutes"
  | "llmMaxInsights"
  | "llmMaxContextRows"
  | "llmGenerationCooldownMinutes"
>;

type LlmGenerationContext = {
  generated_at: string;
  analysis_window_days: number;
  inventory_balances: Array<Record<string, unknown>>;
  recent_sales_items: Array<Record<string, unknown>>;
  sales_summary: {
    transaction_count: number;
    total_amount: number;
  };
  sync_health_summary: Record<string, unknown>;
  audit_summary: Record<string, unknown>;
};

export type LlmGenerationInput = {
  config: LlmConfig;
  context: LlmGenerationContext;
};

export type LlmClient = {
  generateInsights(input: LlmGenerationInput): Promise<unknown>;
};

type AiGenerationResponse = {
  job_id: string;
  status: "success" | "failed" | "insufficient_data" | "cached";
  insight_count: number;
  provider: string;
  model: string;
  error_code?: string;
  error_message?: string;
};

type LlmInsight = z.infer<typeof llmInsightSchema>;

const roleVariantSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  recommendation: z.string().min(1),
});

const roleVariantsSchema = z.object({
  executive: roleVariantSchema,
  hq_admin: roleVariantSchema,
});

const llmInsightSchema = z.object({
  insight_type: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  recommendation: z.string().min(1),
  role_variants: roleVariantsSchema,
  severity: z.enum(["info", "warning", "critical"]),
  confidence_score: z.number().min(0).max(1),
  branch_id: z.string().nullable().optional(),
  product_id: z.string().nullable().optional(),
  reference_data: z.record(z.string(), z.unknown()).default({}),
  advisory_only: z.boolean().default(true),
  prohibited_action_requested: z.boolean().default(false),
});

const llmResponseSchema = z.object({
  insights: z.array(llmInsightSchema).min(1).max(DEFAULT_MAX_INSIGHTS),
});

const geminiResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({
          parts: z.array(z.object({ text: z.string().optional() })),
        }),
      }),
    )
    .min(1),
});

class LlmGenerationError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

@Injectable()
export class GeminiLlmClient implements LlmClient {
  async generateInsights(input: LlmGenerationInput) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      input.config.llmTimeoutMs,
    );

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.config.llmModel)}:generateContent?key=${encodeURIComponent(input.config.llmApiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: buildPrompt(
                      input.context,
                      input.config.llmMaxInsights,
                    ),
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
              responseSchema: buildGeminiStructuredOutputSchema(
                input.config.llmMaxInsights,
              ),
            },
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new LlmGenerationError(
          "LLM_PROVIDER_ERROR",
          `Gemini returned ${response.status}${body ? `: ${body.slice(0, 200)}` : ""}`,
        );
      }

      const body = await response.json();
      const parsed = geminiResponseSchema.safeParse(body);
      if (!parsed.success) {
        throw new LlmGenerationError(
          "LLM_OUTPUT_INVALID",
          "Gemini response did not include structured text content.",
        );
      }

      const text = parsed.data.candidates[0].content.parts
        .map((part) => part.text ?? "")
        .join("")
        .trim();

      if (!text) {
        throw new LlmGenerationError(
          "LLM_OUTPUT_INVALID",
          "Gemini response was empty.",
        );
      }

      return JSON.parse(text) as unknown;
    } catch (error) {
      if (error instanceof LlmGenerationError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new LlmGenerationError(
          "LLM_PROVIDER_TIMEOUT",
          "Gemini request timed out.",
        );
      }
      if (error instanceof SyntaxError) {
        throw new LlmGenerationError(
          "LLM_OUTPUT_INVALID",
          "Gemini returned malformed JSON.",
        );
      }

      throw new LlmGenerationError(
        "LLM_PROVIDER_ERROR",
        error instanceof Error
          ? error.message
          : "Unknown Gemini provider error",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

@Injectable()
export class AiService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(appConfig.KEY) private readonly config: LlmConfig,
    @Optional() @Inject(LLM_CLIENT) private readonly llmClient?: LlmClient,
  ) {}

  private get maxInsights() {
    return this.config.llmMaxInsights || DEFAULT_MAX_INSIGHTS;
  }

  private get maxContextRows() {
    return this.config.llmMaxContextRows || DEFAULT_MAX_CONTEXT_ROWS;
  }

  private get generationCooldownMinutes() {
    return (
      this.config.llmGenerationCooldownMinutes ??
      DEFAULT_GENERATION_COOLDOWN_MINUTES
    );
  }

  async listInsights(query: AiInsightQuery, roleCode = "hq_admin") {
    const generatedAfter = query.generated_after
      ? new Date(query.generated_after)
      : undefined;
    const insights = await this.prisma.aiInsight.findMany({
      where: {
        branchId: query.branch_id,
        insightType: query.insight_type,
        generatedAt: generatedAfter ? { gte: generatedAfter } : undefined,
      },
      orderBy: [{ severity: "asc" }, { generatedAt: "desc" }],
      take: 100,
      select: {
        id: true,
        branchId: true,
        productId: true,
        insightType: true,
        title: true,
        summary: true,
        severity: true,
        confidenceScore: true,
        referenceData: true,
        generatedAt: true,
        branch: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, sku: true, name: true, unit: true } },
      },
    });

    return ok(
      insights.map((insight) => {
        const wording = selectRoleWording(insight.referenceData, roleCode);

        return {
          id: insight.id,
          branch_id: insight.branchId,
          product_id: insight.productId,
          insight_type: insight.insightType,
          title: wording.title ?? insight.title,
          summary: wording.summary ?? insight.summary,
          severity: insight.severity,
          confidence_score: toNumber(insight.confidenceScore),
          reference_data: selectReferenceDataForRole(
            insight.referenceData,
            roleCode,
          ),
          generated_at: insight.generatedAt,
          branch: insight.branch,
          product: insight.product,
        };
      }),
      {
        generated_from: "llm_persisted_insights",
        advisory_only: true,
      },
    );
  }

  async listGenerationJobs() {
    const jobs = await this.prisma.insightGenerationJob.findMany({
      where: { jobType: "llm_insight_generation" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        insightCount: true,
        errorCode: true,
        errorMessage: true,
        metadata: true,
        createdAt: true,
      },
    });

    return ok(
      jobs.map((job) => ({
        id: job.id,
        status: job.status,
        started_at: job.startedAt,
        finished_at: job.finishedAt,
        insight_count: job.insightCount,
        error_code: job.errorCode,
        error_message: job.errorMessage,
        metadata: job.metadata,
        created_at: job.createdAt,
      })),
    );
  }

  async generateInsights(): Promise<{
    success: true;
    data: AiGenerationResponse;
  }> {
    const metadata = this.baseJobMetadata();
    const cached = await this.findFreshCachedGeneration();
    if (cached) {
      return ok<AiGenerationResponse>({
        job_id: cached.id,
        status: "cached",
        insight_count: cached.insightCount,
        provider: this.config.llmProvider,
        model: this.config.llmModel,
      });
    }

    const job = await this.prisma.insightGenerationJob.create({
      data: {
        jobType: "llm_insight_generation",
        status: "processing",
        startedAt: new Date(),
        metadata,
      },
    });

    if (!this.config.llmApiKey?.trim()) {
      return this.failJob(
        job.id,
        "LLM_API_KEY_MISSING",
        "LLM_API_KEY is not configured.",
        metadata,
      );
    }

    try {
      const context = await this.buildContext();
      if (
        context.inventory_balances.length === 0 &&
        context.sales_summary.transaction_count === 0
      ) {
        const insight = this.buildInsufficientDataInsight();
        await this.persistInsights(job.id, [insight], "insufficient_data", {
          ...metadata,
          context_summary: summarizeContext(context),
          status_reason: "no_central_dataset",
        } as Prisma.InputJsonValue);

        return ok<AiGenerationResponse>({
          job_id: job.id,
          status: "insufficient_data",
          insight_count: 1,
          provider: this.config.llmProvider,
          model: this.config.llmModel,
        });
      }

      const output = await (
        this.llmClient ?? new GeminiLlmClient()
      ).generateInsights({
        config: this.config,
        context,
      });
      const parsed = this.validateLlmOutput(output);

      await this.persistInsights(job.id, parsed, "success", {
        ...metadata,
        context_summary: summarizeContext(context),
      } as Prisma.InputJsonValue);

      return ok<AiGenerationResponse>({
        job_id: job.id,
        status: "success",
        insight_count: parsed.length,
        provider: this.config.llmProvider,
        model: this.config.llmModel,
      });
    } catch (error) {
      const code =
        error instanceof LlmGenerationError
          ? error.code
          : "LLM_GENERATION_FAILED";
      const message =
        error instanceof Error ? error.message : "Unknown LLM generation error";

      return this.failJob(job.id, code, message, metadata);
    }
  }

  private validateLlmOutput(output: unknown): LlmInsight[] {
    const parsed = llmResponseSchema.safeParse(output);
    if (!parsed.success) {
      throw new LlmGenerationError(
        "LLM_OUTPUT_INVALID",
        "LLM output did not match the required insight schema.",
      );
    }

    if (
      parsed.data.insights.some(
        (insight) => insight.prohibited_action_requested,
      )
    ) {
      throw new LlmGenerationError(
        "LLM_OUTPUT_UNSAFE",
        "LLM output requested an operational mutation.",
      );
    }

    if (parsed.data.insights.length > this.maxInsights) {
      throw new LlmGenerationError(
        "LLM_OUTPUT_INVALID",
        `LLM output exceeded max insight count ${this.maxInsights}.`,
      );
    }

    return parsed.data.insights;
  }

  private async persistInsights(
    jobId: string,
    insights: LlmInsight[],
    status: "success" | "insufficient_data",
    metadata: Prisma.InputJsonValue,
  ) {
    const expiresAt = new Date(
      Date.now() + this.config.llmInsightTtlMinutes * 60 * 1000,
    );
    const generatedAt = new Date();

    await this.prisma.$transaction([
      this.prisma.aiInsight.deleteMany({}),
      this.prisma.aiInsight.createMany({
        data: insights.map((insight) => ({
          branchId: insight.branch_id ?? undefined,
          productId: insight.product_id ?? undefined,
          insightType: insight.insight_type,
          title: insight.role_variants.hq_admin.title,
          summary: insight.role_variants.hq_admin.summary,
          severity: insight.severity,
          confidenceScore: new Prisma.Decimal(
            clamp(insight.confidence_score, 0, 1).toFixed(4),
          ),
          referenceData: {
            ...insight.reference_data,
            recommendation: insight.role_variants.hq_admin.recommendation,
            role_variants: insight.role_variants,
            advisory_only: true,
            llm_provider: this.config.llmProvider,
            llm_model: this.config.llmModel,
            generation_job_id: jobId,
          },
          generatedAt,
          expiresAt,
        })),
      }),
      this.prisma.insightGenerationJob.update({
        where: { id: jobId },
        data: {
          status,
          finishedAt: new Date(),
          insightCount: insights.length,
          metadata,
        },
      }),
    ]);
  }

  private async failJob(
    jobId: string,
    errorCode: string,
    errorMessage: string,
    metadata: Prisma.InputJsonValue,
  ) {
    await this.prisma.insightGenerationJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        finishedAt: new Date(),
        errorCode,
        errorMessage,
        metadata,
      },
    });

    return ok<AiGenerationResponse>({
      job_id: jobId,
      status: "failed",
      insight_count: 0,
      error_code: errorCode,
      error_message: errorMessage,
      provider: this.config.llmProvider,
      model: this.config.llmModel,
    });
  }

  private async findFreshCachedGeneration() {
    const since = new Date(
      Date.now() - this.generationCooldownMinutes * 60 * 1000,
    );
    const job = await this.prisma.insightGenerationJob.findFirst({
      where: {
        jobType: "llm_insight_generation",
        status: { in: ["success", "insufficient_data"] },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, insightCount: true },
    });

    if (!job) {
      return null;
    }

    const insightCount = await this.prisma.aiInsight.count({
      where: { generatedAt: { gte: since } },
    });

    if (insightCount <= 0) {
      return null;
    }

    return { id: job.id, insightCount };
  }

  private async buildContext(): Promise<LlmGenerationContext> {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - ANALYSIS_WINDOW_DAYS);

    const [balances, items, transactionCount, salesTotal, syncLogs, auditLogs] =
      await Promise.all([
        this.prisma.inventoryBalance.findMany({
          where: { branch: { isActive: true }, product: { isActive: true } },
          take: this.maxContextRows,
          orderBy: { updatedAt: "desc" },
          select: {
            branchId: true,
            productId: true,
            quantityOnHand: true,
            minimumStockThreshold: true,
            updatedAt: true,
            branch: { select: { id: true, code: true, name: true } },
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unit: true,
                category: { select: { name: true } },
              },
            },
          },
        }),
        this.prisma.salesTransactionItem.findMany({
          where: {
            transaction: {
              transactionDatetime: { gte: from, lte: now },
              transactionStatus: TransactionStatus.COMPLETED,
            },
          },
          take: this.maxContextRows,
          orderBy: { transaction: { transactionDatetime: "desc" } },
          select: {
            productId: true,
            quantity: true,
            lineTotal: true,
            transaction: {
              select: {
                id: true,
                branchId: true,
                transactionDatetime: true,
                branch: { select: { code: true, name: true } },
              },
            },
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                category: { select: { name: true } },
              },
            },
          },
        }),
        this.prisma.salesTransaction.count({
          where: {
            transactionDatetime: { gte: from, lte: now },
            transactionStatus: TransactionStatus.COMPLETED,
          },
        }),
        this.prisma.salesTransaction.aggregate({
          where: {
            transactionDatetime: { gte: from, lte: now },
            transactionStatus: TransactionStatus.COMPLETED,
          },
          _sum: { totalAmount: true },
        }),
        this.prisma.syncLog.findMany({
          take: 20,
          orderBy: { loggedAt: "desc" },
          select: {
            eventType: true,
            branchId: true,
            entityType: true,
            status: true,
            logLevel: true,
            message: true,
            errorCode: true,
            loggedAt: true,
          },
        }),
        this.prisma.auditLog.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
          select: {
            branchId: true,
            entityType: true,
            action: true,
            note: true,
            createdAt: true,
          },
        }),
      ]);

    return {
      generated_at: now.toISOString(),
      analysis_window_days: ANALYSIS_WINDOW_DAYS,
      inventory_balances: balances.map((balance) => ({
        branch_id: balance.branchId,
        branch_code: balance.branch.code,
        branch_name: balance.branch.name,
        product_id: balance.productId,
        sku: balance.product.sku,
        product_name: balance.product.name,
        category_name: balance.product.category?.name ?? null,
        unit: balance.product.unit,
        quantity_on_hand: toNumber(balance.quantityOnHand),
        minimum_stock_threshold: balance.minimumStockThreshold
          ? toNumber(balance.minimumStockThreshold)
          : null,
        updated_at: balance.updatedAt.toISOString(),
      })),
      recent_sales_items: items.map((item) => ({
        transaction_id: item.transaction.id,
        transaction_datetime:
          item.transaction.transactionDatetime.toISOString(),
        branch_id: item.transaction.branchId,
        branch_code: item.transaction.branch.code,
        branch_name: item.transaction.branch.name,
        product_id: item.productId,
        sku: item.product.sku,
        product_name: item.product.name,
        category_name: item.product.category?.name ?? null,
        quantity: toNumber(item.quantity),
        line_total: toNumber(item.lineTotal),
      })),
      sales_summary: {
        transaction_count: transactionCount,
        total_amount: toNumber(salesTotal._sum.totalAmount),
      },
      sync_health_summary: summarizeSyncLogs(syncLogs),
      audit_summary: summarizeAuditLogs(auditLogs),
    };
  }

  private buildInsufficientDataInsight(): LlmInsight {
    return {
      insight_type: "data_not_ready",
      title: "Data analytics belum siap",
      summary:
        "Belum ada transaksi atau snapshot inventory pusat yang cukup untuk menghasilkan LLM insight.",
      recommendation:
        "Sinkronkan transaksi dan inventory pusat terlebih dahulu, lalu jalankan ulang generation.",
      role_variants: {
        executive: {
          title: "Data insight belum siap",
          summary:
            "Data pusat belum cukup untuk menghasilkan insight strategis yang dapat dipercaya.",
          recommendation:
            "Pastikan transaksi dan inventory pusat sudah tersinkron sebelum review berikutnya.",
        },
        hq_admin: {
          title: "Data analytics belum siap",
          summary:
            "Belum ada transaksi atau snapshot inventory pusat yang cukup untuk menghasilkan LLM insight.",
          recommendation:
            "Sinkronkan transaksi dan inventory pusat terlebih dahulu, lalu jalankan ulang generation.",
        },
      },
      severity: "info",
      confidence_score: 0.2,
      reference_data: {
        reason: "no_central_dataset",
        minimum_required: "inventory balance or completed sales transaction",
      },
      advisory_only: true,
      prohibited_action_requested: false,
    };
  }

  private baseJobMetadata() {
    return {
      provider: this.config.llmProvider,
      model: this.config.llmModel,
      window_days: ANALYSIS_WINDOW_DAYS,
      prompt_version: "llm_insights_v1",
      max_insights: this.maxInsights,
      max_context_rows: this.maxContextRows,
      cooldown_minutes: this.generationCooldownMinutes,
      advisory_only: true,
    };
  }
}

function buildPrompt(context: LlmGenerationContext, maxInsights: number) {
  return [
    "You generate advisory-only retail POS insights for Omnia HQ users.",
    "Use only the supplied central database context. Do not invent product IDs, branch IDs, stock, sales, or operational events.",
    "Never request or claim to perform mutations such as changing stock, prices, orders, payments, sync state, or master data.",
    `Return JSON only. Generate at most ${maxInsights} insights.`,
    "Each insight must include role_variants.executive and role_variants.hq_admin.",
    "The executive variant must be short, strategic, and focused on business risk or impact.",
    "The hq_admin variant must be operational, include relevant references, and recommend manual follow-up.",
    "",
    `Context JSON:\n${JSON.stringify(context)}`,
  ].join("\n");
}

function buildGeminiStructuredOutputSchema(maxInsights: number) {
  return {
    type: "object",
    properties: {
      insights: {
        type: "array",
        minItems: 1,
        maxItems: maxInsights,
        items: {
          type: "object",
          properties: {
            insight_type: { type: "string" },
            title: { type: "string" },
            summary: { type: "string" },
            recommendation: { type: "string" },
            role_variants: {
              type: "object",
              properties: {
                executive: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    summary: { type: "string" },
                    recommendation: { type: "string" },
                  },
                  required: ["title", "summary", "recommendation"],
                },
                hq_admin: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    summary: { type: "string" },
                    recommendation: { type: "string" },
                  },
                  required: ["title", "summary", "recommendation"],
                },
              },
              required: ["executive", "hq_admin"],
            },
            severity: {
              type: "string",
              enum: ["info", "warning", "critical"],
            },
            confidence_score: { type: "number" },
            branch_id: { type: "string", nullable: true },
            product_id: { type: "string", nullable: true },
            reference_data: { type: "object" },
            advisory_only: { type: "boolean" },
            prohibited_action_requested: { type: "boolean" },
          },
          required: [
            "insight_type",
            "title",
            "summary",
            "recommendation",
            "role_variants",
            "severity",
            "confidence_score",
            "reference_data",
            "advisory_only",
            "prohibited_action_requested",
          ],
        },
      },
    },
    required: ["insights"],
  };
}

function selectRoleWording(referenceData: Prisma.JsonValue, roleCode: string) {
  const variant = getRoleVariant(referenceData, roleCode);

  return variant
    ? {
        title: variant.title,
        summary: variant.summary,
        recommendation: variant.recommendation,
      }
    : {};
}

function selectReferenceDataForRole(
  referenceData: Prisma.JsonValue,
  roleCode: string,
) {
  const data = isRecord(referenceData) ? { ...referenceData } : {};
  const variant = getRoleVariant(referenceData, roleCode);

  delete data.role_variants;

  if (variant) {
    data.recommendation = variant.recommendation;
  }

  return data;
}

function getRoleVariant(referenceData: Prisma.JsonValue, roleCode: string) {
  if (!isRecord(referenceData)) {
    return undefined;
  }

  const parsed = roleVariantsSchema.safeParse(referenceData.role_variants);
  if (!parsed.success) {
    return undefined;
  }

  const normalizedRole = roleCode.toLowerCase();
  return normalizedRole.includes("executive") ||
    normalizedRole.includes("analyst")
    ? parsed.data.executive
    : parsed.data.hq_admin;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function summarizeContext(context: LlmGenerationContext) {
  return {
    inventory_balance_count: context.inventory_balances.length,
    recent_sales_item_count: context.recent_sales_items.length,
    transaction_count: context.sales_summary.transaction_count,
    sync_health_summary: context.sync_health_summary,
    audit_summary: context.audit_summary,
  };
}

function summarizeSyncLogs(
  logs: Array<{
    status: string;
    logLevel: string;
    errorCode: string | null;
  }>,
) {
  return {
    log_count: logs.length,
    error_count: logs.filter(
      (log) => log.logLevel === "error" || Boolean(log.errorCode),
    ).length,
    by_status: countBy(logs, (log) => log.status),
  };
}

function summarizeAuditLogs(
  logs: Array<{ entityType: string; action: string }>,
) {
  return {
    log_count: logs.length,
    by_entity_type: countBy(logs, (log) => log.entityType),
    by_action: countBy(logs, (log) => log.action),
  };
}

function countBy<T>(rows: T[], keyFn: (row: T) => string) {
  return rows.reduce<Record<string, number>>((accumulator, row) => {
    const key = keyFn(row);
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
