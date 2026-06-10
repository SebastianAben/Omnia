import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { assertCentralAccess, resolveBranchScope } from "../auth/access-scope";
import type { CurrentUser } from "../auth/dto";
import { AuthGuard } from "../auth/guards/auth.guard";
import { AuditService } from "./audit.service";

type RequestWithUser = {
  user: CurrentUser;
};

@ApiTags("audit")
@Controller("audit")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get("logs")
  @ApiOkResponse({ description: "List audit logs with basic filters." })
  logs(
    @Req() request: RequestWithUser,
    @Query("branch_id") branchId?: string,
    @Query("user_id") userId?: string,
    @Query("entity_type") entityType?: string,
    @Query("action") action?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    assertCentralAccess(request.user);

    return this.auditService.listLogs({
      branch_id: resolveBranchScope(request.user, branchId),
      user_id: userId,
      entity_type: entityType,
      action,
      from,
      to,
    });
  }
}
