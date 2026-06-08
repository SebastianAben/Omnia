import {
  Controller,
  Get,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { requireBranchScope } from "../auth/access-scope";
import type { CurrentUser } from "../auth/dto";
import { AuthGuard } from "../auth/guards/auth.guard";
import { HqAdminGuard } from "../auth/guards/hq-admin.guard";
import { BranchesService } from "./branches.service";

type AuthenticatedRequest = Request & { user: CurrentUser };

@ApiTags("branches")
@Controller("branches")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @UseGuards(HqAdminGuard)
  @ApiOkResponse({ description: "List active branches." })
  listBranches() {
    return this.branchesService.listBranches();
  }

  @Get(":branchId/product-prices")
  @ApiOkResponse({ description: "List active product prices for a branch." })
  listBranchPrices(
    @Req() request: AuthenticatedRequest,
    @Param("branchId") branchId: string,
  ) {
    return this.branchesService.listBranchPrices(
      requireBranchScope(request.user, branchId),
    );
  }
}
