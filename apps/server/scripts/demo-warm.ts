// `pnpm demo:warm` — pre-record the live SSE stream for the bleeding
// demo wallet's top 5 positions so the finale can replay them without
// hitting external services. Real chain reads happen ONLY here, at
// warm time, with the configured 0G + ENS keys. Outputs:
//
//   apps/server/cache/demo-runs/<tokenId>.jsonl   ← per-position event stream
//   apps/server/cache/fixtures.json               ← summary metadata
//
// Run with:
//   pnpm demo:warm                                        # all defaults
//   DEMO_BLEEDING=0x... DEMO_LIMIT=5 pnpm demo:warm
//
// The script hits the local server on http://localhost:3001 — start
// it first with `pnpm dev:server`. SSE events are parsed line by line
// and written to JSONL with relative timing so replay matches cadence.

import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

const SERVER = process.env.DEMO_SERVER ?? "http://localhost:3001";
const BLEEDING = (
  process.env.DEMO_BLEEDING ?? "0x8f4daa33706d70677fd69e4e0d47e595bc820e95"
).toLowerCase();
const LIMIT = Number(process.env.DEMO_LIMIT ?? "5");

const cacheRoot = path.resolve(process.cwd(), "cache");
const recordingsDir = path.join(cacheRoot, "demo-runs");
const fixturesPath = path.join(cacheRoot, "fixtures.json");

for (const d of [cacheRoot, recordingsDir]) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

interface PositionRow {
  tokenId: string;
  liquidity: string;
  pair: string;
  feeTier: string;
}

interface FixtureSummary {
  generatedAt: string;
  bleedingWallet: string;
  primaryTokenId: string;
  backupTokenIds: string[];
  primaryRootHash?: string;
  primaryStorageUrl?: string;
  primaryAnchorTx?: string;
  primaryAnchorChainId?: number;
  primaryEnsParent?: string;
  primaryEnsRecords?: Record<string, string>;
}

