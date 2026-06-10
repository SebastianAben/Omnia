import { Inject, Injectable } from "@nestjs/common";
import { SyncJobStatus, TransactionStatus } from "@prisma/client";

import { ok } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";
import {
  parseReportWindow,
  ReportQuery,
  toNumber,
} from "../reporting/reporting-query";
import { ReportsService } from "../reports/reports.service";

@Injectable()
export class DashboardService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ReportsService) private readonly reportsService: ReportsService,
  ) {}

  async branchDashboard(query: ReportQuery) {
    const window = parseReportWindow(query);
    const [sales, alerts, slowMoving, syncHealth, openShifts] =
      await Promise.all([
        this.reportsService.salesSummary(query),
        this.reportsService.inventoryAlerts({ branch_id: window.branchId }),
        this.reportsService.slowMovingProducts(query),
        this.branchSyncHealth(window.branchId),
        this.prisma.shift.count({
          where: { branchId: window.branchId, status: "OPEN" },
        }),
      ]);

    return ok({
      scope: "branch",
      branch_id: window.branchId,
      period: sales.data.period,
      kpi: {
        ...sales.data.kpi,
        open_shift_count: openShifts,
        low_stock_count: alerts.data.length,
        failed_sync_count: syncHealth.failed_jobs,
        pending_sync_count: syncHealth.pending_jobs,
      },
      top_selling_products: sales.data.top_selling_products,
      slow_moving_products: slowMoving,
      payment_method_summary: sales.data.payment_method_summary,
      inventory_alerts: alerts.data.slice(0, 10),
      sync_health: syncHealth,
      recent_transactions: sales.data.recent_transactions,
    });
  }

  async centralDashboard(query: ReportQuery) {
    const window = parseReportWindow(query);
    const [sales, alerts, slowMoving, branchPerformance, syncHealth] =
      await Promise.all([
        this.reportsService.salesSummary(query),
        this.reportsService.inventoryAlerts({ branch_id: window.branchId }),
        this.reportsService.slowMovingProducts(query),
        this.branchPerformance(window),
        this.allBranchSyncHealth(window.branchId),
      ]);

    return ok({
      scope: "central",
      period: sales.data.period,
      kpi: {
        ...sales.data.kpi,
        branch_count: branchPerformance.length,
        low_stock_count: alerts.data.length,
        unhealthy_branch_count: syncHealth.filter(
          (branch) => branch.health_status !== "healthy",
        ).length,
      },
      branch_performance: branchPerformance,
      top_selling_products: sales.data.top_selling_products,
      slow_moving_products: slowMoving,
      payment_method_summary: sales.data.payment_method_summary,
      inventory_alerts: alerts.data.slice(0, 20),
      sync_health: syncHealth,
      integration_health: [],
    });
  }

  private async branchPerformance(window: {
    branchId?: string;
    from: Date;
    to: Date;
  }) {
    const branches = await this.prisma.branch.findMany({
      where: { id: window.branchId, isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    });
    const groups = await this.prisma.salesTransaction.groupBy({
      by: ["branchId"],
      where: {
        branchId: window.branchId,
        transactionDatetime: { gte: window.from, lte: window.to },
        transactionStatus: TransactionStatus.COMPLETED,
      },
      _count: { _all: true },
      _sum: { totalAmount: true },
    });
    const byBranch = new Map(groups.map((group) => [group.branchId, group]));

    return branches.map((branch) => {
      const group = byBranch.get(branch.id);

      return {
        branch,
        transaction_count: group?._count._all ?? 0,
        net_sales: toNumber(group?._sum.totalAmount),
      };
    });
  }

  private async allBranchSyncHealth(branchId?: string) {
    const branches = await this.prisma.branch.findMany({
      where: { id: branchId, isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    });

    return Promise.all(
      branches.map((branch) => this.branchSyncHealth(branch.id)),
    );
  }

  private async branchSyncHealth(branchId?: string) {
    const [jobs, lastAppliedLog] = await Promise.all([
      this.prisma.syncJob.groupBy({
        by: ["status"],
        where: { branchId },
        _count: { _all: true },
      }),
      this.prisma.syncLog.findFirst({
        where: { branchId, status: "APPLIED" },
        orderBy: { loggedAt: "desc" },
        select: { loggedAt: true, eventType: true },
      }),
    ]);
    const counts = new Map(jobs.map((job) => [job.status, job._count._all]));
    const failedJobs = counts.get(SyncJobStatus.FAILED) ?? 0;
    const conflictJobs = counts.get(SyncJobStatus.CONFLICT) ?? 0;
    const pendingJobs = counts.get(SyncJobStatus.PENDING) ?? 0;

    return {
      branch_id: branchId ?? null,
      pending_jobs: pendingJobs,
      processing_jobs: counts.get(SyncJobStatus.PROCESSING) ?? 0,
      success_jobs: counts.get(SyncJobStatus.SUCCESS) ?? 0,
      failed_jobs: failedJobs,
      conflict_jobs: conflictJobs,
      last_successful_sync_at: lastAppliedLog?.loggedAt ?? null,
      last_successful_event_type: lastAppliedLog?.eventType ?? null,
      health_status:
        failedJobs > 0 || conflictJobs > 0
          ? "attention_required"
          : pendingJobs > 0
            ? "pending"
            : "healthy",
    };
  }
}
