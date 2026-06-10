import { Controller, Get, Inject, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { resolveBranchScope } from "../auth/access-scope";
import type { CurrentUser } from "../auth/dto";
import { AuthGuard } from "../auth/guards/auth.guard";
import { MonitoringService } from "./monitoring.service";

type RequestWithUser = {
  user: CurrentUser;
};

@ApiTags("monitoring")
@Controller("monitoring")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class MonitoringController {
  constructor(
    @Inject(MonitoringService)
    private readonly monitoringService: MonitoringService,
  ) {}

  @Get("branches/sync-health")
  @ApiOkResponse({ description: "Branch sync health snapshot." })
  branchSyncHealth(
    @Req() request: RequestWithUser,
    @Query("branch_id") branchId?: string,
  ) {
    return this.monitoringService.branchSyncHealth({
      branch_id: resolveBranchScope(request.user, branchId),
    });
  }
}
