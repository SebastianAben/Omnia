import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { resolveBranchScope } from "../auth/access-scope";
import type { CurrentUser } from "../auth/dto";
import { AuthGuard } from "../auth/guards/auth.guard";
import { InventoryService } from "./inventory.service";

type RequestWithUser = {
  user: CurrentUser;
};

@ApiTags("inventory")
@Controller("inventory")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get("balances")
  @ApiOkResponse({ description: "List inventory balances by branch/product." })
  listBalances(
    @Req() request: RequestWithUser,
    @Query("branch_id") branchId?: string,
    @Query("product_id") productId?: string,
  ) {
    return this.inventoryService.listBalances({
      branch_id: resolveBranchScope(request.user, branchId),
      product_id: productId,
    });
  }

  @Get("movements")
  @ApiOkResponse({ description: "List recent stock movements." })
  listMovements(
    @Req() request: RequestWithUser,
    @Query("branch_id") branchId?: string,
    @Query("product_id") productId?: string,
  ) {
    return this.inventoryService.listMovements({
      branch_id: resolveBranchScope(request.user, branchId),
      product_id: productId,
    });
  }

  @Get("stock-movements")
  @ApiOkResponse({ description: "List recent stock movements." })
  listStockMovements(
    @Req() request: RequestWithUser,
    @Query("branch_id") branchId?: string,
    @Query("product_id") productId?: string,
  ) {
    return this.inventoryService.listMovements({
      branch_id: resolveBranchScope(request.user, branchId),
      product_id: productId,
    });
  }
}
