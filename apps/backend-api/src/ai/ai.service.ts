import { Inject, Injectable } from "@nestjs/common";
import { Prisma, TransactionStatus } from "@prisma/client";

import { ok } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";
import { toNumber } from "../reporting/reporting-query";
import { AiInsightQuery } from "./ai.dto";

const AI_INSIGHT_TTL_MINUTES = 15;
const ANALYSIS_WINDOW_DAYS = 30;
const MIN_TRANSACTIONS_FOR_CONFIDENT_TREND = 5;

type GeneratedInsight = {
  branchId?: string;
  productId?: string;
  insightType: string;
  title: string;
  summary: string;
  severity: "info" | "warning" | "critical";
  confidenceScore: number;
  referenceData: Prisma.InputJsonValue;
};

type SalesAccumulator = {
  branchId: string;
  branchName: string;
  branchCode: string;
  productId: string;
  productName: string;
  sku: string;
  categoryName: string | null;
  quantitySold: number;
  salesAmount: number;
  transactionIds: Set<string>;
};

type InventoryBalanceRow = {
  branchId: string;
  productId: string;
  quantityOnHand: Prisma.Decimal;
  minimumStockThreshold: Prisma.Decimal | null;
  updatedAt: Date;
  branch: { id: string; code: string; name: string };
  product: {
    id: string;
    sku: string;
    name: string;
    unit: string;
    category: { name: string } | null;
  };
};

type SalesItemRow = {
  productId: string;
  quantity: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
  transaction: {
    id: string;
    branchId: string;
    transactionDatetime: Date;
    branch: { code: string; name: string };
  };
  product: {
    id: string;
    sku: string;
    name: string;
    category: { name: string } | null;
  };
};

