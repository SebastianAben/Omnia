import { expect, test } from "@playwright/test";

test("browser fallback supports demo cashier navigation and warns for local store", async ({
  page,
}) => {
  await page.goto("/login");

  await expect(
    page.getByRole("heading", { name: "Masuk ke register" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Gunakan mode demo" }).click();

  await expect(page).toHaveURL(/\/pos\/?$/);
  await expect(
    page.getByRole("heading", { name: "Transaksi POS" }),
  ).toBeVisible();
  await expect(page.getByText("Demo catalog")).toBeVisible();
  await expect(page.getByText("Shift closed")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Pending" })).toHaveCount(0);

  const layout = await page.evaluate(() => {
    const sidebar = document.querySelector("aside");
    const main = document.querySelector("main");

    return {
      bodyScrollHeight: document.body.scrollHeight,
      mainCanScroll: main ? main.scrollHeight >= main.clientHeight : false,
      mainClientHeight: main?.clientHeight ?? 0,
      sidebarClientHeight: sidebar?.clientHeight ?? 0,
      viewportHeight: window.innerHeight,
    };
  });

  expect(layout.bodyScrollHeight).toBeLessThanOrEqual(
    layout.viewportHeight + 1,
  );
  expect(layout.sidebarClientHeight).toBe(layout.viewportHeight);
  expect(layout.mainCanScroll).toBe(true);
  expect(layout.mainClientHeight).toBeGreaterThan(0);

  await page.getByRole("link", { name: "Shift" }).click();

  await expect(page.getByRole("heading", { name: "Shift" })).toBeVisible();
  await expect(
    page.getByText("Local SQLite store belum tersedia di browser biasa."),
  ).toBeVisible();
});
