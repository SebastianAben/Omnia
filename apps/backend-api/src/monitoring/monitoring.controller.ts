import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { AuthGuard } from "../auth/guards/auth.guard";
import { MonitoringService } from "./monitoring.service";

@ApiTags("monitoring")
@Controller("monitoring")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get("branches/sync-health")
  @ApiOkResponse({ description: "Branch sync health snapshot." })
  branchSyncHealth(@Query("branch_id") branchId?: string) {
    return this.monitoringService.branchSyncHealth({ branch_id: branchId });
  }
}

