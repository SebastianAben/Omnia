import { Inject, Injectable } from "@nestjs/common";

import { ok } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ProductsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listProducts() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        category: true,
      },
    });

    return ok(
      products.map((product) => ({
        id: product.id,
        sku: product.sku,
        barcode: product.barcode,
        name: product.name,
        description: product.description,
        unit: product.unit,
        category: product.category
          ? {
              id: product.category.id,
              name: product.category.name,
            }
          : null,
        is_active: product.isActive,
      })),
    );
  }
}
