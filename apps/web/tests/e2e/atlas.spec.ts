import { expect, test } from "@playwright/test";

test.describe("atlas page", () => {
  test("renders the LPLens header and the wallet form", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "LPLens" })).toBeVisible();
    await expect(
      page.getByPlaceholder(/wallet address/i),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /load/i })).toBeVisible();
  });

  test("shows an instruction line when no address is submitted", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByText(/paste a wallet address above/i),
    ).toBeVisible();
  });
});
