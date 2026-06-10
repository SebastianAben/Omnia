import { _electron as electron, expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

test("Electron runtime exposes local store for shift open and close", async () => {
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "omnia-e2e-"));
  const app = await electron.launch({
    args: [path.join(process.cwd(), "apps/desktop-app")],
    env: {
      ...process.env,
      NODE_ENV: "development",
      OMNIA_DESKTOP_URL:
        process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3010",
      OMNIA_USER_DATA_DIR: userDataDir,
    },
  });

  try {
    const page = await app.firstWindow();
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3010";
    await page.goto(`${baseURL}/login`);

    await expect(
      page.getByRole("heading", { name: "Masuk ke register" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Gunakan mode demo" }).click();
    await expect(
      page.getByRole("heading", { name: "Transaksi POS" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Shift" }).click();
    await expect(page.getByRole("heading", { name: "Shift" })).toBeVisible();
    await expect(
      page.getByText("Local SQLite store belum tersedia"),
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Open Shift" }).click();
    await expect(page.getByText("Current shift is open")).toBeVisible();
    await expect(page.getByText("Reconciliation preview")).toBeVisible();

    await page.getByRole("link", { name: "POS" }).click();
    await expect(
      page.getByRole("heading", { name: "Transaksi POS" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Pending" })).toHaveCount(0);

    await page
      .locator("article")
      .filter({ hasText: "Coffee Beans 250g" })
      .getByRole("button", { name: "Tambah" })
      .click();
    await page.getByLabel("Uang diterima").fill("100000");
    await page.getByRole("button", { name: "Simpan transaksi" }).click();
    await expect(page.getByText(/saved locally/)).toBeVisible();

    await page.getByRole("link", { name: "Shift" }).click();
    await page.getByRole("button", { name: "Close Shift" }).click();
    await expect(page.getByText("Current shift is closed")).toBeVisible();
  } finally {
    await app.close();
    await fs.rm(userDataDir, { force: true, recursive: true });
  }
});
