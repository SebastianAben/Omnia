import assert from "node:assert/strict";
import test from "node:test";

import { ForbiddenException } from "@nestjs/common";

import type { CurrentUser } from "../auth/dto";
import { AiController } from "./ai.controller";
import { AiService, type LlmClient } from "./ai.service";

const hqUser: CurrentUser = {
  id: "hq-1",
  full_name: "HQ Admin",
  username: "hq",
  role_code: "hq_admin",
};

const cashierUser: CurrentUser = {
  id: "cashier-1",
  full_name: "Cashier",
  username: "cashier",
  role_code: "cashier",
  branch_id: "branch-1",
};

const executiveUser: CurrentUser = {
  id: "exec-1",
  full_name: "Executive",
  username: "exec",
  role_code: "executive",
};

function createPrisma(options: { cachedJob?: boolean } = {}) {
  const createdInsights: Array<Record<string, unknown>> = [];
  const updatedJobs: Array<Record<string, unknown>> = [];
  let jobCounter = 0;
  const roleVariantReferenceData = {
    recommendation: "Fallback recommendation",
    role_variants: {
      executive: {
        title: "Executive stock risk",
        summary: "Strategic stock risk summary.",
        recommendation: "Prioritize management review.",
      },
      hq_admin: {
        title: "Operational stock risk",
        summary: "BR-1 has 2 pcs remaining against threshold 5.",
        recommendation: "Review branch restock needs manually.",
      },
    },
    sku: "SKU-1",
  };

  return {
    createdInsights,
    updatedJobs,
    prisma: {
      aiInsight: {
        count: async () => (options.cachedJob ? 1 : 0),
        findMany: async () => [
          {
            id: "insight-1",
            branchId: "branch-1",
            productId: "product-1",
            insightType: "low_stock_alert",
            title: "Operational stock risk",
            summary: "BR-1 has 2 pcs remaining against threshold 5.",
            severity: "warning",
            confidenceScore: { toString: () => "0.82" },
            referenceData: roleVariantReferenceData,
            generatedAt: new Date("2026-06-09T01:00:00.000Z"),
            branch: { id: "branch-1", code: "BR-1", name: "Branch 1" },
            product: {
              id: "product-1",
              sku: "SKU-1",
              name: "Coffee Beans",
              unit: "pcs",
            },
          },
        ],
        deleteMany: () => ({ operation: "deleteMany" }),
        createMany: ({ data }: { data: Array<Record<string, unknown>> }) => {
          createdInsights.push(...data);
          return { operation: "createMany", count: data.length };
        },
      },
      insightGenerationJob: {
        create: async ({ data }: { data: Record<string, unknown> }) => ({
          id: `job-${++jobCounter}`,
          ...data,
        }),
        findFirst: async () =>
          options.cachedJob
            ? {
                id: "cached-job-1",
                status: "success",
                insightCount: 1,
                createdAt: new Date(),
              }
            : null,
        update: ({ data }: { data: Record<string, unknown> }) => {
          updatedJobs.push(data);
          return { operation: "update", data };
        },
        findMany: async () => [],
      },
      inventoryBalance: {
        findMany: async () => [
          {
            branchId: "branch-1",
            productId: "product-1",
            quantityOnHand: { toString: () => "2" },
            minimumStockThreshold: { toString: () => "5" },
            updatedAt: new Date("2026-06-09T00:00:00.000Z"),
            branch: { id: "branch-1", code: "BR-1", name: "Branch 1" },
            product: {
              id: "product-1",
              sku: "SKU-1",
              name: "Coffee Beans",
              unit: "pcs",
              category: { name: "Grocery" },
            },
          },
        ],
      },
      salesTransactionItem: { findMany: async () => [] },
      salesTransaction: {
        count: async () => 0,
        aggregate: async () => ({
          _sum: { totalAmount: { toString: () => "0" } },
        }),
      },
      syncLog: { findMany: async () => [] },
      auditLog: { findMany: async () => [] },
      $transaction: async (operations: unknown[]) => operations,
    },
  };
}

