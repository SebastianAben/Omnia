import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { resolveBranchScope } from "../auth/access-scope";
import type { CurrentUser } from "../auth/dto";
import { AuthGuard } from "../auth/guards/auth.guard";
import { RegistersService } from "./registers.service";

type AuthenticatedRequest = Request & { user: CurrentUser };

@ApiTags("registers")
@Controller("registers")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class RegistersController {
  constructor(private readonly registersService: RegistersService) {}

  @Get()
  @ApiOkResponse({ description: "List active registers by branch." })
  listRegisters(
    @Req() request: AuthenticatedRequest,
    @Query("branch_id") branchId?: string,
  ) {
    return this.registersService.listRegisters(
      resolveBranchScope(request.user, branchId),
    );
  }
}
