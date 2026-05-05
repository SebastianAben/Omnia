import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { AuthGuard } from "../auth/guards/auth.guard";
import { AuditService } from "./audit.service";

@ApiTags("audit")
@Controller("audit")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get("logs")
  @ApiOkResponse({ description: "List audit logs with basic filters." })
  logs(
    @Query("branch_id") branchId?: string,
    @Query("user_id") userId?: string,
    @Query("entity_type") entityType?: string,
    @Query("action") action?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.auditService.listLogs({
      branch_id: branchId,
      user_id: userId,
      entity_type: entityType,
      action,
      from,
      to,
    });
  }
}

