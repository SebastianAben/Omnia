import {
  Body,
  Controller,
  Headers,
  Inject,
  Post,
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
}
