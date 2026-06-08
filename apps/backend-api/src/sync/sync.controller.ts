import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Inject,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { resolveBranchScope } from "../auth/access-scope";
import type { CurrentUser } from "../auth/dto";
import { AuthGuard } from "../auth/guards/auth.guard";
import { SyncEventDto } from "./sync.dto";
import { SyncService } from "./sync.service";

type RequestWithUser = {
  user: CurrentUser;
};

function readBranchId(body: unknown): string | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const branchId = (body as { branch_id?: unknown }).branch_id;
  return typeof branchId === "string" ? branchId : undefined;
}

function assertProducedByUser(user: CurrentUser, body: unknown): void {
  if (!body || typeof body !== "object") {
    return;
  }

  const producedByUserId = (body as { produced_by_user_id?: unknown })
    .produced_by_user_id;
  if (
    typeof producedByUserId === "string" &&
    producedByUserId !== user.id
  ) {
    throw new ForbiddenException("produced_by_user_id must match bearer user");
  }
}

@ApiTags("sync")
@Controller("sync")
export class SyncController {
  constructor(@Inject(SyncService) private readonly syncService: SyncService) {}

  @Post("events")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: "Accepts a branch sync event skeleton." })
  receiveEvent(
    @Req() request: RequestWithUser,
    @Body() dto: SyncEventDto,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    resolveBranchScope(request.user, dto.branch_id);
    assertProducedByUser(request.user, dto);
    return this.syncService.receiveEvent(dto, idempotencyKey);
  }

  @Post("bundles")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: "Applies a transaction sync bundle." })
  receiveBundle(
    @Req() request: RequestWithUser,
    @Body() body: unknown,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    resolveBranchScope(request.user, readBranchId(body));
    assertProducedByUser(request.user, body);
    return this.syncService.receiveBundle(body, idempotencyKey);
  }

  @Get("jobs")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: "List recent sync jobs." })
  listJobs(
    @Req() request: RequestWithUser,
    @Query("branch_id") branchId?: string,
    @Query("status") status?: string,
    @Query("job_type") jobType?: string,
  ) {
    return this.syncService.listJobs({
      branch_id: resolveBranchScope(request.user, branchId),
      status,
      job_type: jobType,
    });
  }

  @Get("logs")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: "List recent sync logs." })
  listLogs(
    @Req() request: RequestWithUser,
    @Query("sync_job_id") syncJobId?: string,
    @Query("branch_id") branchId?: string,
    @Query("log_level") logLevel?: string,
  ) {
    return this.syncService.listLogs({
      sync_job_id: syncJobId,
      branch_id: resolveBranchScope(request.user, branchId),
      log_level: logLevel,
    });
  }
}