function createService(
  llmClient: LlmClient,
  apiKey = "gemini-key",
  options: { cachedJob?: boolean } = {},
) {
  const state = createPrisma(options);
  const config = {
    llmProvider: "gemini",
    llmApiKey: apiKey,
    llmModel: "gemini-2.5-flash",
    llmTimeoutMs: 20_000,
    llmInsightTtlMinutes: 15,
    llmMaxInsights: 8,
    llmMaxContextRows: 30,
    llmGenerationCooldownMinutes: 60,
  };

  return {
    ...state,
    service: new AiService(state.prisma as never, config as never, llmClient),
  };
}

test("AiService returns a controlled failed job when LLM API key is missing", async () => {
  const { service, createdInsights, updatedJobs } = createService(
    {
      generateInsights: async () => {
        throw new Error("LLM should not be called without an API key");
      },
    },
    "",
  );

  const result = await service.generateInsights();

  assert.equal(result.success, true);
  assert.equal(result.data.status, "failed");
  assert.equal(result.data.error_code, "LLM_API_KEY_MISSING");
  assert.equal(createdInsights.length, 0);
  assert.equal(updatedJobs.at(-1)?.errorCode, "LLM_API_KEY_MISSING");
});

test("AiService rejects malformed LLM output without persisting insights", async () => {
  const { service, createdInsights, updatedJobs } = createService({
    generateInsights: async () => ({
      insights: [
        {
          insight_type: "low_stock_alert",
          title: "Missing required fields",
        },
      ],
    }),
  });

  const result = await service.generateInsights();

  assert.equal(result.success, true);
  assert.equal(result.data.status, "failed");
  assert.equal(result.data.error_code, "LLM_OUTPUT_INVALID");
  assert.equal(createdInsights.length, 0);
  assert.equal(updatedJobs.at(-1)?.errorCode, "LLM_OUTPUT_INVALID");
});

test("AiService rejects operational mutation actions from LLM output", async () => {
  const { service, createdInsights, updatedJobs } = createService({
    generateInsights: async () => ({
      insights: [
        {
          insight_type: "low_stock_alert",
          title: "Restock now",
          summary: "Coffee Beans is below threshold.",
          recommendation: "Create a purchase order immediately.",
          role_variants: {
            executive: {
              title: "Restock risk",
              summary: "Stock risk requires management review.",
              recommendation: "Prioritize review.",
            },
            hq_admin: {
              title: "Restock now",
              summary: "Coffee Beans is below threshold.",
              recommendation: "Review restock manually.",
            },
          },
          severity: "warning",
          confidence_score: 0.8,
          branch_id: "branch-1",
          product_id: "product-1",
          reference_data: { sku: "SKU-1" },
          prohibited_action_requested: true,
        },
      ],
    }),
  });

  const result = await service.generateInsights();

  assert.equal(result.success, true);
  assert.equal(result.data.status, "failed");
  assert.equal(result.data.error_code, "LLM_OUTPUT_UNSAFE");
  assert.equal(createdInsights.length, 0);
  assert.equal(updatedJobs.at(-1)?.errorCode, "LLM_OUTPUT_UNSAFE");
});

test("AiService persists validated LLM insights with provider metadata", async () => {
  const { service, createdInsights } = createService({
    generateInsights: async () => ({
      insights: [
        {
          insight_type: "low_stock_alert",
          title: "Coffee Beans stok rendah",
          summary: "Stok tersisa 2 pcs di BR-1.",
          recommendation: "Review kebutuhan restock secara manual.",
          role_variants: {
            executive: {
              title: "Coffee Beans stock risk",
              summary: "Coffee Beans needs management attention.",
              recommendation: "Prioritize stock review.",
            },
            hq_admin: {
              title: "Coffee Beans stok rendah",
              summary: "Stok tersisa 2 pcs di BR-1.",
              recommendation: "Review kebutuhan restock secara manual.",
            },
          },
          severity: "warning",
          confidence_score: 0.82,
          branch_id: "branch-1",
          product_id: "product-1",
          reference_data: { sku: "SKU-1", quantity_on_hand: 2 },
          prohibited_action_requested: false,
        },
      ],
    }),
  });

  const result = await service.generateInsights();

  assert.equal(result.success, true);
  assert.equal(result.data.status, "success");
  assert.equal(result.data.insight_count, 1);
  assert.equal(createdInsights.length, 1);
  assert.equal(createdInsights[0]?.insightType, "low_stock_alert");
  assert.equal(
    (createdInsights[0]?.referenceData as Record<string, unknown>).llm_provider,
    "gemini",
  );
  assert.deepEqual(
    (createdInsights[0]?.referenceData as Record<string, unknown>)
      .role_variants,
    {
      executive: {
        title: "Coffee Beans stock risk",
        summary: "Coffee Beans needs management attention.",
        recommendation: "Prioritize stock review.",
      },
      hq_admin: {
        title: "Coffee Beans stok rendah",
        summary: "Stok tersisa 2 pcs di BR-1.",
        recommendation: "Review kebutuhan restock secara manual.",
      },
    },
  );
});

