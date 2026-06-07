import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import {
  assertCentralAccess,
  requireBranchScope,
  resolveBranchScope,
} from "../auth/access-scope";
import type { CurrentUser } from "../auth/dto";
import { AuthGuard } from "../auth/guards/auth.guard";
import { DashboardService } from "./dashboard.service";

type RequestWithUser = {
  user: CurrentUser;
};

@ApiTags("dashboard")
@Controller("dashboard")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("branch")
  @ApiOkResponse({ description: "Branch operations dashboard." })
  branchDashboard(
    @Req() request: RequestWithUser,
    @Query("branch_id") branchId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.dashboardService.branchDashboard({
      branch_id: requireBranchScope(request.user, branchId),
      from,
      to,
    });
  }

  @Get("central")
  @ApiOkResponse({ description: "Central dashboard for HQ and analyst roles." })
  centralDashboard(
    @Req() request: RequestWithUser,
    @Query("branch_id") branchId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    assertCentralAccess(request.user);

    return this.dashboardService.centralDashboard({
      branch_id: resolveBranchScope(request.user, branchId),
      from,
      to,
    });
  }
}
