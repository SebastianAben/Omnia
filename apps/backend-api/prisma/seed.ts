import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${key}`;
}

function verifyPassword(password: string, hash: string): boolean {
  const [scheme, salt, key] = hash.split(":");
  if (scheme !== "scrypt" || !salt || !key) {
    return false;
  }

  const expected = Buffer.from(key, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function upsertDemoUser(input: {
  username: string;
  email: string;
  fullName: string;
  roleId: string;
  branchId?: string;
  password: string;
}): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { username: input.username },
    select: { passwordHash: true },
  });
  const passwordHash =
    existing && verifyPassword(input.password, existing.passwordHash)
      ? existing.passwordHash
      : hashPassword(input.password);

  await prisma.user.upsert({
    where: { username: input.username },
    update: {
      email: input.email,
      fullName: input.fullName,
      roleId: input.roleId,
      branchId: input.branchId,
      passwordHash,
      isActive: true,
    },
    create: {
      username: input.username,
      email: input.email,
      fullName: input.fullName,
      roleId: input.roleId,
      branchId: input.branchId,
      passwordHash,
      isActive: true,
    },
  });
}

async function main(): Promise<void> {
  const [cashierRole, supervisorRole, hqAdminRole, analystRole] =
    await Promise.all([
      prisma.role.upsert({
        where: { code: "cashier" },
        update: { name: "Cashier", isActive: true },
        create: {
          code: "cashier",
          name: "Cashier",
          description: "POS cashier role for branch operations.",
        },
      }),
      prisma.role.upsert({
        where: { code: "store_supervisor" },
        update: { name: "Store Supervisor", isActive: true },
        create: {
          code: "store_supervisor",
          name: "Store Supervisor",
          description: "Branch supervisor for stock and operations.",
        },
      }),
      prisma.role.upsert({
        where: { code: "hq_admin" },
        update: { name: "HQ Admin", isActive: true },
        create: {
          code: "hq_admin",
          name: "HQ Admin",
          description: "Central admin for master data and integrations.",
        },
      }),
      prisma.role.upsert({
        where: { code: "executive_analyst" },
        update: { name: "Executive / Analyst", isActive: true },
        create: {
          code: "executive_analyst",
          name: "Executive / Analyst",
          description: "Read-only executive and analytics role.",
        },
      }),
    ]);

  const mainBranch = await prisma.branch.upsert({
    where: { code: "BR-DEMO" },
    update: {
      name: "Demo Branch",
      address: "Local demo branch",
      status: "ACTIVE",
      isActive: true,
    },
    create: {
      code: "BR-DEMO",
      name: "Demo Branch",
      address: "Local demo branch",
    },
  });

  const secondBranch = await prisma.branch.upsert({
    where: { code: "BR-SECOND" },
    update: {
      name: "Second Branch",
      address: "Secondary demo branch",
      status: "ACTIVE",
      isActive: true,
    },
    create: {
      code: "BR-SECOND",
      name: "Second Branch",
      address: "Secondary demo branch",
    },
  });

  const register = await prisma.register.upsert({
    where: {
      branchId_code: {
        branchId: mainBranch.id,
        code: "REG-01",
      },
    },
    update: {
      name: "Front Register 01",
      deviceIdentifier: "desktop-demo-reg-01",
      isActive: true,
    },
    create: {
      branchId: mainBranch.id,
      code: "REG-01",
      name: "Front Register 01",
      deviceIdentifier: "desktop-demo-reg-01",
    },
  });

  await prisma.register.upsert({
    where: {
      branchId_code: {
        branchId: secondBranch.id,
        code: "REG-01",
      },
    },
    update: {
      name: "Second Branch Register 01",
      isActive: true,
    },
    create: {
      branchId: secondBranch.id,
      code: "REG-01",
      name: "Second Branch Register 01",
    },
  });

  await upsertDemoUser({
    username: "demo.cashier",
    email: "cashier@omnia.local",
    fullName: "Demo Cashier",
    roleId: cashierRole.id,
    branchId: mainBranch.id,
    password: "password123",
  });
  await upsertDemoUser({
    username: "demo.supervisor",
    email: "supervisor@omnia.local",
    fullName: "Demo Supervisor",
    roleId: supervisorRole.id,
    branchId: mainBranch.id,
    password: "password123",
  });
  await upsertDemoUser({
    username: "demo.admin",
    email: "admin@omnia.local",
    fullName: "Demo HQ Admin",
    roleId: hqAdminRole.id,
    password: "password123",
  });
  await upsertDemoUser({
    username: "demo.analyst",
    email: "analyst@omnia.local",
    fullName: "Demo Analyst",
    roleId: analystRole.id,
    password: "password123",
  });

  const cashier = await prisma.user.findUniqueOrThrow({
    where: { username: "demo.cashier" },
  });

  const category = await prisma.category.upsert({
    where: { id: "cat-demo-food" },
    update: { name: "Food & Beverage", isActive: true },
    create: {
      id: "cat-demo-food",
      name: "Food & Beverage",
    },
  });

  const demoProducts = [
    {
      sku: "SKU-DEMO-001",
      barcode: "899000000001",
      name: "Demo Product",
      price: 15000,
      mainStock: 10,
      secondStock: 7,
      threshold: 3,
    },
    {
      sku: "SKU-DEMO-002",
      barcode: "899000000002",
      name: "Iced Tea Bottle",
      price: 12000,
      mainStock: 2,
      secondStock: 14,
      threshold: 5,
    },
    {
      sku: "SKU-DEMO-003",
      barcode: "899000000003",
      name: "Coffee Drip Pack",
      price: 28000,
      mainStock: 24,
      secondStock: 4,
      threshold: 6,
    },
  ];

  const products = [];
  for (const item of demoProducts) {
    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        categoryId: category.id,
        barcode: item.barcode,
        name: item.name,
        unit: "pcs",
        isActive: true,
      },
      create: {
        categoryId: category.id,
        sku: item.sku,
        barcode: item.barcode,
        name: item.name,
        unit: "pcs",
      },
    });
    products.push({ ...item, product });

    await prisma.productVariant.upsert({
      where: {
        productId_variantName_variantValue: {
          productId: product.id,
          variantName: "size",
          variantValue: "regular",
        },
      },
      update: { isActive: true },
      create: {
        productId: product.id,
        variantName: "size",
        variantValue: "regular",
      },
    });

    for (const branch of [mainBranch, secondBranch]) {
      await prisma.branchProductPrice.upsert({
        where: {
          branchId_productId: {
            branchId: branch.id,
            productId: product.id,
          },
        },
        update: {
          sellingPrice: item.price,
          isActive: true,
          updatedByUserId: cashier.id,
        },
        create: {
          branchId: branch.id,
          productId: product.id,
          sellingPrice: item.price,
          updatedByUserId: cashier.id,
        },
      });
    }

    await prisma.inventoryBalance.upsert({
      where: {
        branchId_productId: {
          branchId: mainBranch.id,
          productId: product.id,
        },
      },
      update: {
        minimumStockThreshold: item.threshold,
      },
      create: {
        branchId: mainBranch.id,
        productId: product.id,
        quantityOnHand: item.mainStock,
        minimumStockThreshold: item.threshold,
      },
    });

    await prisma.inventoryBalance.upsert({
      where: {
        branchId_productId: {
          branchId: secondBranch.id,
          productId: product.id,
        },
      },
      update: {
        minimumStockThreshold: item.threshold,
      },
      create: {
        branchId: secondBranch.id,
        productId: product.id,
        quantityOnHand: item.secondStock,
        minimumStockThreshold: item.threshold,
      },
    });

    for (const branch of [mainBranch, secondBranch]) {
      const sourceId = `initial-demo-stock-${branch.code}-${item.sku}`;
      const seedStockMovement = await prisma.stockMovement.findFirst({
        where: {
          sourceType: "seed",
          sourceId,
          branchId: branch.id,
          productId: product.id,
        },
      });
      if (!seedStockMovement) {
        const stock =
          branch.id === mainBranch.id ? item.mainStock : item.secondStock;
        await prisma.stockMovement.create({
          data: {
            branchId: branch.id,
            productId: product.id,
            sourceType: "seed",
            sourceId,
            movementType: "STOCK_IN",
            quantityDelta: stock,
            quantityBefore: 0,
            quantityAfter: stock,
            reasonCode: "initial_seed",
            performedByUserId: cashier.id,
            syncStatus: "seeded",
          },
        });
      }
    }
  }

  await prisma.salesChannel.upsert({
    where: { code: "pos_offline" },
    update: { name: "POS Offline", type: "pos", isActive: true },
    create: {
      code: "pos_offline",
      name: "POS Offline",
      type: "pos",
    },
  });

  await prisma.shift.upsert({
    where: { id: "shift-demo-open" },
    update: {
      branchId: mainBranch.id,
      registerId: register.id,
      openedByUserId: cashier.id,
      status: "OPEN",
    },
    create: {
      id: "shift-demo-open",
      branchId: mainBranch.id,
      registerId: register.id,
      openedByUserId: cashier.id,
      openingCashAmount: 200000,
      status: "OPEN",
    },
  });

  await prisma.salesTransaction.upsert({
    where: { transactionNo: "DEMO-RC-0001" },
    update: {
      branchId: mainBranch.id,
      registerId: register.id,
      cashierUserId: cashier.id,
      subtotalAmount: 39000,
      totalAmount: 39000,
      paymentStatus: "PAID",
      transactionStatus: "COMPLETED",
      sourceMode: "OFFLINE_REPLAY",
      syncedAt: new Date(),
    },
    create: {
      id: "txn-demo-rc-0001",
      transactionNo: "DEMO-RC-0001",
      branchId: mainBranch.id,
      registerId: register.id,
      shiftId: "shift-demo-open",
      cashierUserId: cashier.id,
      transactionDatetime: new Date(Date.now() - 1000 * 60 * 60 * 4),
      subtotalAmount: 39000,
      totalAmount: 39000,
      paymentStatus: "PAID",
      transactionStatus: "COMPLETED",
      sourceMode: "OFFLINE_REPLAY",
      localReferenceId: "local-demo-rc-0001",
      syncedAt: new Date(),
      items: {
        create: [
          {
            id: "txn-demo-rc-0001-item-1",
            productId: products[0].product.id,
            productNameSnapshot: products[0].name,
            skuSnapshot: products[0].sku,
            unitPrice: products[0].price,
            quantity: 1,
            lineTotal: products[0].price,
          },
          {
            id: "txn-demo-rc-0001-item-2",
            productId: products[1].product.id,
            productNameSnapshot: products[1].name,
            skuSnapshot: products[1].sku,
            unitPrice: products[1].price,
            quantity: 2,
            lineTotal: products[1].price * 2,
          },
        ],
      },
      payments: {
        create: {
          id: "txn-demo-rc-0001-payment-1",
          paymentMethodCode: "cash",
          amount: 39000,
          paymentStatus: "PAID",
          paidAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
        },
      },
    },
  });

  await prisma.aiInsight.upsert({
    where: { id: "ai-demo-low-stock-001" },
    update: {
      branchId: mainBranch.id,
      productId: products[1].product.id,
      title: "Iced Tea Bottle is below threshold",
      summary:
        "Demo Branch has 2 units on hand against a threshold of 5. Review replenishment before the next sales peak.",
      severity: "warning",
      confidenceScore: 0.82,
      referenceData: {
        quantity_on_hand: 2,
        minimum_stock_threshold: 5,
        advisory_only: true,
      },
      generatedAt: new Date(),
    },
    create: {
      id: "ai-demo-low-stock-001",
      branchId: mainBranch.id,
      productId: products[1].product.id,
      insightType: "low_stock_alert",
      title: "Iced Tea Bottle is below threshold",
      summary:
        "Demo Branch has 2 units on hand against a threshold of 5. Review replenishment before the next sales peak.",
      severity: "warning",
      confidenceScore: 0.82,
      referenceData: {
        quantity_on_hand: 2,
        minimum_stock_threshold: 5,
        advisory_only: true,
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
