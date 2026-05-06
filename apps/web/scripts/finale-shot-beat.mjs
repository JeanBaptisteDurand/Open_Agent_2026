#!/usr/bin/env node
// Like finale-shot.mjs but scrolls inside the snap-scroll container to
// the requested beat (0-based) before screenshotting. Used to capture
// /finale beat-by-beat for visual review.

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
import { mkdirSync, existsSync } from "node:fs";

const SHOT_DIR = "/Users/beorlor/Documents/open_agent/.finale-screenshots";
if (!existsSync(SHOT_DIR)) mkdirSync(SHOT_DIR, { recursive: true });

const route = process.argv[2] ?? "/finale";
const beat = Number(process.argv[3] ?? 0);
const name = process.argv[4] ?? `beat-${beat}`;
const width = Number(process.argv[5] ?? 1440);
const height = Number(process.argv[6] ?? 900);

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.goto(`http://localhost:3100${route}`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);

// Scroll the inner snap-scroll container directly so the screenshot
// catches the requested beat. The container has data-finale-scroll.
await page.evaluate((b) => {
  const c = document.querySelector("[data-finale-scroll]");
  const sections = c ? c.querySelectorAll("[data-finale-beat]") : [];
  const target = sections[b];
  if (target instanceof HTMLElement) target.scrollIntoView({ behavior: "auto", block: "start" });
}, beat);
await page.waitForTimeout(2500);

const out = path.join(SHOT_DIR, `${name}-latest.png`);
await page.screenshot({ path: out });
console.log(`[finale-beat] ${out}`);
await browser.close();
