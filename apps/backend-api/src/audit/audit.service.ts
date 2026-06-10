import { Inject, Injectable } from "@nestjs/common";
import { z } from "zod";

import { ok } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";

const auditQuerySchema = z.object({
  branch_id: z.string().trim().min(1).optional(),
  user_id: z.string().trim().min(1).optional(),
  entity_type: z.string().trim().min(1).optional(),
  action: z.string().trim().min(1).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

type AuditQuery = z.infer<typeof auditQuerySchema>;

@Injectable()
export class AuditService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listLogs(query: AuditQuery) {
    const parsed = auditQuerySchema.parse(query);
    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 14);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        branchId: parsed.branch_id,
        userId: parsed.user_id,
        entityType: parsed.entity_type,
        action: parsed.action,
        createdAt: {
          gte: parsed.from ? new Date(parsed.from) : defaultFrom,
          lte: parsed.to ? new Date(parsed.to) : now,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        userId: true,
        branchId: true,
        entityType: true,
        entityId: true,
        action: true,
        note: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        branch: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return ok(
      logs.map((log) => ({
        id: log.id,
        user_id: log.userId,
        branch_id: log.branchId,
        entity_type: log.entityType,
        entity_id: log.entityId,
        action: log.action,
        note: log.note,
        created_at: log.createdAt,
        user: log.user
          ? {
              id: log.user.id,
              username: log.user.username,
              full_name: log.user.fullName,
            }
          : null,
        branch: log.branch,
      })),
    );
  }
}

