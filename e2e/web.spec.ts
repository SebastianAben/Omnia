import { expect, type Page, test } from "@playwright/test";

const users = {
  "demo.cashier": {
    id: "usr_demo_cashier",
    full_name: "Demo Cashier",
    username: "demo.cashier",
    role_code: "cashier",
    branch_id: "br_demo",
  },
  "demo.supervisor": {
    id: "usr_demo_supervisor",
    full_name: "Demo Supervisor",
    username: "demo.supervisor",
    role_code: "supervisor",
    branch_id: "br_demo",
  },
  "demo.admin": {
    id: "usr_demo_admin",
    full_name: "Demo HQ Admin",
    username: "demo.admin",
    role_code: "hq_admin",
  },
  "demo.analyst": {
    id: "usr_demo_analyst",
    full_name: "Demo Analyst",
    username: "demo.analyst",
    role_code: "executive",
  },
} as const;

type DemoUsername = keyof typeof users;
type ApiCall = { authorization?: string; method: string; path: string };

function ok(data: unknown) {
  return {
    data,
    success: true,
  };
}

async function mockBackend(page: Page, calls: ApiCall[]) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = `${url.pathname.replace("/api/v1", "")}${url.search}`;
    const authorization = request.headers().authorization;
    calls.push({ authorization, method: request.method(), path });

    if (request.method() === "POST" && url.pathname.endsWith("/auth/login")) {
      const body = (await request.postDataJSON()) as {
        username: DemoUsername;
      };
      const user = users[body.username];

      await route.fulfill({
        contentType: "application/json",
        json: ok({
          token: `token:${user.role_code}`,
          refresh_token: `refresh:${user.role_code}`,
          user,
          permissions: [],
          branches: user.branch_id
            ? [{ id: "br_demo", code: "BR-DEMO", name: "Branch A" }]
            : [],
        }),
      });
      return;
    }

    if (request.method() === "POST" && url.pathname.endsWith("/auth/logout")) {
      await route.fulfill({
        contentType: "application/json",
        json: ok({ revoked: true }),
      });
      return;
    }

    if (request.method() === "GET" && url.pathname.endsWith("/registers")) {
      await route.fulfill({
        contentType: "application/json",
        json: ok([
          {
            id: "reg_demo_01",
            branch_id: "br_demo",
            name: "Register 01",
            device_identifier: "omnia-desktop-register-01",
          },
        ]),
      });
      return;
    }

    if (request.method() === "GET" && url.pathname.endsWith("/products")) {
      await route.fulfill({
        contentType: "application/json",
        json: ok([
          {
            id: "prd_demo_001",
            sku: "COF-250",
            barcode: null,
            name: "Coffee Beans 250g",
            unit: "pack",
            is_active: true,
            category: { name: "Food & Beverage" },
          },
        ]),
      });
      return;
    }

    if (
      request.method() === "GET" &&
      url.pathname.endsWith("/branches/br_demo/product-prices")
    ) {
      await route.fulfill({
        contentType: "application/json",
        json: ok([{ product_id: "prd_demo_001", selling_price: "65000" }]),
      });
      return;
    }

    if (
      request.method() === "GET" &&
      url.pathname.endsWith("/inventory/balances")
    ) {
      await route.fulfill({
        contentType: "application/json",
        json: ok([
          {
            product_id: "prd_demo_001",
            quantity_on_hand: "24",
            minimum_stock_threshold: "6",
          },
        ]),
      });
      return;
    }

    await route.fulfill({
      contentType: "application/json",
      json: ok([]),
    });
  });
}

test("demo login issues backend token, supports role token switch, and signs out", async ({
  page,
}) => {
  const calls: ApiCall[] = [];
  await mockBackend(page, calls);

  await page.goto("/login");
  await page.getByRole("button", { name: "Gunakan mode demo" }).click();

  await expect(page).toHaveURL(/\/pos\/?$/);
  await expect(
    page.getByRole("heading", { name: "POS Transaction" }),
  ).toBeVisible();
  await expect(page.getByText("API catalog")).toBeVisible();
  await expect
    .poll(() =>
      calls.some((call) => call.authorization === "Bearer token:cashier"),
    )
    .toBe(true);

  await page.getByRole("button", { name: "HQ Admin" }).click();
  await expect(page.getByText("Demo HQ Admin")).toBeVisible();
  await expect
    .poll(() =>
      calls.some((call) => call.authorization === "Bearer token:hq_admin"),
    )
    .toBe(true);

  await expect(page.getByRole("button", { name: "HQ Admin" })).toBeEnabled();
  await page.getByRole("button", { name: "Sign out" }).dispatchEvent("click");
  await expect(page).toHaveURL(/\/login\/?$/);
});

test("password login hides demo role switcher", async ({ page }) => {
  const calls: ApiCall[] = [];
  await mockBackend(page, calls);

  await page.goto("/login");
  await page.getByLabel("Username or email").fill("demo.supervisor");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Masuk ke POS" }).click();

  await expect(page).toHaveURL(/\/pos\/?$/);
  await expect(page.getByText("Demo Supervisor")).toBeVisible();
  await expect(
    page.locator("aside").getByText("Store Supervisor"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Cashier" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "HQ Admin" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
});
