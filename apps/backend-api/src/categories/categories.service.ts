import { Inject, Injectable } from "@nestjs/common";

import { ok } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CategoriesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listCategories() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return ok(
      categories.map((category) => ({
        id: category.id,
        parent_category_id: category.parentCategoryId,
        name: category.name,
        is_active: category.isActive,
      })),
    );
  }
}
