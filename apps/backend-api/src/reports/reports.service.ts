import { Inject, Injectable } from "@nestjs/common";
import { PaymentStatus, TransactionStatus } from "@prisma/client";

import { ok } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";
import {
  parseReportWindow,
  ReportQuery,
  toNumber,
} from "../reporting/reporting-query";

@Injectable()
export class ReportsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async salesSummary(query: ReportQuery) {
    const window = parseReportWindow(query);
    const where = {
      branchId: window.branchId,
      transactionDatetime: {
        gte: window.from,
        lte: window.to,
      },
      transactionStatus: TransactionStatus.COMPLETED,
    };

    const [salesAggregate, paidAggregate, transactions, items, paymentGroups] =
      await Promise.all([
        this.prisma.salesTransaction.aggregate({
          where,
          _count: { _all: true },
          _sum: {
            subtotalAmount: true,
            discountAmount: true,
            taxAmount: true,
            totalAmount: true,
          },
        }),
        this.prisma.payment.aggregate({
          where: {
            paymentStatus: PaymentStatus.PAID,
            transaction: where,
          },
          _sum: { amount: true },
        }),
        this.prisma.salesTransaction.findMany({
          where,
          orderBy: { transactionDatetime: "desc" },
          take: 10,
          select: {
            id: true,
            transactionNo: true,
            transactionDatetime: true,
            totalAmount: true,
            paymentStatus: true,
            branch: { select: { id: true, code: true, name: true } },
          },
        }),
        this.prisma.salesTransactionItem.groupBy({
          by: ["productId"],
          where: { transaction: where },
          _sum: { quantity: true, lineTotal: true },
          orderBy: { _sum: { quantity: "desc" } },
          take: 10,
        }),
        this.prisma.payment.groupBy({
          by: ["paymentMethodCode"],
          where: { transaction: where },
          _count: { _all: true },
          _sum: { amount: true },
        }),
      ]);

    const products = await this.prisma.product.findMany({
      where: { id: { in: items.map((item) => item.productId) } },
      select: { id: true, sku: true, name: true },
    });
    const productById = new Map(products.map((product) => [product.id, product]));

    return ok({
      period: {
        from: window.from,
        to: window.to,
        branch_id: window.branchId ?? null,
      },
      kpi: {
        gross_sales: toNumber(salesAggregate._sum.subtotalAmount),
        net_sales: toNumber(salesAggregate._sum.totalAmount),
        discount_total: toNumber(salesAggregate._sum.discountAmount),
        tax_total: toNumber(salesAggregate._sum.taxAmount),
        paid_amount: toNumber(paidAggregate._sum.amount),
        transaction_count: salesAggregate._count._all,
        average_transaction_value:
          salesAggregate._count._all > 0
            ? toNumber(salesAggregate._sum.totalAmount) /
              salesAggregate._count._all
            : 0,
      },
      top_selling_products: items.map((item) => {
        const product = productById.get(item.productId);

        return {
          product_id: item.productId,
          sku: product?.sku ?? null,
          name: product?.name ?? "Unknown product",
          quantity_sold: toNumber(item._sum.quantity),
          sales_amount: toNumber(item._sum.lineTotal),
        };
      }),
      payment_method_summary: paymentGroups.map((group) => ({
        payment_method_code: group.paymentMethodCode,
        transaction_count: group._count._all,
        amount: toNumber(group._sum.amount),
      })),
      recent_transactions: transactions.map((transaction) => ({
        id: transaction.id,
        transaction_no: transaction.transactionNo,
        transaction_datetime: transaction.transactionDatetime,
        total_amount: toNumber(transaction.totalAmount),
        payment_status: transaction.paymentStatus.toLowerCase(),
        branch: {
          id: transaction.branch.id,
          code: transaction.branch.code,
          name: transaction.branch.name,
        },
      })),
    });
  }

  async inventoryAlerts(query: Pick<ReportQuery, "branch_id">) {
    const balances = await this.prisma.inventoryBalance.findMany({
      where: {
        branchId: query.branch_id,
        minimumStockThreshold: { not: null },
      },
      orderBy: [{ branch: { code: "asc" } }, { product: { name: "asc" } }],
      take: 100,
      select: {
        id: true,
        branchId: true,
        productId: true,
        quantityOnHand: true,
        minimumStockThreshold: true,
        updatedAt: true,
        branch: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, sku: true, name: true, unit: true } },
      },
    });

    return ok(
      balances
        .filter(
          (balance) =>
            balance.minimumStockThreshold !== null &&
            balance.quantityOnHand.lessThanOrEqualTo(
              balance.minimumStockThreshold,
            ),
        )
        .map((balance) => ({
          id: balance.id,
          branch_id: balance.branchId,
          product_id: balance.productId,
          quantity_on_hand: toNumber(balance.quantityOnHand),
          minimum_stock_threshold: toNumber(balance.minimumStockThreshold),
          severity: balance.quantityOnHand.lessThanOrEqualTo(0)
            ? "critical"
            : "warning",
          updated_at: balance.updatedAt,
          branch: balance.branch,
          product: balance.product,
        })),
    );
  }

  async slowMovingProducts(query: ReportQuery) {
    const window = parseReportWindow(query);
    const balances = await this.prisma.inventoryBalance.findMany({
      where: { branchId: window.branchId, quantityOnHand: { gt: 0 } },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        branchId: true,
        productId: true,
        quantityOnHand: true,
        branch: { select: { id: true, code: true, name: true } },
        product: { select: { id: true, sku: true, name: true, unit: true } },
      },
    });
    const sales = await this.prisma.salesTransactionItem.groupBy({
      by: ["productId"],
      where: {
        productId: { in: balances.map((balance) => balance.productId) },
        transaction: {
          branchId: window.branchId,
          transactionDatetime: { gte: window.from, lte: window.to },
          transactionStatus: TransactionStatus.COMPLETED,
        },
      },
      _sum: { quantity: true },
    });
    const salesByProductId = new Map(
      sales.map((sale) => [sale.productId, toNumber(sale._sum.quantity)]),
    );

    return balances
      .map((balance) => ({
        branch: balance.branch,
        product: balance.product,
        quantity_on_hand: toNumber(balance.quantityOnHand),
        quantity_sold: salesByProductId.get(balance.productId) ?? 0,
      }))
      .sort((a, b) => a.quantity_sold - b.quantity_sold)
      .slice(0, 10);
  }
}

