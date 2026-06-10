import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { ok } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";

type CreateProductInput = {
  branch_id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  unit: string;
  category_id?: string | null;
  selling_price: number;
  opening_stock: number;
  minimum_stock_threshold: number;
  updated_by_user_id: string;
};

@Injectable()
export class ProductsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listProducts(includeInactive = false) {
    const products = await this.prisma.product.findMany({
      where: includeInactive ? undefined : { isActive: true },
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

  async createProduct(input: CreateProductInput) {
    const now = new Date();

    try {
      const product = await this.prisma.$transaction(async (tx) => {
        const createdProduct = await tx.product.create({
          data: {
            sku: input.sku.trim(),
            barcode: input.barcode?.trim() || null,
            name: input.name.trim(),
            description: input.description?.trim() || null,
            unit: input.unit.trim(),
            categoryId: input.category_id ?? null,
          },
          include: { category: true },
        });

        await tx.branchProductPrice.create({
          data: {
            branchId: input.branch_id,
            productId: createdProduct.id,
            sellingPrice: new Prisma.Decimal(input.selling_price),
            effectiveFrom: now,
            updatedByUserId: input.updated_by_user_id,
          },
        });

        await tx.inventoryBalance.create({
          data: {
            branchId: input.branch_id,
            productId: createdProduct.id,
            quantityOnHand: new Prisma.Decimal(input.opening_stock),
            minimumStockThreshold: new Prisma.Decimal(
              input.minimum_stock_threshold,
            ),
          },
        });

        if (input.opening_stock > 0) {
          await tx.stockMovement.create({
            data: {
              branchId: input.branch_id,
              productId: createdProduct.id,
              sourceType: "product_created",
              sourceId: createdProduct.id,
              movementType: "STOCK_IN",
              quantityDelta: new Prisma.Decimal(input.opening_stock),
              quantityBefore: new Prisma.Decimal(0),
              quantityAfter: new Prisma.Decimal(input.opening_stock),
              reasonCode: "initial_stock",
              performedByUserId: input.updated_by_user_id,
              movementAt: now,
              syncStatus: "synced",
            },
          });
        }

        return createdProduct;
      });

      return ok({
        id: product.id,
        sku: product.sku,
        barcode: product.barcode,
        name: product.name,
        description: product.description,
        unit: product.unit,
        category: product.category
          ? { id: product.category.id, name: product.category.name }
          : null,
        is_active: product.isActive,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Product SKU or barcode already exists");
      }

      throw error;
    }
  }

  async deactivateProduct(productId: string) {
    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Product not found");
    }

    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        isActive: false,
        prices: {
          updateMany: {
            where: { isActive: true },
            data: {
              isActive: false,
              effectiveTo: new Date(),
            },
          },
        },
      },
    });

    return ok({
      id: product.id,
      is_active: product.isActive,
    });
  }

  async activateProduct(productId: string) {
    const existing = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Product not found");
    }

    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        isActive: true,
        prices: {
          updateMany: {
            where: { isActive: false },
            data: {
              isActive: true,
              effectiveTo: null,
            },
          },
        },
      },
    });

    return ok({
      id: product.id,
      is_active: product.isActive,
    });
  }
}
