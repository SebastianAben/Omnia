import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { assertCentralAccess, resolveBranchScope } from "../auth/access-scope";
import type { CurrentUser } from "../auth/dto";
import { AuthGuard } from "../auth/guards/auth.guard";
import { ReportsService } from "./reports.service";

type RequestWithUser = {
  user: CurrentUser;
};

@ApiTags("reports")
@Controller("reports")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("sales-summary")
  @ApiOkResponse({ description: "Sales KPI summary with branch/date filters." })
  salesSummary(
    @Req() request: RequestWithUser,
    @Query("branch_id") branchId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    assertCentralAccess(request.user);

    return this.reportsService.salesSummary({
      branch_id: resolveBranchScope(request.user, branchId),
      from,
      to,
    });
  }

  @Get("inventory-alerts")
  @ApiOkResponse({ description: "Products at or below minimum stock threshold." })
  inventoryAlerts(
    @Req() request: RequestWithUser,
    @Query("branch_id") branchId?: string,
  ) {
    return this.reportsService.inventoryAlerts({
      branch_id: resolveBranchScope(request.user, branchId),
    });
  }
}
