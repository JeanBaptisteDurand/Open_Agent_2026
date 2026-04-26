import { expect, test } from "@playwright/test";

test.describe("diagnose page", () => {
  test("renders the Diagnose header for a given tokenId", async ({ page }) => {
    await page.goto("/diagnose/12345");
    await expect(page.getByRole("heading", { name: "Diagnose" })).toBeVisible();
    // The tokenId echo should be present, regardless of stream success.
    await expect(page.locator("body")).toContainText("12345");
  });

  test("renders the diagnostic graph container", async ({ page }) => {
    await page.goto("/diagnose/12345");
    // ReactFlow renders a viewport; we just check the container exists.
    await expect(page.locator(".react-flow")).toBeVisible({ timeout: 10_000 });
  });
});
