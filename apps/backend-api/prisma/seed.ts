import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const cashierRole = await prisma.role.upsert({
    where: { code: "cashier" },
    update: {},
    create: {
      code: "cashier",
      name: "Cashier",
      description: "POS cashier role for branch operations.",
    },
  });

  const branch = await prisma.branch.upsert({
    where: { code: "BR-DEMO" },
    update: {},
    create: {
      code: "BR-DEMO",
      name: "Demo Branch",
      address: "Local demo branch",
    },
  });

  await prisma.user.upsert({
    where: { username: "demo.cashier" },
    update: {},
    create: {
      username: "demo.cashier",
      fullName: "Demo Cashier",
      passwordHash: "replace-with-real-hash-in-sprint-1",
      roleId: cashierRole.id,
      branchId: branch.id,
    },
  });

  const product = await prisma.product.upsert({
    where: { sku: "SKU-DEMO-001" },
    update: {},
    create: {
      sku: "SKU-DEMO-001",
      barcode: "899000000001",
      name: "Demo Product",
      unit: "pcs",
    },
  });

  await prisma.inventoryBalance.upsert({
    where: {
      branchId_productId: {
        branchId: branch.id,
        productId: product.id,
      },
    },
    update: { quantity: 10 },
    create: {
      branchId: branch.id,
      productId: product.id,
      quantity: 10,
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
