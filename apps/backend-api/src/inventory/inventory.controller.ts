import { Controller, Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { InventoryService } from "./inventory.service";

@ApiTags("inventory")
@Controller("inventory")
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get("balances")
  @ApiOkResponse({ description: "List inventory balances by branch/product." })
  listBalances(
    @Query("branch_id") branchId?: string,
    @Query("product_id") productId?: string,
  ) {
    return this.inventoryService.listBalances({
      branch_id: branchId,
      product_id: productId,
    });
  }

  @Get("movements")
  @ApiOkResponse({ description: "List recent stock movements." })
  listMovements(
    @Query("branch_id") branchId?: string,
    @Query("product_id") productId?: string,
  ) {
    return this.inventoryService.listMovements({
      branch_id: branchId,
      product_id: productId,
    });
  }

  @Get("stock-movements")
  @ApiOkResponse({ description: "List recent stock movements." })
  listStockMovements(
    @Query("branch_id") branchId?: string,
    @Query("product_id") productId?: string,
  ) {
    return this.inventoryService.listMovements({
      branch_id: branchId,
      product_id: productId,
    });
  }
}
