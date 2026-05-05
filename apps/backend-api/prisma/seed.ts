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

  const product = await prisma.product.upsert({
    where: { sku: "SKU-DEMO-001" },
    update: {
      categoryId: category.id,
      barcode: "899000000001",
      name: "Demo Product",
      unit: "pcs",
      isActive: true,
    },
    create: {
      categoryId: category.id,
      sku: "SKU-DEMO-001",
      barcode: "899000000001",
      name: "Demo Product",
      unit: "pcs",
    },
  });

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

  await prisma.branchProductPrice.upsert({
    where: {
      branchId_productId: {
        branchId: mainBranch.id,
        productId: product.id,
      },
    },
    update: {
      sellingPrice: 15000,
      isActive: true,
      updatedByUserId: cashier.id,
    },
    create: {
      branchId: mainBranch.id,
      productId: product.id,
      sellingPrice: 15000,
      updatedByUserId: cashier.id,
    },
  });

  await prisma.inventoryBalance.upsert({
    where: {
      branchId_productId: {
        branchId: mainBranch.id,
        productId: product.id,
      },
    },
    update: {
      quantityOnHand: 10,
      minimumStockThreshold: 3,
    },
    create: {
      branchId: mainBranch.id,
      productId: product.id,
      quantityOnHand: 10,
      minimumStockThreshold: 3,
    },
  });

  const seedStockMovement = await prisma.stockMovement.findFirst({
    where: {
      sourceType: "seed",
      sourceId: "initial-demo-stock",
      branchId: mainBranch.id,
      productId: product.id,
    },
  });
  if (!seedStockMovement) {
    await prisma.stockMovement.create({
      data: {
        branchId: mainBranch.id,
        productId: product.id,
        sourceType: "seed",
        sourceId: "initial-demo-stock",
        movementType: "STOCK_IN",
        quantityDelta: 10,
        quantityBefore: 0,
        quantityAfter: 10,
        reasonCode: "initial_seed",
        performedByUserId: cashier.id,
        syncStatus: "seeded",
      },
    });
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

  const shopeeChannel = await prisma.salesChannel.upsert({
    where: { code: "shopee" },
    update: { name: "Shopee", type: "marketplace", isActive: true },
    create: {
      code: "shopee",
      name: "Shopee",
      type: "marketplace",
    },
  });

  const shopeeStore = await prisma.channelStore.upsert({
    where: {
      salesChannelId_externalStoreId: {
        salesChannelId: shopeeChannel.id,
        externalStoreId: "SHP-DEMO-STORE",
      },
    },
    update: {
      storeName: "Demo Shopee Store",
      authStatus: "connected",
      isActive: true,
      connectedAt: new Date(),
    },
    create: {
      salesChannelId: shopeeChannel.id,
      storeName: "Demo Shopee Store",
      externalStoreId: "SHP-DEMO-STORE",
      authStatus: "connected",
      connectedAt: new Date(),
    },
  });

  await prisma.productChannelMapping.upsert({
    where: {
      channelStoreId_externalSku: {
        channelStoreId: shopeeStore.id,
        externalSku: "SHP-SKU-DEMO-001",
      },
    },
    update: {
      productId: product.id,
      externalProductId: "SHP-PROD-DEMO-001",
      mappingStatus: "mapped",
    },
    create: {
      channelStoreId: shopeeStore.id,
      productId: product.id,
      externalProductId: "SHP-PROD-DEMO-001",
      externalSku: "SHP-SKU-DEMO-001",
      mappingStatus: "mapped",
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
