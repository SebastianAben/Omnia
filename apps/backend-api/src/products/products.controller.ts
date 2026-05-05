import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("products")
@Controller("products")
export class ProductsController {
  @Get()
  @ApiOkResponse({ description: "Product module skeleton for Sprint 0." })
  listProducts() {
    return {
      success: true,
      data: [],
      meta: {
        module: "products",
        status: "skeleton",
      },
    };
  }
}
