# LPLens

**An autonomous diagnostic agent for Uniswap V3/V4 liquidity providers, running on the full 0G stack.**

LPLens reads any LP position, reconstructs *why* it is losing money against a HODL baseline, scores each candidate V4 hook against the pool's recent history with calibrated family multipliers, drafts a migration plan, and ships an audit-grade signed report — in 30 seconds, with one Permit2 signature when the user decides to migrate.

Every numeric value carries one of five honesty labels (`VERIFIED` · `COMPUTED` · `ESTIMATED` · `EMULATED` · `LABELED`) so a judge can tell at a glance which claims trace back to chain-state and which are heuristics.

The verdict is synthesized by an LLM on **0G Compute** (provider-attested via the broker's request signature), the report blob is pinned to **0G Storage** with a merkle rootHash, and that rootHash is anchored on **0G Chain** through the `LPLensReports` registry. The agent's identity layer publishes per-position text records on **ENS** under a parent name (`lplens.<tokenId>.rootHash`, `lplens.<tokenId>.storageUrl`, `lplens.<tokenId>.anchorTx`, `lplens.<tokenId>.verdict`) so any ENS-aware client can resolve the full provenance triple without trusting the LPLens API. An MCP server exposes `lplens.diagnose`, `lplens.preflight`, `lplens.migrate`, `lplens.lookupReport`, `lplens.lookupReportOnChain`, and `lplens.resolveEnsRecord` to any other agent — `lookupReportOnChain` and `resolveEnsRecord` together form the composability beat: the report's existence is independently verifiable from the on-chain registry AND from ENS, no LPLens server in the trust path.

Built for [ETHGlobal Open Agents](https://ethglobal.com/events/openagents) — Apr 24 → May 6 2026.


---

## What the platform does

| Feature | Description |
| --- | --- |
| Position Atlas | Connect wallet → list every V3/V4 LP position with a green/amber/red health indicator (percent in-range + IL direction) |
| LP Diagnostic Agent | Multi-phase agent that streams 9 phases of analysis over SSE : position resolution, IL decomposition, regime classification, hook discovery, hook scoring, migration plan, report assembly, on-chain anchor, verdict, ENS publish |
| Hook Scoring Engine | Scores each candidate V4 hook against the pool's last 30 days of hourly volume + tier with family-conditional multipliers (dynamic-fee / gated-swap / swap-delta-cut / royalty / init-gate / lifecycle / unknown). Heuristic — not a swap-by-swap EVM replay. The panel renders the multiplier table as the explicit assumption surface |
| One-click Permit2 Migration | Generates an atomic `close V3 → swap → mint V4` bundle signable in a single Permit2 signature |
| Signed Report | Report JSON pinned to 0G Storage (merkle rootHash), signed by TEE oracle, anchored on 0G Chain registry — verifiable offline with the CLI |
| iNFT Agent Identity | LPLens agent is minted as an ERC-7857-style iNFT on 0G Chain with persistent memory DAG + reputation counter |
| MCP Server | Exposes `lplens.diagnose`, `lplens.preflight`, `lplens.migrate`, `lplens.lookupReport`, `lplens.lookupReportOnChain`, `lplens.resolveEnsRecord` — callable by other autonomous agents over stdio |

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
   - Phase 6 — hook scoring (EMULATED — applies family-conditional multipliers to the pool's last 30 days of hourly volume + tier; surfaces the multiplier table as the assumption surface)
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

Phase 6 (hook scoring) is always EMULATED — the report explicitly discloses that the simulation uses family-level multipliers and cannot guarantee on-chain execution would match.

---

## Reliability acceptance tests

Six blocking acceptance tests must pass before any signed report is published :

- **AT-1 IL invariants** — three properties of `computeIL` (zero-in/zero-out, deposit-price equals current-price → IL=0, fees offset IL one-for-one) and one calibration fixture (one V3 position, hand-checked expected IL) hold within 1 %.
- **AT-2 no-hook replay drift** — designed: replay 1 000 mainnet swaps without a hook, final `sqrtPriceX96` matches actual on-chain state to < 10 bps. Not yet wired (phase 6 is heuristic scoring, not swap-by-swap replay; AT-2 is the proof that would justify a future replay engine).
- **AT-4 LLM no-hallucination** — every number in the final verdict markdown traces back to the input JSON (offline validator). Wired inline on phase 10.
- **AT-5 TEE signature round-trip** — designed: download report from 0G Storage via rootHash, re-hash, verify TEE signature offline.
- **AT-6 Permit2 EIP-712 signature** — signs synthetic `PermitSingle` typed data and recovers the signer offline via `viem`.
- **AT-9 V4 hook flag decoding** — flag bitmask decoded from hook address matches the masking expected by the PoolManager (fixture-based).

Four additional tuning tests cover directionality of hook family emulation, sandwich detection false-positive rate, regime classifier sanity, and end-to-end perf (≤ 60 s).

---




## Build status — v1.0.0-rc.1 (honesty pass applied)

The label column is the truth, not the marketing. Anything `EMULATED` or
`heuristic` is exactly that — explicit warnings travel with the value.

| Phase | Status | What it does |
| --- | --- | --- |
| 1 — Position resolution | ✅ live | V3: subgraph getV3Position. V4: `PositionManager.getPoolAndPositionInfo(tokenId)` decodes the packed PositionInfo; aggregator-only fallback if `MAINNET_RPC` is missing. Returns `VERIFIED`. |
| 3 — IL reconstruction | ✅ live | Eq. 6.29 / 6.30 of the V3 whitepaper via `@uniswap/v3-sdk` `SqrtPriceMath`. Vitest invariants in `packages/agent/test/IL.invariants.test.ts` cover the four foundational cases. Returns `COMPUTED`. |
| 4 — Regime classification | ✅ live | Realized vol / Hurst / linreg + sandwich-spike proxy (hours where volume/liquidity > 3σ) + JIT proxy (liquidity volatility / mean). Returns `ESTIMATED` with confidence. |
| 5 — V4 hook discovery | ✅ live | V4 subgraph + 14-bit hook flag-bitmap decoding → 7 family classifier. Returns `LABELED`. |
| 6 — V4 hook **scoring** | ⚠️ heuristic | Family-conditional multipliers (feeApr / volume / il / retention) derived from a 30-day pool sample, applied to the actual pool history's volume + tier. **Not** an EVM-state replay. The panel surfaces the multipliers as the assumption surface, and the value is wrapped `EMULATED` with an explicit warning. |
| 7 — Migration preview | ✅ live | Uniswap Trading API `/quote` for the swap leg; close → swap → mint preview. Permit2 EIP-712 PermitSingle ready for the wallet. Returns `EMULATED` with warnings (sample notional, no live execution). |
| 8 — Report assembly + 0G Storage | ✅ live | Assembles the full verdict JSON, uploads to 0G Storage, returns merkle rootHash. `VERIFIED` with key, deterministic stub `EMULATED` without. |
| 9 — 0G Chain anchor | ✅ live | Calls `LPLensReports.publishReport(tokenId, rootHash, attestation)` if `LPLENS_REPORTS_CONTRACT` is set, else self-tx with rootHash as calldata. `VERIFIED` or stub. |
| 10 — TEE verdict synthesis | ✅ live + AT-4 guard | 0G Compute broker → `qwen-2.5-7b-instruct` → 3-sentence markdown. Every `$` / `%` / hex claim is regex-extracted and checked (within ±2%) against the report payload; unsupported claims are masked `[unsupported]` and the value drops to `EMULATED` with the mismatch list. |
| 11 — ENS identity publish | ✅ live | Writes per-position text records under the agent's parent ENS name. `VERIFIED` or stub. |

Phase 2 (planning narrative) is rolled into phase 10's verdict synthesis — the LLM call is what writes the user-facing summary, so a separate planning pass would duplicate the LLM cost.

## Acceptance tests (`data/reliability-tests.md`)

- **AT-1 IL invariants + calibration fixture** — covered by `packages/agent/test/IL.invariants.test.ts` (six invariant cases) and `packages/agent/test/IL.calibration.test.ts` (one V3 position with hand-checked expected IL within 1 %). CI runs both on every PR.
- **AT-4 LLM hallucination guard** — covered inline by `validateVerdict` (phase 10). Unsupported claims are masked + warned, not silently shipped.
- **AT-6 Permit2 EIP-712 signature** — covered by `apps/web/test/permit2.eip712.test.ts`. Signs synthetic typed data, recovers the signer with `viem`.
- **AT-9 V4 hook flag decoding** — covered by `packages/agent/test/hookFlags.fixture.test.ts`. Fixture asserts the 14-bit bitmap → 7-family classifier on a known mainnet hook.
- AT-2, AT-3, AT-5, AT-7, AT-8, AT-10 — designed in `data/reliability-tests.md`; not yet wired as harnesses. Tracking issues follow the submission.

## Known limitations

- Phase 6 is a family-multiplier scoring engine, not a swap-by-swap EVM-state replay. The README, panel, and tool name (`scoreHook`) all say so explicitly. A full `SwapMath.computeSwapStep` replay would back AT-2 and is the documented follow-up.
- Atlas exposes three curated demo wallets as one-click buttons. Each is labeled clearly (live wallet vs curated fixture) so the health-state distribution is pinned for the demo run; judges can paste their own wallet for an authoritative run.
- Regime classifier weights are heuristic and not back-tested against a labeled dataset; the panel surfaces the raw features so a reviewer can sanity-check.
- ENS publication writes structured text records under a single parent name (`lplens-demo.eth`) keyed by `lplens.<tokenId>.<field>` — the records resolve through any ENS frontend or via `lplens.resolveEnsRecord` over MCP. A genuine subname-per-position pattern (NameWrapper writes against an owned parent) is the documented follow-up.

## Deployed contracts

| Network | Contract | Address |
| --- | --- | --- |
| 0G Newton (chainId 16602) | `LPLensReports` | [`0x05B4140683579dcbD1feC5965E7ADC77f210E53A`](https://chainscan-newton.0g.ai/address/0x05B4140683579dcbD1feC5965E7ADC77f210E53A) |
| 0G Newton (chainId 16602) | `LPLensAgent` (iNFT) | [`0x7CDE5dEb5CE16e8d7DE020736e7B9D99D392a141`](https://chainscan-newton.0g.ai/address/0x7CDE5dEb5CE16e8d7DE020736e7B9D99D392a141) |

See [contracts/DEPLOY.md](contracts/DEPLOY.md) for the one-line deploy command. After deploy, copy the addresses into the project root `.env` as `LPLENS_REPORTS_CONTRACT` and `LPLENS_AGENT_CONTRACT` — the server's `ogChain` adapter switches from raw self-tx anchoring to a real `publishReport(...)` call automatically.

## Tracks applied

| Track | Prize | What we do for it |
| --- | --- | --- |
| **0G — Best Autonomous Agents, Swarms & iNFT Innovations** | $7 500 (1 of 5 × $1 500) | LPLens is a long-running goal-driven agent on 0G. Verdicts are TEE-attested via `0G Compute` (`qwen/qwen-2.5-7b-instruct` on testnet, provider-attested via the broker's request signature). Reports are pinned to `0G Storage` with merkle rootHash. The rootHash is anchored on `0G Chain` through the `LPLensReports` registry contract. The agent itself is minted as an ERC-7857-style **iNFT** via `LPLensAgent` — `memoryRoot` updates each cycle, `reputation` increments per anchored report. |
| **Uniswap Foundation — Best Uniswap API Integration** | $5 000 (1 of 3) | Subgraph v3 + v4 (`modifyLiquidities`, positions, ticks, `Pool` discovery, `poolHourData`), Trading API v1 `/quote` for sample-notional swap pricing inside the migration preview, V4 hook flag-bitmap decoding (14 bits → 7 family heuristic), and Permit2 EIP-712 PermitSingle signature flow on the migration modal. Builder feedback in [FEEDBACK.md](FEEDBACK.md). |
| **ENS — Most Creative Use of ENS** | $2 500 (1 of 3) | Each diagnose run publishes the report's rootHash + storageUrl + 0G Chain anchor txHash + chainId + verdict excerpt as four ENS text records keyed `lplens.<tokenId>.<field>` under a parent name. Resolving the parent through any ENS frontend (or via MCP `lplens.resolveEnsRecord` from another agent) returns the full provenance triple without going through the LPLens API. The "creative" angle: ENS becomes the discovery layer for an autonomous agent's portfolio of work — every diagnose the agent has ever run is queryable by tokenId from one ENS name, with no per-position subname registration cost. The MCP tool surfaces this to any LLM agent that speaks MCP, turning ENS into a generic agent-output index. |

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


## Team

**42 Blockchain** — Jean-Baptiste Durand.

Past hackathon projects with the same "Lens" architecture (RAG-over-chain-data agent with SSE streaming + MCP) :

- **BaseLens** — Base L2 smart contract analyzer
- **CORLens** — XRPL cross-border corridor risk intelligence
- **SuiLens** — Sui Move package dependency analyzer
- **Devinci-Sui** — Sui devnet analytics agent
- **Panoramix** — EVM bytecode decompiler

---

---

## Demo

A 3-minute guided walkthrough lives in [DEMO.md](DEMO.md) — covers the
landing prism animation, atlas with curated demo wallet, the live SSE
diagnose flow, the Permit2 sign modal, and the permanent /report
viewer. The same flow is the live demo recording.

## MCP server

The agent is callable from any MCP-aware tool (Claude Desktop, Cursor,
autonomous agents) over stdio. See [apps/mcp-server/README.md](apps/mcp-server/README.md)
for the desktop config and the 5 exposed tools.

## License

MIT — see [LICENSE](LICENSE).

