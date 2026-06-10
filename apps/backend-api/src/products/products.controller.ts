import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { z } from "zod";

import { requireBranchScope } from "../auth/access-scope";
import type { CurrentUser } from "../auth/dto";
import { AuthGuard } from "../auth/guards/auth.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { ProductsService } from "./products.service";

const createProductSchema = z.object({
  branch_id: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().min(1).nullable().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  unit: z.string().min(1).default("pcs"),
  category_id: z.string().min(1).nullable().optional(),
  selling_price: z.coerce.number().finite().nonnegative(),
  opening_stock: z.coerce.number().finite().nonnegative().default(0),
  minimum_stock_threshold: z.coerce.number().finite().nonnegative().default(0),
});

type CreateProductDto = z.infer<typeof createProductSchema>;
type AuthenticatedRequest = Request & { user: CurrentUser };

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
  listProducts(@Query("include_inactive") includeInactive?: string) {
    return this.productsService.listProducts(includeInactive === "true");
  }

  @Post()
  @ApiOkResponse({
    description: "Create a product with branch price and stock.",
  })
  createProduct(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createProductSchema)) dto: CreateProductDto,
  ) {
    return this.productsService.createProduct({
      ...dto,
      branch_id: requireBranchScope(request.user, dto.branch_id),
      updated_by_user_id: request.user.id,
    });
  }

  @Delete(":productId")
  @ApiOkResponse({
    description: "Deactivate a product without deleting history.",
  })
  deactivateProduct(@Param("productId") productId: string) {
    return this.productsService.deactivateProduct(productId);
  }

  @Patch(":productId/activate")
  @ApiOkResponse({ description: "Reactivate a product." })
  activateProduct(@Param("productId") productId: string) {
    return this.productsService.activateProduct(productId);
  }
}
