# LPLens

AI-powered risk intelligence & autonomous migration agent for Uniswap V3/V4 liquidity providers.

LPLens is a full-stack platform that reads any Uniswap LP position, reconstructs **why** it is losing money in real time, simulates V4 hook alternatives against the real pool history, and lets the user migrate their position in one Permit2 signature.

Every verdict is signed by a TEE on 0G Compute, stored on 0G Storage, and anchored on 0G Chain — giving LPs an audit-grade report they can share or use in disputes.

Built for [ETHGlobal Open Agents](https://ethglobal.com/events/openagents) — Apr 24 → May 6 2026.

---

## What the platform does

| Feature | Description |
| --- | --- |
| Position Atlas | Connect wallet → list every V3/V4 LP position with a green/amber/red health indicator (percent in-range + IL direction) |
| LP Diagnostic Agent | Multi-phase AI agent that streams 9 phases of analysis over SSE : position resolution, pool RAG, IL decomposition, regime classification, hook discovery, hook replay, migration plan, verdict, signed report |
| Hook Replay Simulation | Re-plays the 10 000 last swaps of a pool **through each candidate V4 hook** and returns simulated APR + IL for our config. Not actual on-chain exec — emulation per hook family (dynamic-fee / JIT-protected / LVR-resistant / etc.) with explicit warnings |
| One-click Permit2 Migration | Generates an atomic `close V3 → swap → mint V4` bundle signable in a single Permit2 signature |
| Signed Report | Report JSON pinned to 0G Storage (merkle rootHash), signed by TEE oracle, anchored on 0G Chain registry — verifiable offline with the CLI |
| iNFT Agent Identity | LPLens agent is minted as an ERC-7857-style iNFT on 0G Chain with persistent memory DAG + reputation counter |
| MCP Server | Exposes `lplens.diagnose`, `lplens.preflight`, `lplens.migrate`, `lplens.verify` — callable by other autonomous agents, paywalled via x402 USDC |

---

## The core insight

Uniswap LPs lose money half the time and have no diagnostic. Topaz Blue / Bancor research shows **49.5 % of V3 LPs end up net-negative vs simply holding** after fees. The median ETH/USDC 0.3 % LP is down 1.6 % per 30 days after fees net.

The reason is not that LPing is unprofitable — it is that explaining **why** a given position bled requires correlating 4-5 data sources (pool state, swap history, volatility regime, MEV exposure, hook behavior if V4) and very few tools even try. Revert Finance shows raw numbers. Uniswap Info shows pool stats. Etherscan shows tx logs. No tool tells you : *"your range exited on April 17, the pool is now dominated by JIT liquidity, three V4 hooks would have earned you $1 440 more over the same period — click here to migrate."*

LPLens does exactly that.

---

## Architecture overview

```
                    Browser (React + React Flow)
                              │ (SSE, REST)
                              ▼
                     Express gateway + BullMQ
                              │
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
   Uniswap Subgraph     0G Compute TEE    Ethereum RPC
   (v3 + v4 schemas)    (inference)       (viem contract reads)
                              │
                              ▼
                       0G Storage + 0G Chain
                       (report rootHash + anchor)
```

**High-level flow**

1. User connects wallet → frontend fetches positions list from the v3/v4 subgraphs. V4 positions are merged from the thin `Position` entity + `ModifyLiquidity` events + on-chain reads on the V4 `PositionManager` contract.
2. User clicks a position. The frontend opens a typed SSE stream to `/api/diagnose/:tokenId`. Express enqueues a BullMQ job.
3. A worker runs the **9-phase agent** :
   - Phase 1 — position resolution (VERIFIED data from chain)
   - Phase 1.5 — pool RAG lookup (pgvector over historical regime notes)
   - Phase 2 — AI planning via 0G Compute TEE (`gpt-oss-120b` on mainnet, `qwen-2.5-7b-instruct` on testnet)
   - Phase 3 — IL reconstruction (COMPUTED from whitepaper eq. 6.29/6.30 via `@uniswap/v3-sdk` SqrtPriceMath)
   - Phase 4 — regime classification (ESTIMATED — mean-reverting / trending / high-toxic / JIT-dominated, with confidence scores)
   - Phase 5 — V4 hook discovery (VERIFIED addresses + LABELED families via our curated registry)
   - Phase 6 — hook replay simulation (EMULATED — replays 10 k historical swaps through a hypothetical hook using `SwapMath.computeSwapStep`)
   - Phase 7 — migration plan (builds the Permit2 bundle calldata via Uniswap Trading API)
   - Phase 8 — verdict writer (GENERATED — LLM writes markdown narrative, offline hallucination validator checks every number traces to input JSON)
   - Phase 9 — report assembly + TEE sign + upload to 0G Storage + anchor on 0G Chain
4. Each phase emits typed `DiagnosticEvent`s over SSE — the React Flow graph builds itself live (Position node → Pool History nodes → Hook candidates → Migration path), narrative text streams in a typewriter.
5. User clicks "Migrate" → modal shows the 3-step Permit2 bundle → single signature → tx on mainnet / Sepolia testnet.

---

## Tech stack

**Core :** TypeScript, Node 20, pnpm workspaces.

**Frontend :** React 18, Vite, TailwindCSS, Radix UI, React Flow, React Router, @tanstack/react-query, wagmi + viem, lucide-react.

**Backend :** Express, Prisma (PostgreSQL + pgvector), BullMQ (Redis), Zod, Winston.

**AI layer :** LangChain (orchestration), OpenAI (embeddings), 0G Compute broker (TEE inference for agent verdicts — replaces OpenAI chat to give audit-grade attestations).

**Web3 :** viem, Foundry (contracts), `@uniswap/v3-sdk`, `@uniswap/v4-sdk`, Uniswap Trading API, Permit2.

**0G stack :** `@0glabs/0g-serving-broker` (Compute network), `@0gfoundation/0g-ts-sdk` (Storage). 0G Newton testnet chain-id 16602, 0G Galileo mainnet chain-id 16661.

**MCP :** `@modelcontextprotocol/sdk` — standalone server exposing 4 tools.

**Infra :** Docker Compose (postgres + redis), Makefile shortcuts, Playwright for E2E.

---

## The honesty layer

Every numeric value in a LPLens report is **labeled** — we never present an estimate or emulation as a fact :

| Label | Meaning | Example |
| --- | --- | --- |
| 🟢 **VERIFIED** | Read directly on-chain or from canonical subgraph | `liquidity = 83 472 839 …` |
| 🔵 **COMPUTED** | Derived mathematically from VERIFIED data via Uniswap formulas | `IL_pure_usd = f(liquidity, tickLower, tickUpper, priceNow)` |
| 🟡 **ESTIMATED** | Heuristic (no ground truth) — displayed with a confidence interval | `toxicity_score = 0.087 ± 0.02` |
| 🟠 **EMULATED** | Result of a simulation of something that did not actually run on-chain | `simulated_apr_in_dynamic_fee_hook = +18.6 %` (with `warnings[]`) |
| 🏷️ **LABELED** | Manual curation by us | `hook_family = "JIT_PROTECTED"` |

Phase 6 (hook replay) is always EMULATED — the report explicitly discloses that the simulation uses family-level emulation of hook behavior and cannot guarantee on-chain execution would match.

---

## Reliability acceptance tests

Six blocking acceptance tests must pass before any signed report is published :

- **AT-1 IL calibration** — our IL reconstruction matches Revert Finance to ±1 % on three golden V3 positions
- **AT-2 no-hook replay drift** — replay 1 000 mainnet swaps without a hook, final `sqrtPriceX96` matches actual on-chain state to < 10 bps
- **AT-4 LLM no-hallucination** — every number in the final verdict markdown traces back to the input JSON (offline validator)
- **AT-5 TEE signature round-trip** — download report from 0G Storage via rootHash, re-hash, verify TEE signature offline
- **AT-8 V4 PositionInfo decode** — TypeScript decoder of the packed `uint256` matches the Solidity library byte-exact
- **AT-9 V4 hook flag decoding** — flag bitmask decoded from hook address matches the masking expected by the PoolManager

Four additional tuning tests cover directionality of hook family emulation, sandwich detection false-positive rate, regime classifier sanity, and end-to-end perf (≤ 60 s).

---

## Tracks applied

- **0G — OpenClaw Agent on 0G** ($6 000) : LPLens is published as an iNFT ERC-7857-style agent, uses 0G Compute TEE for audit-grade verdicts, 0G Storage for the report corpus + cycle DAG, 0G Chain for the signed-report registry.
- **Uniswap Foundation — Best Uniswap API Integration** ($5 000) : Subgraph v3 + v4 (`modifyLiquidities`, positions, ticks, fee growth), Trading API v1 for quotes + swap calldata, Permit2 `PermitSingle/PermitBatch` for the migration bundle, V4 hook flag decoding and replay.

Other partner tech used but not applied for : KeeperHub Builder Feedback bounty — minimal integration noted in `FEEDBACK.md`.

---

## Local setup

```bash
git clone git@github.com:JeanBaptisteDurand/Open_Agent_2026.git lplens
cd lplens
pnpm install
cp .env.example .env   # fill DATABASE_URL, THE_GRAPH_KEY, UNISWAP_TRADING_API_KEY, OG_NEWTON_RPC, …
docker compose up -d
pnpm db:migrate
pnpm dev
```

Frontend at `http://localhost:3100`, backend at `http://localhost:3001`, MCP server runs standalone.

---

## Demo positions

Three curated sample positions (committed as mock data) let a judge test without providing their own wallet :

- **Green** — USDC/WETH 0.05 % in-range, +$340 over 19 days
- **Amber** — WBTC/WETH 0.3 % drifting close to upper bound
- **Red** — PEPE/WETH 1 % heavy IL, 52 % time in-range, recommended migration to `JITGuard`

Each sample runs the full 9-phase pipeline with realistic payloads and a signed report on the 0G Newton testnet.

---

## Roadmap

- **D1-D2** — monorepo scaffold, subgraph ingestion, position atlas
- **D3-D4** — IL math, regime classification, hook discovery, 0G Compute broker wiring, diagnose page skeleton
- **D5-D6** — hook replay engine, ReactFlow diagnostic graph, MVP end-to-end
- **D7** — Permit2 migration bundle, 0G Storage reports
- **D8** — ERC-7857 contracts on 0G Newton, reliability acceptance tests, `FEEDBACK.md`
- **D9** — MCP server, x402 paywall, landing polish, demo video recording
- **D10** — submission

---

## Team

**42 Blockchain** — Jean-Baptiste Durand.

Past hackathon projects with the same "Lens" architecture (RAG-over-chain-data agent with SSE streaming + MCP) :

- **BaseLens** — Base L2 smart contract analyzer
- **CORLens** — XRPL cross-border corridor risk intelligence
- **SuiLens** — Sui Move package dependency analyzer
- **Devinci-Sui** — Sui devnet analytics agent
- **Panoramix** — EVM bytecode decompiler

---

## License

MIT (TBD — will be finalized at submission).
