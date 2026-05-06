#!/usr/bin/env node
// Open the finale kiosk in a headed Chromium window so the operator
// can see + interact with the demo. Closes only when the user closes
// the browser window. Use:
//   node apps/web/scripts/finale-open.mjs
// Optional env:
//   WEB_URL=http://localhost:3100  (default)
//   ROUTE=/finale?presenter=true&demo=1  (default)
//   WIDTH=1440 HEIGHT=900

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");
const playwrightEntry = path.join(
  repoRoot,
  "node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.js",
);
const require = createRequire(import.meta.url);
const { chromium } = require(playwrightEntry);

const baseUrl = process.env.WEB_URL ?? "http://localhost:3100";
const route = process.env.ROUTE ?? "/finale?presenter=true&demo=1";
const width = Number(process.env.WIDTH ?? 1440);
const height = Number(process.env.HEIGHT ?? 900);

const url = baseUrl + route;
console.log(`[finale-open] launching headed chromium → ${url}`);
console.log(`[finale-open] keyboard: space (next) · ← → (prev/next) · f (fullscreen) · r (reset chrono) · p (pause)`);
console.log(`[finale-open] close the browser window to exit this script`);

const browser = await chromium.launch({
  headless: false,
  args: ["--start-maximized"],
});
const ctx = await browser.newContext({
  viewport: null, // use the OS window size, not a fixed viewport
});
const page = await ctx.newPage();
await page.setViewportSize({ width, height }).catch(() => {});
page.on("pageerror", (err) => console.warn(`[pageerror] ${err.message}`));
page.on("console", (msg) => {
  const level = msg.type();
  if (level === "error" || level === "warning") {
    console.warn(`[console:${level}] ${msg.text()}`);
  }
});

await page.goto(url, { waitUntil: "domcontentloaded" });

// Hold the script open until the browser is closed.
await new Promise((resolve) => {
  browser.on("disconnected", resolve);
});
console.log("[finale-open] browser closed. exiting.");
