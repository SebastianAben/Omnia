import { Inject, Injectable } from "@nestjs/common";

import { ok } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";

type InventoryFilters = {
  branch_id?: string;
  product_id?: string;
};

@Injectable()
export class InventoryService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listBalances(filters: InventoryFilters) {
    const balances = await this.prisma.inventoryBalance.findMany({
      where: {
        branchId: filters.branch_id,
        productId: filters.product_id,
      },
      orderBy: { product: { name: "asc" } },
      include: {
        branch: true,
        product: true,
      },
    });

    return ok(
      balances.map((balance) => ({
        id: balance.id,
        branch_id: balance.branchId,
        product_id: balance.productId,
        quantity_on_hand: balance.quantityOnHand.toString(),
        minimum_stock_threshold:
          balance.minimumStockThreshold?.toString() ?? null,
        updated_at: balance.updatedAt,
        product: {
          id: balance.product.id,
          sku: balance.product.sku,
          name: balance.product.name,
          unit: balance.product.unit,
        },
        branch: {
          id: balance.branch.id,
          code: balance.branch.code,
          name: balance.branch.name,
        },
      })),
    );
  }

  async listMovements(filters: InventoryFilters) {
    const movements = await this.prisma.stockMovement.findMany({
      where: {
        branchId: filters.branch_id,
        productId: filters.product_id,
      },
      orderBy: [{ movementAt: "desc" }, { createdAt: "desc" }],
      take: 100,
      include: {
        branch: true,
        product: true,
        performedBy: true,
      },
    });

    return ok(
      movements.map((movement) => ({
        id: movement.id,
        branch_id: movement.branchId,
        product_id: movement.productId,
        source_type: movement.sourceType,
        source_id: movement.sourceId,
        movement_type: movement.movementType.toLowerCase(),
        quantity_delta: movement.quantityDelta.toString(),
        quantity_before: movement.quantityBefore?.toString() ?? null,
        quantity_after: movement.quantityAfter?.toString() ?? null,
        reason_code: movement.reasonCode,
        notes: movement.notes,
        performed_by_user_id: movement.performedByUserId,
        movement_at: movement.movementAt,
        sync_status: movement.syncStatus,
        created_at: movement.createdAt,
        product: {
          id: movement.product.id,
          sku: movement.product.sku,
          name: movement.product.name,
          unit: movement.product.unit,
        },
        branch: {
          id: movement.branch.id,
          code: movement.branch.code,
          name: movement.branch.name,
        },
        performed_by: movement.performedBy
          ? {
              id: movement.performedBy.id,
              username: movement.performedBy.username,
              full_name: movement.performedBy.fullName,
            }
          : null,
      })),
    );
  }
}