test("AiService rejects LLM output without required role variants", async () => {
  const { service, createdInsights, updatedJobs } = createService({
    generateInsights: async () => ({
      insights: [
        {
          insight_type: "low_stock_alert",
          title: "Coffee Beans stok rendah",
          summary: "Stok tersisa 2 pcs di BR-1.",
          recommendation: "Review kebutuhan restock secara manual.",
          severity: "warning",
          confidence_score: 0.82,
          branch_id: "branch-1",
          product_id: "product-1",
          reference_data: { sku: "SKU-1", quantity_on_hand: 2 },
          prohibited_action_requested: false,
        },
      ],
    }),
  });

  const result = await service.generateInsights();

  assert.equal(result.success, true);
  assert.equal(result.data.status, "failed");
  assert.equal(result.data.error_code, "LLM_OUTPUT_INVALID");
  assert.equal(createdInsights.length, 0);
  assert.equal(updatedJobs.at(-1)?.errorCode, "LLM_OUTPUT_INVALID");
});

test("AiService selects executive wording for executive users", async () => {
  const { service } = createService({
    generateInsights: async () => ({ insights: [] }),
  });

  const result = await service.listInsights({}, executiveUser.role_code);

  assert.equal(result.data[0]?.title, "Executive stock risk");
  assert.equal(result.data[0]?.summary, "Strategic stock risk summary.");
  assert.equal(
    result.data[0]?.reference_data.recommendation,
    "Prioritize management review.",
  );
  assert.equal(result.data[0]?.reference_data.role_variants, undefined);
});

test("AiService selects HQ admin wording for HQ admin users", async () => {
  const { service } = createService({
    generateInsights: async () => ({ insights: [] }),
  });

  const result = await service.listInsights({}, hqUser.role_code);

  assert.equal(result.data[0]?.title, "Operational stock risk");
  assert.equal(
    result.data[0]?.summary,
    "BR-1 has 2 pcs remaining against threshold 5.",
  );
  assert.equal(
    result.data[0]?.reference_data.recommendation,
    "Review branch restock needs manually.",
  );
  assert.equal(result.data[0]?.reference_data.role_variants, undefined);
});

test("AiService reuses fresh cached LLM insights during cooldown", async () => {
  let called = false;
  const { service, createdInsights } = createService(
    {
      generateInsights: async () => {
        called = true;
        return { insights: [] };
      },
    },
    "gemini-key",
    { cachedJob: true },
  );

  const result = await service.generateInsights();

  assert.equal(result.success, true);
  assert.equal(result.data.status, "cached");
  assert.equal(result.data.insight_count, 1);
  assert.equal(called, false);
  assert.equal(createdInsights.length, 0);
});

test("AiController rejects cashier LLM generation access", () => {
  const controller = new AiController({
    generateInsights: async () => {
      throw new Error("should not call service");
    },
  } as unknown as AiService);

  assert.throws(
    () => controller.generateInsights({ user: cashierUser }),
    ForbiddenException,
  );
});

test("AiController allows HQ users to trigger LLM generation", async () => {
  let called = false;
  const controller = new AiController({
    generateInsights: async () => {
      called = true;
      return { success: true, data: { status: "success" } };
    },
  } as unknown as AiService);

  await controller.generateInsights({ user: hqUser });

  assert.equal(called, true);
});

test("AiController rejects cashier LLM insight list access", () => {
  const controller = new AiController({
    listInsights: async () => ({ success: true, data: [] }),
  } as unknown as AiService);

  assert.throws(
    () => controller.insights({ user: cashierUser }, {}),
    ForbiddenException,
  );
});
