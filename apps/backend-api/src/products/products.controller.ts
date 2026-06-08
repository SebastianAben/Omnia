import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { AuthGuard } from "../auth/guards/auth.guard";
import { ProductsService } from "./products.service";

@ApiTags("products")
@Controller("products")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(
    @Inject(ProductsService) private readonly productsService: ProductsService,
  ) {}

  @Get()
  @ApiOkResponse({ description: "List active products for POS master data." })
  listProducts() {
    return this.productsService.listProducts();
  }
}
