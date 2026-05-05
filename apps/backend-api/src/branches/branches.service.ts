import { Inject, Injectable } from "@nestjs/common";

import { ok } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BranchesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listBranches() {
    const branches = await this.prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    });

    return ok(
      branches.map((branch) => ({
        id: branch.id,
        code: branch.code,
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        status: branch.status,
        is_active: branch.isActive,
      })),
    );
  }

  async listBranchPrices(branchId: string) {
    const prices = await this.prisma.branchProductPrice.findMany({
      where: {
        branchId,
        isActive: true,
        product: { isActive: true },
      },
      orderBy: { product: { name: "asc" } },
      include: {
        product: true,
      },
    });

    return ok(
      prices.map((price) => ({
        id: price.id,
        branch_id: price.branchId,
        product_id: price.productId,
        sku: price.product.sku,
        product_name: price.product.name,
        selling_price: price.sellingPrice.toString(),
        effective_from: price.effectiveFrom,
        effective_to: price.effectiveTo,
        is_active: price.isActive,
      })),
    );
  }
}
