#!/usr/bin/env node
// Finale visual screenshot helper. Bypasses the MCP server (which is
// already in use by a parent harness) and uses the locally installed
// playwright. Outputs go to /Users/beorlor/Documents/open_agent/.finale-screenshots/
// with a deterministic file name so the visual judge loop can attach them.
//
// Usage:
//   node apps/web/scripts/finale-shot.mjs <route> <name> [width=1440] [height=900] [delay=2200]
//
// Example:
//   node apps/web/scripts/finale-shot.mjs "/verify/0xabc" verify-cascade

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

// pnpm puts playwright at the workspace root via .pnpm. Resolve it
// explicitly so this script works regardless of cwd.
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const playwrightEntry = path.join(
  repoRoot,
  "node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.js",
);
const require = createRequire(import.meta.url);
const { chromium } = require(playwrightEntry);
import { mkdirSync, existsSync } from "node:fs";

const SHOT_DIR = "/Users/beorlor/Documents/open_agent/.finale-screenshots";
if (!existsSync(SHOT_DIR)) mkdirSync(SHOT_DIR, { recursive: true });

const route = process.argv[2] ?? "/";
const name = process.argv[3] ?? "page";
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 900);
const delay = Number(process.argv[6] ?? 2200);
const fullPage = process.env.FULL_PAGE === "1";
const baseUrl = process.env.WEB_URL ?? "http://localhost:3100";

const url = baseUrl + route;
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const filename = `${name}-${ts}.png`;
const out = path.join(SHOT_DIR, filename);

console.log(`[finale-shot] navigating ${url}  -> ${out}`);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 2, // retina-grade screenshots for visual review
});
const page = await ctx.newPage();
page.on("pageerror", (err) => console.warn(`[pageerror] ${err.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") console.warn(`[console:error] ${msg.text()}`);
});
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(delay);
await page.screenshot({ path: out, fullPage });
console.log(`[finale-shot] wrote ${out}`);

const latest = path.join(SHOT_DIR, `${name}-latest.png`);
await page.screenshot({ path: latest, fullPage });

await browser.close();
console.log(`[finale-shot] also wrote ${latest}`);