async function fetchTopPositions(addr: string): Promise<PositionRow[]> {
  const url = `${SERVER}/api/positions/${addr}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`positions endpoint returned ${resp.status} for ${addr}`);
  }
  const json = (await resp.json()) as {
    positions: Array<{
      id: string;
      liquidity: string;
      pool: {
        feeTier: string;
        token0: { symbol: string };
        token1: { symbol: string };
      };
    }>;
  };
  // Sort by liquidity desc — proxy for "biggest at risk" without needing
  // a price oracle. The bleeding wallet has 10 USDC/WETH positions all
  // out of range, the top-N by liquidity gives stable demo material.
  const rows = json.positions
    .map((p) => ({
      tokenId: p.id,
      liquidity: p.liquidity,
      pair: `${p.pool.token0.symbol}/${p.pool.token1.symbol}`,
      feeTier: p.pool.feeTier,
    }))
    .sort((a, b) => {
      const al = BigInt(a.liquidity);
      const bl = BigInt(b.liquidity);
      return bl > al ? 1 : bl < al ? -1 : 0;
    });
  return rows.slice(0, LIMIT);
}

interface CapturedEvent {
  t_ms_relative: number;
  payload: unknown;
}

async function captureSse(tokenId: string): Promise<CapturedEvent[]> {
  const url = `${SERVER}/api/diagnose/${tokenId}`;
  const resp = await fetch(url, { headers: { Accept: "text/event-stream" } });
  if (!resp.ok || !resp.body) {
    throw new Error(`diagnose stream returned ${resp.status} for ${tokenId}`);
  }
  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  const events: CapturedEvent[] = [];
  let firstAt: number | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n\n")) >= 0) {
      const block = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      const dataLines = block
        .split(/\n/)
        .filter((l) => l.startsWith("data: "))
        .map((l) => l.slice(6));
      if (dataLines.length === 0) continue;
      const json = dataLines.join("\n");
      try {
        const payload = JSON.parse(json);
        if (firstAt === null) firstAt = Date.now();
        events.push({
          t_ms_relative: Date.now() - firstAt,
          payload,
        });
        // Print a compact progress dot so the operator sees the script alive.
        const ev = payload as { type?: string; phase?: number };
        process.stdout.write(
          ev.type === "phase.start"
            ? `·${ev.phase ?? "?"}`
            : ev.type === "phase.end"
              ? "·"
              : ev.type === "report.uploaded"
                ? "↑"
                : ev.type === "report.anchored"
                  ? "⚓"
                  : ev.type === "verdict.final"
                    ? "✎"
                    : "",
        );
      } catch {
        // skip malformed
      }
    }
  }
  process.stdout.write("\n");
  return events;
}

function writeJsonl(tokenId: string, events: CapturedEvent[]): string {
  const file = path.join(recordingsDir, `${tokenId}.jsonl`);
  if (existsSync(file)) unlinkSync(file);
  const buf = events.map((e) => JSON.stringify(e)).join("\n");
  writeFileSync(file, buf + "\n", "utf8");
  return file;
}

function summarizeFixture(
  tokenId: string,
  events: CapturedEvent[],
): Partial<FixtureSummary> {
  const out: Partial<FixtureSummary> = {};
  for (const e of events) {
    const ev = e.payload as { type?: string } & Record<string, unknown>;
    if (ev.type === "report.uploaded") {
      out.primaryRootHash = ev.rootHash as string | undefined;
      out.primaryStorageUrl = ev.storageUrl as string | undefined;
    } else if (ev.type === "report.anchored") {
      out.primaryAnchorTx = ev.txHash as string | undefined;
      out.primaryAnchorChainId = ev.chainId as number | undefined;
    } else if (ev.type === "ens.published") {
      const records = ev.records as Record<string, string> | undefined;
      out.primaryEnsRecords = records;
      out.primaryEnsParent = ev.parentName as string | undefined;
    }
  }
  void tokenId;
  return out;
}

async function main(): Promise<void> {
  console.log(`[demo:warm] target server: ${SERVER}`);
  console.log(`[demo:warm] bleeding wallet: ${BLEEDING}`);
  console.log(`[demo:warm] capturing top ${LIMIT} tokenIds…`);

  const positions = await fetchTopPositions(BLEEDING);
  if (positions.length === 0) {
    console.error(
      `[demo:warm] no positions found for ${BLEEDING} — did the subgraph respond?`,
    );
    process.exit(1);
  }
  console.log(`[demo:warm] found ${positions.length} positions`);
  for (const p of positions) {
    console.log(
      `  · ${p.tokenId}  ${p.pair}  fee=${p.feeTier}  liq=${p.liquidity}`,
    );
  }

  const fixture: FixtureSummary = {
    generatedAt: new Date().toISOString(),
    bleedingWallet: BLEEDING,
    primaryTokenId: positions[0]!.tokenId,
    backupTokenIds: positions.slice(1).map((p) => p.tokenId),
  };

  for (let i = 0; i < positions.length; i++) {
    const p = positions[i]!;
    console.log(
      `[demo:warm] [${i + 1}/${positions.length}] capturing tokenId=${p.tokenId} (${p.pair})`,
    );
    try {
      const events = await captureSse(p.tokenId);
      const file = writeJsonl(p.tokenId, events);
      const meta = summarizeFixture(p.tokenId, events);
      console.log(
        `  ✓ ${events.length} events → ${path.relative(process.cwd(), file)}`,
      );
      if (meta.primaryRootHash) {
        console.log(`    rootHash:   ${meta.primaryRootHash}`);
      }
      if (meta.primaryAnchorTx) {
        console.log(`    anchor tx:  ${meta.primaryAnchorTx}`);
      }
      if (i === 0) {
        Object.assign(fixture, meta);
      }
    } catch (err) {
      console.error(
        `  ✗ ${p.tokenId} failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  writeFileSync(fixturesPath, JSON.stringify(fixture, null, 2), "utf8");
  console.log(
    `\n[demo:warm] READY · ${positions.length} recordings · fixtures.json written\n` +
      `  primaryTokenId: ${fixture.primaryTokenId}\n` +
      `  rootHash:       ${fixture.primaryRootHash ?? "(none)"}\n` +
      `  anchor tx:      ${fixture.primaryAnchorTx ?? "(none)"}\n` +
      `  ENS parent:     ${fixture.primaryEnsParent ?? "(none)"}\n` +
      `\n  Test the replay path:\n` +
      `    curl -N "${SERVER}/api/diagnose/${fixture.primaryTokenId}?demo=1"\n`,
  );
}

main().catch((err) => {
  console.error(`[demo:warm] fatal: ${err instanceof Error ? err.stack : err}`);
  process.exit(1);
});