@Injectable()
export class AiService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listInsights(query: AiInsightQuery) {
    await this.ensureRecentInsights();

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
      insights.map((insight) => ({
        id: insight.id,
        branch_id: insight.branchId,
        product_id: insight.productId,
        insight_type: insight.insightType,
        title: insight.title,
        summary: insight.summary,
        severity: insight.severity,
        confidence_score: toNumber(insight.confidenceScore),
        reference_data: insight.referenceData,
        generated_at: insight.generatedAt,
        branch: insight.branch,
        product: insight.product,
      })),
      {
        generated_from: "central_database",
        advisory_only: true,
      },
    );
  }

  async ensureRecentInsights() {
    const since = new Date(Date.now() - AI_INSIGHT_TTL_MINUTES * 60 * 1000);
    const recentCount = await this.prisma.aiInsight.count({
      where: { generatedAt: { gte: since } },
    });

    if (recentCount > 0) {
      return;
    }

    await this.generateInsights();
  }

  async generateInsights() {
    const job = await this.prisma.insightGenerationJob.create({
      data: {
        jobType: "ai_insight_generation",
        status: "processing",
        startedAt: new Date(),
        metadata: {
          window_days: ANALYSIS_WINDOW_DAYS,
          generator: "baseline_rules_v1",
        },
      },
    });

    try {
      const insights = await this.buildInsights();
      const expiresAt = new Date(
        Date.now() + AI_INSIGHT_TTL_MINUTES * 60 * 1000,
      );

      await this.prisma.$transaction([
        this.prisma.aiInsight.deleteMany({}),
        this.prisma.aiInsight.createMany({
          data: insights.map((insight) => ({
            branchId: insight.branchId,
            productId: insight.productId,
            insightType: insight.insightType,
            title: insight.title,
            summary: insight.summary,
            severity: insight.severity,
            confidenceScore: new Prisma.Decimal(
              clamp(insight.confidenceScore, 0, 1).toFixed(4),
            ),
            referenceData: insight.referenceData,
            generatedAt: new Date(),
            expiresAt,
          })),
        }),
        this.prisma.insightGenerationJob.update({
          where: { id: job.id },
          data: {
            status: "success",
            finishedAt: new Date(),
            insightCount: insights.length,
          },
        }),
      ]);

      return insights.length;
    } catch (error) {
      await this.prisma.insightGenerationJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          finishedAt: new Date(),
          errorCode: "AI_GENERATION_FAILED",
          errorMessage:
            error instanceof Error
              ? error.message
              : "Unknown AI generation error",
        },
      });
      throw error;
    }
  }

  private async buildInsights(): Promise<GeneratedInsight[]> {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - ANALYSIS_WINDOW_DAYS);

    const [balances, items, transactionCount] = await Promise.all([
      this.prisma.inventoryBalance.findMany({
        where: { branch: { isActive: true }, product: { isActive: true } },
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
        take: 2000,
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
    ]);

    if (transactionCount === 0 && balances.length === 0) {
      return [
        {
          insightType: "data_not_ready",
          title: "Data analytics belum siap",
          summary:
            "Belum ada transaksi atau snapshot inventory pusat yang cukup untuk menghasilkan insight.",
          severity: "info",
          confidenceScore: 0.2,
          referenceData: {
            reason: "no_central_dataset",
            minimum_required: "inventory balance or synced sales transaction",
          },
        },
      ];
    }

    const insights: GeneratedInsight[] = [];
    insights.push(...this.buildLowStockInsights(balances));

    const salesByBranchProduct = this.aggregateSales(items);
    insights.push(
      ...this.buildStockoutPredictions(balances, salesByBranchProduct),
      ...this.buildMovementInsights(salesByBranchProduct, transactionCount),
      ...this.buildBranchTrendInsights(items, transactionCount),
    );

    if (transactionCount < MIN_TRANSACTIONS_FOR_CONFIDENT_TREND) {
      insights.push({
        insightType: "data_not_ready",
        title: "Confidence analytics masih rendah",
        summary:
          "Data transaksi pusat masih sedikit, sehingga insight tren ditampilkan sebagai indikasi awal.",
        severity: "info",
        confidenceScore: 0.35,
        referenceData: {
          transaction_count: transactionCount,
          minimum_recommended_transaction_count:
            MIN_TRANSACTIONS_FOR_CONFIDENT_TREND,
          analysis_window_days: ANALYSIS_WINDOW_DAYS,
        },
      });
    }

    return insights.slice(0, 80);
  }

  private buildLowStockInsights(balances: InventoryBalanceRow[]) {
    return balances
      .filter((balance) => {
        if (!balance.minimumStockThreshold) {
          return false;
        }

        return balance.quantityOnHand.lessThanOrEqualTo(
          balance.minimumStockThreshold,
        );
      })
      .map<GeneratedInsight>((balance) => {
        const onHand = toNumber(balance.quantityOnHand);
        const threshold = toNumber(balance.minimumStockThreshold);
        const severity = onHand <= 0 ? "critical" : "warning";

        return {
          branchId: balance.branchId,
          productId: balance.productId,
          insightType: "low_stock_alert",
          title: `${balance.product.name} stok menipis`,
          summary: `${balance.branch.code} memiliki ${onHand} ${balance.product.unit} tersisa, ambang minimum ${threshold}.`,
          severity,
          confidenceScore: severity === "critical" ? 0.95 : 0.82,
          referenceData: {
            quantity_on_hand: onHand,
            minimum_stock_threshold: threshold,
            branch_code: balance.branch.code,
            sku: balance.product.sku,
            updated_at: balance.updatedAt,
          },
        };
      });
  }

  private aggregateSales(items: SalesItemRow[]) {
    const sales = new Map<string, SalesAccumulator>();

    for (const item of items) {
      const key = `${item.transaction.branchId}:${item.productId}`;
      const current = sales.get(key) ?? {
        branchId: item.transaction.branchId,
        branchCode: item.transaction.branch.code,
        branchName: item.transaction.branch.name,
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        categoryName: item.product.category?.name ?? null,
        quantitySold: 0,
        salesAmount: 0,
        transactionIds: new Set<string>(),
      };

      current.quantitySold += toNumber(item.quantity);
      current.salesAmount += toNumber(item.lineTotal);
      current.transactionIds.add(item.transaction.id);
      sales.set(key, current);
    }

    return sales;
  }

  private buildStockoutPredictions(
    balances: InventoryBalanceRow[],
    salesByBranchProduct: Map<string, SalesAccumulator>,
  ) {
    const predictions: Array<{
      insight: GeneratedInsight;
      daysUntilStockout: number;
    }> = [];

    for (const balance of balances) {
      const sales = salesByBranchProduct.get(
        `${balance.branchId}:${balance.productId}`,
      );

      if (!sales || sales.quantitySold <= 0) {
        continue;
      }

      const onHand = toNumber(balance.quantityOnHand);
      const dailyVelocity = sales.quantitySold / ANALYSIS_WINDOW_DAYS;
      const daysUntilStockout =
        dailyVelocity > 0 ? onHand / dailyVelocity : Number.POSITIVE_INFINITY;

      if (onHand <= 0 || daysUntilStockout > 14) {
        continue;
      }

      const confidence = clamp(
        0.45 +
          Math.min(sales.transactionIds.size, 10) * 0.035 +
          (daysUntilStockout <= 7 ? 0.15 : 0),
        0.45,
        0.9,
      );

      predictions.push({
        insight: {
          branchId: balance.branchId,
          productId: balance.productId,
          insightType: "stockout_prediction",
          title: `${balance.product.name} berpotensi habis`,
          summary: `Dengan velocity ${dailyVelocity.toFixed(2)} unit/hari, stok ${balance.branch.code} diperkirakan habis dalam ${Math.max(1, Math.ceil(daysUntilStockout))} hari.`,
          severity: daysUntilStockout <= 7 ? "critical" : "warning",
          confidenceScore: confidence,
          referenceData: {
            quantity_on_hand: onHand,
            quantity_sold_30d: sales.quantitySold,
            daily_sales_velocity: Number(dailyVelocity.toFixed(4)),
            predicted_stockout_days: Math.ceil(daysUntilStockout),
            transaction_sample_count: sales.transactionIds.size,
          },
        },
        daysUntilStockout,
      });
    }

    return predictions
      .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)
      .slice(0, 20)
      .map((prediction) => prediction.insight);
  }

  private buildMovementInsights(
    salesByBranchProduct: Map<string, SalesAccumulator>,
    transactionCount: number,
  ) {
    const rows = [...salesByBranchProduct.values()].sort(
      (a, b) => b.quantitySold - a.quantitySold,
    );
    const confidence = clamp(0.45 + transactionCount * 0.03, 0.35, 0.88);
    const fastMoving = rows.slice(0, 10).map<GeneratedInsight>((row) => ({
      branchId: row.branchId,
      productId: row.productId,
      insightType: "fast_moving",
      title: `${row.productName} bergerak cepat`,
      summary: `${row.branchCode} menjual ${row.quantitySold} unit dalam ${ANALYSIS_WINDOW_DAYS} hari terakhir.`,
      severity: "info",
      confidenceScore: confidence,
      referenceData: {
        sku: row.sku,
        branch_code: row.branchCode,
        quantity_sold: row.quantitySold,
        sales_amount: row.salesAmount,
        category_name: row.categoryName,
        analysis_window_days: ANALYSIS_WINDOW_DAYS,
      },
    }));
    const slowMoving = rows
      .filter((row) => row.quantitySold <= 2)
      .slice(0, 10)
      .map<GeneratedInsight>((row) => ({
        branchId: row.branchId,
        productId: row.productId,
        insightType: "slow_moving",
        title: `${row.productName} bergerak lambat`,
        summary: `${row.branchCode} hanya menjual ${row.quantitySold} unit dalam ${ANALYSIS_WINDOW_DAYS} hari terakhir.`,
        severity: "info",
        confidenceScore: confidence,
        referenceData: {
          sku: row.sku,
          branch_code: row.branchCode,
          quantity_sold: row.quantitySold,
          sales_amount: row.salesAmount,
          category_name: row.categoryName,
          analysis_window_days: ANALYSIS_WINDOW_DAYS,
        },
      }));

    return [...fastMoving, ...slowMoving];
  }

  private buildBranchTrendInsights(
    items: SalesItemRow[],
    transactionCount: number,
  ) {
    const midpoint = new Date();
    midpoint.setDate(midpoint.getDate() - ANALYSIS_WINDOW_DAYS / 2);
    const byBranch = new Map<
      string,
      {
        branchCode: string;
        branchName: string;
        recentSales: number;
        previousSales: number;
        categories: Map<string, number>;
      }
    >();

    for (const item of items) {
      const row = byBranch.get(item.transaction.branchId) ?? {
        branchCode: item.transaction.branch.code,
        branchName: item.transaction.branch.name,
        recentSales: 0,
        previousSales: 0,
        categories: new Map<string, number>(),
      };
      const amount = toNumber(item.lineTotal);

      if (item.transaction.transactionDatetime >= midpoint) {
        row.recentSales += amount;
      } else {
        row.previousSales += amount;
      }

      const category = item.product.category?.name ?? "Uncategorized";
      row.categories.set(
        category,
        (row.categories.get(category) ?? 0) + amount,
      );
      byBranch.set(item.transaction.branchId, row);
    }

    return [...byBranch.entries()].map<GeneratedInsight>(([branchId, row]) => {
      const delta =
        row.previousSales > 0
          ? ((row.recentSales - row.previousSales) / row.previousSales) * 100
          : row.recentSales > 0
            ? 100
            : 0;
      const topCategory = [...row.categories.entries()].sort(
        (a, b) => b[1] - a[1],
      )[0];

      return {
        branchId,
        insightType: "sales_trend",
        title: `${row.branchName} tren penjualan ${delta >= 0 ? "naik" : "turun"}`,
        summary: `Penjualan 15 hari terakhir ${delta >= 0 ? "naik" : "turun"} ${Math.abs(delta).toFixed(1)}% dibanding 15 hari sebelumnya.`,
        severity: delta < -20 ? "warning" : "info",
        confidenceScore: clamp(0.4 + transactionCount * 0.025, 0.35, 0.85),
        referenceData: {
          branch_code: row.branchCode,
          recent_sales: row.recentSales,
          previous_sales: row.previousSales,
          delta_percent: Number(delta.toFixed(2)),
          top_category: topCategory
            ? { name: topCategory[0], sales_amount: topCategory[1] }
            : null,
          analysis_window_days: ANALYSIS_WINDOW_DAYS,
        },
      };
    });
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
