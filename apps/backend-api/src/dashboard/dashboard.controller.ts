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
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import {
  type ReportQuery,
  reportQuerySchema,
} from "../reporting/reporting-query";
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
    @Query(new ZodValidationPipe(reportQuerySchema)) query: ReportQuery,
  ) {
    return this.dashboardService.branchDashboard({
      ...query,
      branch_id: requireBranchScope(request.user, query.branch_id),
    });
  }

  @Get("central")
  @ApiOkResponse({ description: "Central dashboard for HQ and analyst roles." })
  centralDashboard(
    @Req() request: RequestWithUser,
    @Query(new ZodValidationPipe(reportQuerySchema)) query: ReportQuery,
  ) {
    assertCentralAccess(request.user);

    return this.dashboardService.centralDashboard({
      ...query,
      branch_id: resolveBranchScope(request.user, query.branch_id),
    });
  }
}
