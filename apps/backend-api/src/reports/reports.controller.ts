import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { AuthGuard } from "../auth/guards/auth.guard";
import { ReportsService } from "./reports.service";

@ApiTags("reports")
@Controller("reports")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("sales-summary")
  @ApiOkResponse({ description: "Sales KPI summary with branch/date filters." })
  salesSummary(
    @Query("branch_id") branchId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.reportsService.salesSummary({ branch_id: branchId, from, to });
  }

  @Get("inventory-alerts")
  @ApiOkResponse({ description: "Products at or below minimum stock threshold." })
  inventoryAlerts(@Query("branch_id") branchId?: string) {
    return this.reportsService.inventoryAlerts({ branch_id: branchId });
  }
}

