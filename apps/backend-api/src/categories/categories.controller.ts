import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { AuthGuard } from "../auth/guards/auth.guard";
import { HqAdminGuard } from "../auth/guards/hq-admin.guard";
import { CategoriesService } from "./categories.service";

@ApiTags("categories")
@Controller("categories")
@UseGuards(AuthGuard, HqAdminGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOkResponse({ description: "List active product categories." })
  listCategories() {
    return this.categoriesService.listCategories();
  }
}
