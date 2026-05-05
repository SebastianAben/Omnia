import { Controller, Get, Inject, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { AuthGuard } from "../auth/guards/auth.guard";
import { HqAdminGuard } from "../auth/guards/hq-admin.guard";
import { MonitoringService } from "./monitoring.service";

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
  branchSyncHealth(@Query("branch_id") branchId?: string) {
    return this.monitoringService.branchSyncHealth({ branch_id: branchId });
  }

  @Get("integrations/shopee")
  @UseGuards(HqAdminGuard)
  @ApiOkResponse({ description: "Shopee integration health snapshot." })
  shopeeIntegrationHealth() {
    return this.monitoringService.shopeeIntegrationHealth();
  }
}
