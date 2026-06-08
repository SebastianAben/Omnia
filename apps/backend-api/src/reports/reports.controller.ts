import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { assertCentralAccess, resolveBranchScope } from "../auth/access-scope";
import type { CurrentUser } from "../auth/dto";
import { AuthGuard } from "../auth/guards/auth.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import {
  type ReportQuery,
  reportQuerySchema,
} from "../reporting/reporting-query";
import { ReportsService } from "./reports.service";

type RequestWithUser = {
  user: CurrentUser;
};

type HeaderResponse = {
  setHeader(name: string, value: string): void;
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
    @Query(new ZodValidationPipe(reportQuerySchema)) query: ReportQuery,
  ) {
    assertCentralAccess(request.user);

    return this.reportsService.salesSummary({
      ...query,
      branch_id: resolveBranchScope(request.user, query.branch_id),
    });
  }

  @Get("sales-summary/export")
  @ApiOkResponse({ description: "Sales summary export as bounded CSV." })
  async salesSummaryExport(
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: HeaderResponse,
    @Query(new ZodValidationPipe(reportQuerySchema)) query: ReportQuery,
  ) {
    assertCentralAccess(request.user);

    const exportResult = await this.reportsService.salesSummaryCsv({
      ...query,
      branch_id: resolveBranchScope(request.user, query.branch_id),
    });

    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${exportResult.filename}"`,
    );
    response.setHeader("X-Omnia-Row-Count", String(exportResult.row_count));
    response.setHeader("X-Omnia-Row-Limit", String(exportResult.row_limit));
    response.setHeader("X-Omnia-Truncated", String(exportResult.truncated));

    return exportResult.csv;
  }

  @Get("inventory-alerts")
  @ApiOkResponse({ description: "Products at or below minimum stock threshold." })
  inventoryAlerts(
    @Req() request: RequestWithUser,
    @Query(new ZodValidationPipe(reportQuerySchema)) query: ReportQuery,
  ) {
    return this.reportsService.inventoryAlerts({
      branch_id: resolveBranchScope(request.user, query.branch_id),
    });
  }
}
