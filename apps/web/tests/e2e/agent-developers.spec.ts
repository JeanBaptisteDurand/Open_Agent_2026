import { expect, test } from "@playwright/test";

// Smoke test for the two pages added to align the front-end with the
// pitch deck — /agent (live iNFT profile) and /developers (MCP server
// reference). The agent page reads the iNFT on chain via viem; if the
// build wasn't given VITE_LPLENS_AGENT_CONTRACT, the page surfaces a
// soft error banner — both branches are valid renders for the smoke
// test, which only asserts the heading + identity-area content shape.

test.describe("agent profile page", () => {
  test("renders heading and on-chain verification block", async ({ page }) => {
    await page.goto("/agent");
    await expect(
      page.getByRole("heading", { name: /LPLens\/01/i }),
    ).toBeVisible();
    await expect(page.getByText(/Verify the live state yourself/i)).toBeVisible();
    // The pre-formatted block with cast snippet — multiple "cast call"
    // strings exist (inline code + pre), assert at least the pre.
    await expect(
      page.getByText(/agents\(uint256\)/i).first(),
    ).toBeVisible();
  });
});

test.describe("developers page", () => {
  test("renders heading and the 6 MCP tools table", async ({ page }) => {
    await page.goto("/developers");
    await expect(
      page.getByRole("heading", { name: /Call LPLens from any agent/i }),
    ).toBeVisible();

    // Six tools in the endpoints table.
    await expect(page.getByText(/lplens\.diagnose/i).first()).toBeVisible();
    await expect(page.getByText(/lplens\.preflight/i).first()).toBeVisible();
    await expect(page.getByText(/lplens\.migrate/i).first()).toBeVisible();
    await expect(page.getByText(/lplens\.lookupReport/i).first()).toBeVisible();
    await expect(
      page.getByText(/lplens\.lookupReportOnChain/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/lplens\.resolveEnsRecord/i).first(),
    ).toBeVisible();

    // 3 GATED access tags. FREE appears 6 times (3 access tags + 3
    // price cells render "FREE"); exact match to avoid DOM tree bubbling.
    await expect(page.getByText("GATED", { exact: true })).toHaveCount(3);
    await expect(page.getByText("FREE", { exact: true })).toHaveCount(6);
  });
});
