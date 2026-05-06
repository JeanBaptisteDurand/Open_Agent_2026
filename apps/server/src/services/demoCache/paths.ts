// Filesystem paths + a small JSON fixture loader. The cache root sits
// at apps/server/cache/ relative to the running server process. We
// rely on cwd = apps/server during dev (pnpm dev:server uses tsx watch)
// and the `cache` dir is committed (with .gitkeep) so the demo:warm
// outputs land in a predictable place.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "cache");

export const cacheRoot = root;
export const recordingsDir = path.join(root, "demo-runs");
export const subgraphCacheDir = path.join(root, "subgraph");
export const fixturesPath = path.join(root, "fixtures.json");

for (const d of [root, recordingsDir, subgraphCacheDir]) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

export interface DemoFixture {
  generatedAt: string;
  bleedingWallet: string;
  primaryTokenId: string;
  backupTokenIds: string[];
  primaryRootHash?: string;
  primaryStorageUrl?: string;
  primaryAnchorTx?: string;
  primaryAnchorChainId?: number;
  primaryEnsRecords?: Record<string, string>;
}

export function readFixture(): DemoFixture | null {
  if (!existsSync(fixturesPath)) return null;
  try {
    const raw = readFileSync(fixturesPath, "utf8");
    return JSON.parse(raw) as DemoFixture;
  } catch {
    return null;
  }
}

export function writeFixture(f: DemoFixture): void {
  writeFileSync(fixturesPath, JSON.stringify(f, null, 2), "utf8");
}
