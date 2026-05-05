import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { AuthGuard } from "../auth/guards/auth.guard";
import { SyncEventDto } from "./sync.dto";
import { SyncService } from "./sync.service";

@ApiTags("sync")
@Controller("sync")
export class SyncController {
  constructor(@Inject(SyncService) private readonly syncService: SyncService) {}

  @Post("events")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: "Accepts a branch sync event skeleton." })
  receiveEvent(
    @Body() dto: SyncEventDto,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.syncService.receiveEvent(dto, idempotencyKey);
  }

  @Post("bundles")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: "Applies a transaction sync bundle." })
  receiveBundle(
    @Body() body: unknown,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.syncService.receiveBundle(body, idempotencyKey);
  }

  @Get("jobs")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: "List recent sync jobs." })
  listJobs(
    @Query("branch_id") branchId?: string,
    @Query("status") status?: string,
    @Query("job_type") jobType?: string,
  ) {
    return this.syncService.listJobs({
      branch_id: branchId,
      status,
      job_type: jobType,
    });
  }

  @Get("logs")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: "List recent sync logs." })
  listLogs(
    @Query("sync_job_id") syncJobId?: string,
    @Query("branch_id") branchId?: string,
    @Query("log_level") logLevel?: string,
  ) {
    return this.syncService.listLogs({
      sync_job_id: syncJobId,
      branch_id: branchId,
      log_level: logLevel,
    });
  }
}
