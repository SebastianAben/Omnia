import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

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
    const user = request.user;
    const effectiveBranchId = branchId ?? user.branch_id;

    if (!effectiveBranchId) {
      throw new ForbiddenException("branch_id is required for this user");
    }
    if (user.branch_id && user.branch_id !== effectiveBranchId) {
      throw new ForbiddenException("User cannot access another branch dashboard");
    }

    return this.dashboardService.branchDashboard({
      branch_id: effectiveBranchId,
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
    const role = request.user.role_code.toLowerCase();
    if (role.includes("cashier")) {
      throw new ForbiddenException("Cashier role cannot access central dashboard");
    }

    return this.dashboardService.centralDashboard({
      branch_id: branchId,
      from,
      to,
    });
  }
}

