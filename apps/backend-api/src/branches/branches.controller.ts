import { Controller, Get, Param } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { BranchesService } from "./branches.service";

@ApiTags("branches")
@Controller("branches")
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOkResponse({ description: "List active branches." })
  listBranches() {
    return this.branchesService.listBranches();
  }

  @Get(":branchId/product-prices")
  @ApiOkResponse({ description: "List active product prices for a branch." })
  listBranchPrices(@Param("branchId") branchId: string) {
    return this.branchesService.listBranchPrices(branchId);
  }
}
