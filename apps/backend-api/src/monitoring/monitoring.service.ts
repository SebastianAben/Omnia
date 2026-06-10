import { Inject, Injectable } from "@nestjs/common";
import { SyncJobStatus } from "@prisma/client";

import { ok } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MonitoringService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async branchSyncHealth(filters: { branch_id?: string }) {
    const branches = await this.prisma.branch.findMany({
      where: { id: filters.branch_id, isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    });

    const rows = await Promise.all(
      branches.map(async (branch) => {
        const [jobGroups, lastLog, lastFailure] = await Promise.all([
          this.prisma.syncJob.groupBy({
            by: ["status"],
            where: { branchId: branch.id },
            _count: { _all: true },
          }),
          this.prisma.syncLog.findFirst({
            where: { branchId: branch.id, status: "APPLIED" },
            orderBy: { loggedAt: "desc" },
            select: { eventType: true, loggedAt: true },
          }),
          this.prisma.syncLog.findFirst({
            where: {
              branchId: branch.id,
              OR: [
                { status: "REJECTED" },
                { status: "CONFLICT_DETECTED" },
                { logLevel: "error" },
              ],
            },
            orderBy: { loggedAt: "desc" },
            select: {
              eventType: true,
              errorCode: true,
              errorMessage: true,
              loggedAt: true,
            },
          }),
        ]);
        const counts = new Map(
          jobGroups.map((group) => [group.status, group._count._all]),
        );
        const failedJobs = counts.get(SyncJobStatus.FAILED) ?? 0;
        const conflictJobs = counts.get(SyncJobStatus.CONFLICT) ?? 0;
        const pendingJobs = counts.get(SyncJobStatus.PENDING) ?? 0;

        return {
          branch,
          pending_jobs: pendingJobs,
          processing_jobs: counts.get(SyncJobStatus.PROCESSING) ?? 0,
          success_jobs: counts.get(SyncJobStatus.SUCCESS) ?? 0,
          failed_jobs: failedJobs,
          conflict_jobs: conflictJobs,
          last_successful_sync_at: lastLog?.loggedAt ?? null,
          last_successful_event_type: lastLog?.eventType ?? null,
          last_failure_at: lastFailure?.loggedAt ?? null,
          last_failure_event_type: lastFailure?.eventType ?? null,
          last_failure_code: lastFailure?.errorCode ?? null,
          last_failure_message: lastFailure?.errorMessage ?? null,
          health_status:
            failedJobs > 0 || conflictJobs > 0 || lastFailure
              ? "attention_required"
              : pendingJobs > 0
                ? "pending"
                : "healthy",
        };
      }),
    );

    return ok(rows);
  }
}
