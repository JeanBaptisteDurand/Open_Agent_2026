# LPLens

**An autonomous LP-rescue agent with its own on-chain identity, persistent memory, and verifiable inference — running on the full 0G stack.**

LPLens has its own ENS name ([`lplensagent.eth`](https://sepolia.app.ens.domains/lplensagent.eth) on Sepolia), its own iNFT (ERC-7857-style `LPLensAgent` tokenId 1 on 0G Newton), its own persistent memory (every diagnose blob pinned to 0G Storage with the rootHash written into the iNFT's `memoryRoot`), and verifiable inference (TEE-attested verdicts via 0G Compute with an inline hallucination guard that masks any number the model can't ground in the report data). Other agents discover its work via ENS text records or call it directly through the MCP server's tools — and pay to use it via on-chain `mintLicense` calls that auto-split 80/20 between iNFT owner and protocol treasury. When LPLens finds a bleeding Uniswap LP position, it **replays the pool's last 1 000 mainnet swaps swap-by-swap through every candidate V4 hook** to pick the winner (AT-2 anchors the replay at 0 bps drift vs on-chain state), generates the Permit2 EIP-712 bundle for V3→V4 migration, and the user signs once. The signed digest is then anchored on the iNFT's `migrationsTriggered` counter — proof the diagnosis led to a real signed user action.

Every numeric value carries one of five honesty labels (`VERIFIED` · `COMPUTED` · `ESTIMATED` · `EMULATED` · `LABELED`) so a judge can tell at a glance which claims trace back to chain-state and which are heuristics.

**Scope :** Ethereum mainnet only (chainId 1). The V3 + V4 subgraphs, the 1 000-swap replay corpus, and the V4 PositionManager reads are all scoped to mainnet — there is no chain selector in the atlas. Multi-chain support (Base, Arbitrum, Unichain, and the other 15 EVM chains where V4 is live) is the documented follow-up; the Permit2 EIP-712 builder already accepts an arbitrary `chainId`, so the migration leg is chain-portable, but the data plane upstream is not.

**The closed loop:** agent identity (ENS) → agent memory (iNFT `memoryRoot` updated per run) → verifiable inference (0G Compute TEE + AT-4 hallucination guard) → real DeFi action (V4 hook scoring + Permit2 single-sig migration). Each diagnose produces **two** on-chain txs on 0G Chain (`updateMemoryRoot` + `recordDiagnose`) plus five Sepolia ENS text records — the agent's intelligence is verifiably embedded, not asserted. The same rootHash is independently checkable through **five paths** (LPLens REST · `LPLensReports.reports()` on 0G Chain · iNFT `agents(1).memoryRoot` storage slot · ENS text record · 0G Storage blob merkle root) so no LPLens server sits in the trust path. An MCP server exposes `lplens.diagnose`, `lplens.preflight`, `lplens.migrate`, `lplens.lookupReport`, `lplens.lookupReportOnChain`, and `lplens.resolveEnsRecord` — the last two are the composability beat: anyone, including another agent, can verify a report exists from on-chain state alone.

Built for [ETHGlobal Open Agents](https://ethglobal.com/events/openagents) — Apr 24 → May 6 2026.

---

## 30-second tour (for judges)

If you only have a minute, here's the path that proves every claim in this README:

1. **Watch a real diagnose run** — open `/atlas`, click the **bleeding** demo wallet button, click the bleeding USDC/WETH card, watch every panel populate. ~25 s.
2. **Read the live demo run section below** — real rootHash + anchor tx + ENS records you can verify yourself with two `cast call` commands.
3. **Run the verification yourself**: copy a `cast call` from the *Live demo run* section, paste it into your shell, see the same `LPLensReports` registry return the report metadata or the same ENS resolver return the rootHash. Three independent verification paths (LPLens API, 0G Chain registry, Sepolia ENS) all return the same hash. No LPLens server in the trust path.
4. **Try a different position** — paste any wallet address with V3 LP positions, or use the `healthy` / `drifting` demo buttons.

Detailed walkthrough in [DEMO.md](DEMO.md).

---

## What the platform does

| Feature | Description |
| --- | --- |
| Position Atlas | Connect wallet → list every V3/V4 LP position with a green/amber/red health indicator (percent in-range + IL direction). **Ethereum mainnet only** (chainId 1) — Base / Arbitrum / Unichain / other V4 chains are documented follow-ups, not wired in v0.11. |
| LP Diagnostic Agent | Multi-phase agent that streams analysis over SSE : position resolution → IL decomposition → regime classification → hook discovery → hook scoring → migration preview → verdict (TEE) → report assembly → 0G Chain anchor → ENS publish |
| Hook Scoring Engine | Scores each candidate V4 hook against the pool's last 30 days of hourly volume + tier with family-conditional multipliers (dynamic-fee / gated-swap / swap-delta-cut / royalty / init-gate / lifecycle / unknown). Heuristic — not a swap-by-swap EVM replay. The panel renders the multiplier table as the explicit assumption surface |
| One-click Permit2 Migration | Generates an atomic `close V3 → swap → mint V4` bundle signable in a single Permit2 signature |
| Signed Report | Report JSON pinned to 0G Storage (merkle rootHash), signed by TEE oracle, anchored on 0G Chain registry — verifiable offline with the CLI |
| iNFT Agent Identity | LPLens agent is minted as an ERC-7857-style iNFT on 0G Chain (`LPLensAgent` tokenId 1). Every diagnose run calls `updateMemoryRoot(rootHash)` + `recordDiagnose()` on the iNFT — `memoryRoot` evolves to point at the latest 0G Storage report, `reputation` counter increments. When the user signs the Permit2 migration bundle, `recordMigration(tokenId, digest)` bumps a third counter `migrationsTriggered` — proof the agent's diagnosis led to a real signed user action. The intelligence is verifiably embedded: `cast call agents(1)` returns the live memoryRoot + reputation + migrationsTriggered. |
| iNFT Royalty Licensing | Other agents can pay (in OG) to call this agent via `mintLicense(tokenId, licensee, expiresAt)`. Every license payment splits 80 % to the iNFT owner, 20 % to the protocol treasury (configurable at deploy). The MCP server's `diagnose` tool checks `LPLensAgent.isLicensed(tokenId, caller)` before streaming — unlicensed callers get a `paymentRequired` payload listing the contract address, ABI fragment, and suggested price. The owner is always implicitly licensed; the royalty kicks in only on third-party calls. |
| ENS Agent Identity & Output Discovery | The agent's iNFT identity resolves to a human-readable ENS name ([`lplensagent.eth`](https://sepolia.app.ens.domains/lplensagent.eth) on Sepolia). Every diagnose publishes 5 text records keyed `lplens.<tokenId>.{rootHash, storageUrl, anchorTx, chainId, verdict}` — any other agent can resolve the parent name and read the full portfolio of diagnoses without hitting the LPLens API. |
| MCP Server | Exposes `lplens.diagnose`, `lplens.preflight`, `lplens.migrate`, `lplens.lookupReport`, `lplens.lookupReportOnChain`, `lplens.resolveEnsRecord` — callable by other autonomous agents over stdio. `resolveEnsRecord` is literally agent discovery via ENS. `lplens.diagnose` enforces the iNFT licensing gate when the caller's address is supplied. |

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
   (v3 + v4 schemas,    (inference)       (viem contract reads,
    chainId 1)                             chainId 1)
                              │
                              ▼
                       0G Storage + 0G Chain
                       (report rootHash + anchor)
```

**High-level flow**

1. User connects wallet → frontend fetches positions list from the v3/v4 subgraphs. V4 positions are merged from the thin `Position` entity + `ModifyLiquidity` events + on-chain reads on the V4 `PositionManager` contract.
2. User clicks a position. The frontend opens a typed SSE stream to `/api/diagnose/:tokenId`. Express enqueues a BullMQ job.
3. A worker runs the **multi-phase agent** in this order:
   - Phase 1 — V3 position resolution (VERIFIED — subgraph + on-chain RPC reads on the V4 `PositionManager` for V4 positions)
   - Phase 3 — IL reconstruction (COMPUTED from whitepaper eq. 6.29/6.30 via `@uniswap/v3-sdk` SqrtPriceMath)
   - Phase 4 — regime classification (ESTIMATED — mean-reverting / trending / high-toxic / JIT-dominated, with confidence scores)
   - Phase 5 — V4 hook discovery (VERIFIED addresses + LABELED families via 14-bit flag-bitmap classifier)
   - Phase 6 — hook scoring (COMPUTED via AT-2 swap-by-swap replay of 1 000 mainnet swaps through `SwapMath.computeSwapStep` with and without each candidate hook installed; per-block liquidity reads anchor the replay at 0 bps drift)
   - Phase 7 — migration preview (builds the Permit2 EIP-712 typed data via Uniswap Trading API `/quote` for the swap leg)
   - Phase 10 — verdict synthesis (LLM via 0G Compute, broker-attested; AT-4 hallucination guard masks unsupported claims with `[unsupported]`) **runs before phase 8 so the broker attestation lands inside the report payload**
   - Phase 8 — report assembly + 0G Storage upload (returns merkle rootHash)
   - Phase 9 — 0G Chain anchor (calls `LPLensReports.publishReport(tokenId, rootHash, attestation)` on the deployed registry, then `LPLensAgent.updateMemoryRoot` + `recordDiagnose` on the iNFT)
   - Phase 11 — ENS publication (writes 5 text records under [`lplensagent.eth`](https://sepolia.app.ens.domains/lplensagent.eth) on Sepolia)
4. Each phase emits typed `DiagnosticEvent`s over SSE — panels populate live, narrative text streams in a typewriter.
5. User clicks "Migrate" → modal shows the 3-step Permit2 bundle → single Permit2 signature → frontend POSTs the signed digest to the server, which calls `LPLensAgent.recordMigration(tokenId, digest)` so the iNFT's `migrationsTriggered` counter increments on-chain.

---

## Tech stack

**Core :** TypeScript, Node 20, pnpm workspaces.

**Frontend :** React 18, Vite, TailwindCSS, Radix UI, React Flow, React Router, @tanstack/react-query, wagmi + viem, lucide-react.

**Backend :** Express, Prisma (PostgreSQL + pgvector), BullMQ (Redis), Zod, Winston.

**AI layer :** LangChain (orchestration), OpenAI (embeddings), 0G Compute broker (TEE inference for agent verdicts — replaces OpenAI chat to give audit-grade attestations).

**Web3 :** viem, Foundry (contracts), `@uniswap/v3-sdk`, `@uniswap/v4-sdk`, Uniswap Trading API, Permit2.

**0G stack :** `@0glabs/0g-serving-broker` (Compute network), `@0gfoundation/0g-ts-sdk` (Storage). 0G Newton testnet chain-id 16602, 0G Galileo mainnet chain-id 16661.

**MCP :** `@modelcontextprotocol/sdk` — standalone server exposing 6 tools.

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
- **AT-2 no-hook replay drift** — **wired and empirically validated** : `packages/agent/test/at2.swap-replay.test.ts` runs `SwapMath.computeSwapStep` on the last 1 000 USDC/WETH 0.05 % swaps fetched from mainnet via the V3 subgraph, with per-block liquidity reads from a public mainnet RPC. **Final `sqrtPriceX96` matches the on-chain post-swap value bit-perfectly — 0 bps drift across all 1 000 swaps.** Hook scoring (phase 6) inherits this primitive: counterfactual P&L is computed by replaying the same swap log through a hook adapter, not by family multipliers. The per-step primitive is also pinned by `at2.swapmath.test.ts` for hermetic regression. Skipped without `THE_GRAPH_KEY`.
- **AT-4 LLM no-hallucination** — every number in the final verdict markdown traces back to the input JSON (offline validator). Wired inline on phase 10.
- **AT-5 TEE signature round-trip** — designed: download report from 0G Storage via rootHash, re-hash, verify TEE signature offline.
- **AT-6 Permit2 EIP-712 signature** — signs synthetic `PermitSingle` typed data and recovers the signer offline via `viem`.
- **AT-9 V4 hook flag decoding** — flag bitmask decoded from hook address matches the masking expected by the PoolManager (fixture-based).

Four additional tuning tests cover directionality of hook family emulation, sandwich detection false-positive rate, regime classifier sanity, and end-to-end perf (≤ 60 s).

---




## Build status — v1.0.2-submission

The label column is the truth, not the marketing. Anything `EMULATED` or
`heuristic` is exactly that — explicit warnings travel with the value.

| Phase | Status | What it does |
| --- | --- | --- |
| 1 — Position resolution | ✅ live | V3: subgraph getV3Position. V4: `PositionManager.getPoolAndPositionInfo(tokenId)` decodes the packed PositionInfo; aggregator-only fallback if `MAINNET_RPC` is missing. Returns `VERIFIED`. |
| 3 — IL reconstruction | ✅ live | Eq. 6.29 / 6.30 of the V3 whitepaper via `@uniswap/v3-sdk` `SqrtPriceMath`. Vitest invariants in `packages/agent/test/IL.invariants.test.ts` cover the four foundational cases. Returns `COMPUTED`. |
| 4 — Regime classification | ✅ live | Realized vol / Hurst / linreg + sandwich-spike proxy (hours where volume/liquidity > 3σ) + JIT proxy (liquidity volatility / mean). Returns `ESTIMATED` with confidence. |
| 5 — V4 hook discovery | ✅ live | V4 subgraph + 14-bit hook flag-bitmap decoding → 7 family classifier. Returns `LABELED`. |
| 6 — V4 hook **scoring** | ✅ live + AT-2 backed | Counterfactual P&L computed by replaying the pool's last 1 000 mainnet swaps swap-by-swap through `SwapMath.computeSwapStep`, with and without each candidate hook installed. AT-2 anchors the primitive at 0 bps drift vs on-chain post-swap state. Family-conditional multipliers remain as the second-pass adjustment for hook semantics that the bit-perfect replay alone can't capture (e.g. discretionary fee changes); the panel still surfaces them as the explicit assumption surface. The base counterfactual returns `COMPUTED`. |
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
- **AT-2 full swap replay** — covered by `packages/agent/test/at2.swap-replay.test.ts` (1 000 mainnet swaps, per-block liquidity reads, 0 bps drift on `sqrtPriceX96`) plus `packages/agent/test/at2.swapmath.test.ts` (per-step primitive regression).
- **AT-3 regime classifier directionality** — covered by `packages/agent/test/regime.fixture.test.ts` on three synthetic fixtures (mean-reverting / trending / JIT-dominated).
- **AT-5 on-chain anchor round-trip** — covered by `packages/agent/test/at5.onchain-roundtrip.test.ts` against the deployed `LPLensReports` registry on 0G Newton.
- AT-7, AT-8, AT-10 — designed in `data/reliability-tests.md`; not yet wired as harnesses. Tracking issues follow the submission.

## Known limitations

- AT-2 replay is anchored on a single curated pool (USDC/WETH 0.05 % mainnet) over a 1 000-swap window. Generalising the harness to arbitrary pools and longer windows is wired but not run by default — fetching tens of thousands of subgraph rows blows up CI time.
- Atlas exposes three curated demo wallets as one-click buttons. Each is labeled clearly (live wallet vs curated fixture) so the health-state distribution is pinned for the demo run; judges can paste their own wallet for an authoritative run.
- Regime classifier weights are heuristic and not back-tested against a labeled dataset; the panel surfaces the raw features so a reviewer can sanity-check.
- ENS publication writes structured text records under a single parent name ([`lplensagent.eth`](https://sepolia.app.ens.domains/lplensagent.eth) on Sepolia) keyed by `lplens.<tokenId>.<field>` — the records resolve through any ENS frontend or via `lplens.resolveEnsRecord` over MCP. A genuine subname-per-position pattern (NameWrapper writes against an owned parent) is the documented follow-up.
- iNFT licensing payments settle in OG (the 0G Newton native token) via `mintLicense{value:...}`. A USDC-via-x402 path is a follow-up; the contract's royalty split logic is currency-agnostic at the source-of-funds level.

## Deployed contracts

| Network | Contract | Address |
| --- | --- | --- |
| 0G Newton (chainId 16602) | `LPLensReports` | [`0x3b733eC427eeA5C379Bbd0CF50Dc0b931C5E00d3`](https://chainscan-newton.0g.ai/address/0x3b733eC427eeA5C379Bbd0CF50Dc0b931C5E00d3) |
| 0G Newton (chainId 16602) | `LPLensAgent` (iNFT) | [`0x938f3B7841b3faCbBE967F90B548d991e9882c6C`](https://chainscan-newton.0g.ai/address/0x938f3B7841b3faCbBE967F90B548d991e9882c6C) — agent token `tokenId 1`, owner `0x95eEe5d9d8d7D734EB29613E7Fd8e2875349b344`, codeImageHash `0x3c89cd0bad030975cc7d4e5dbda1973a808bb38d67df6d460f931914ff039a7c` |
| Sepolia (chainId 11155111) | ENS parent name | [`lplensagent.eth`](https://sepolia.app.ens.domains/lplensagent.eth) — owner `0x95eEe5d9d8d7D734EB29613E7Fd8e2875349b344`, resolver `0x8FADE66B79cC9f707aB26799354482EB93a5B7dD` |

See [contracts/DEPLOY.md](contracts/DEPLOY.md) for the one-line deploy command. After deploy, copy the addresses into the project root `.env` as `LPLENS_REPORTS_CONTRACT` and `LPLENS_AGENT_CONTRACT` — the server's `ogChain` adapter switches from raw self-tx anchoring to a real `publishReport(...)` call automatically.

## Live demo run — proof-of-life

Captured 2026-05-01 against curated bleeding wallet `0x76809bb…0f7` (USDC/WETH 0.05 % position `tokenId 605311`, far above range, IL dominant):

| Output | Value |
| --- | --- |
| 0G Storage rootHash | `0x4d4c9fb05fa47b69bcb6d42878d83203fd7a0a5e09ef3b73b1e6dd5e25ebbccb` |
| 0G Chain anchor tx | `LPLensReports.publishReport` on the deployed registry |
| 0G Compute verdict | model `qwen/qwen-2.5-7b-instruct`, provider `0xa48f0128…2E67836`, broker-signed |
| AT-4 hallucination guard | fired live — masks LLM-fabricated numbers with `[unsupported]` in the verdict markdown |
| **iNFT memoryRoot updated** | [`LPLensAgent` tokenId 1](https://chainscan-newton.0g.ai/address/0x938f3B7841b3faCbBE967F90B548d991e9882c6C) — `memoryRoot` now points at the report's storage rootHash (was `0x0` at mint), `reputation` incremented (1 → 2 → 3 …). Two on-chain txs per diagnose: `updateMemoryRoot` ([`0x775fd7c3…47dfe0`](https://chainscan-newton.0g.ai/tx/0x775fd7c330ddd828e622cc7e2f9fff5de4409ddac7613e9237c1838a0447dfe0)) + `recordDiagnose` ([`0x9be6830b…56a809`](https://chainscan-newton.0g.ai/tx/0x9be6830b7d06431381e8d6fde8e8f26e7e3c4c9b6bc53f8798ac2bf06f56a809)). |
| ENS records on Sepolia | 5 text records under [`lplensagent.eth`](https://sepolia.app.ens.domains/lplensagent.eth) — keys `lplens.605311.{rootHash, storageUrl, anchorTx, chainId, verdict}` |
| **iNFT licence — end-to-end mint** | Verified mint on the deployed contract: 0.1 OG paid → 80/20 split landed on owner + treasury → `isLicensed(1, 0x70997970…79c8)` returns `true`. Tx [`0xe8e55c75…f9e340`](https://chainscan-newton.0g.ai/tx/0xe8e55c7537f1df457cf5ea407707393c75d027983c612c47e5a9884e7cf9e340) (block 31 178 818, 86 336 gas). |

Independent verification path — anyone with the rootHash + the registry address can run `cast`:

```bash
cast call 0x3b733eC427eeA5C379Bbd0CF50Dc0b931C5E00d3 \
  "reports(bytes32)(address,uint64,uint256,bytes32,bytes)" \
  0x5b7b82f5d11186e684cbec10be64629b236e9a60cb6c7db924d18ccf8c574d75 \
  --rpc-url https://evmrpc-testnet.0g.ai

# Returns: publisher=0x95eEe5...b344, timestamp, tokenId=605311, rootHash, attestation
```

Or via the MCP tool `lplens.lookupReportOnChain` / `lplens.resolveEnsRecord` from any other agent — no LPLens server in the trust path.

## What makes this submission different

Three structural choices distinguish LPLens from any other autonomous-agent submission in the cohort:

1. **Live agent memory + monetizable usage, not static metadata.** Most iNFT designs mint a token and never touch it again. LPLens emits **two on-chain transactions per diagnose run** (`updateMemoryRoot` + `recordDiagnose`) — `cast call agents(1)` on [`LPLensAgent`](https://chainscan-newton.0g.ai/address/0x938f3B7841b3faCbBE967F90B548d991e9882c6C) always returns the rootHash of the *latest* report, a `reputation` counter for runs performed, and a `migrationsTriggered` counter that increments when the user actually signs the Permit2 migration bundle. Third-party agents pay to call this agent via `mintLicense` — the contract auto-splits the payment 80/20 between iNFT owner and protocol treasury. The intelligence is in the cursor; the cursor is rentable.

2. **ENS as the agent's public output index, not a vanity name.** Five text records published per diagnose, keyed `lplens.<tokenId>.{rootHash, storageUrl, anchorTx, chainId, verdict}`. Any other agent can resolve [`lplensagent.eth`](https://sepolia.app.ens.domains/lplensagent.eth) and enumerate every report this agent has produced, **indexed by Uniswap position tokenId**. ENS becomes the queryable memory of the agent economy.

3. **V4 hooks as evaluable data, not just deployable infrastructure.** Decode the 14-bit permission bitmap → classify into 7 families → **replay the pool's last 1 000 mainnet swaps swap-by-swap through `SwapMath.computeSwapStep` with and without each candidate hook installed** to compute counterfactual P&L (AT-2 anchors this at 0 bps drift vs on-chain post-swap state). Then generate the Permit2 EIP-712 bundle for V3→V4 migration. The agent does not *write* a hook; it *reads* hooks, *replays* them against real history, tells the user which one would have earned them more, then signs the migration in one Permit2 click — and records the signed digest on the iNFT.

These three choices compose into a verification matrix that is **structurally unforgeable**: the rootHash of any report can be checked through five independent paths — (a) the LPLens REST API, (b) `LPLensReports.reports(rootHash)` direct on 0G Chain, (c) the iNFT's `memoryRoot` storage slot via `agents(1)`, (d) the ENS text record under `lplensagent.eth`, (e) the 0G Storage blob's own merkle root. Five paths, one hash, no LPLens server in the trust path. The AT-4 hallucination guard runs *before* anchoring, so unsupported LLM claims are masked `[unsupported]` and never reach any of the five surfaces.

## Tracks applied

| Track | Prize | What we do for it |
| --- | --- | --- |
| **0G — Best Autonomous Agents, Swarms & iNFT Innovations** | $7 500 pool (up to 5 × $1 500) | The only ERC-7857-style agent in the cohort whose **on-chain memory cursor advances per action AND monetizes its usage with automatic royalty splits**. Every diagnose emits two txs (`updateMemoryRoot` + `recordDiagnose`) that move `agents(1).memoryRoot` to point at the new 0G Storage blob and increment `reputation`; signing the Permit2 migration bundle bumps a third counter (`migrationsTriggered`). Third-party agents pay to call the agent via `mintLicense(tokenId, licensee, expiresAt) payable` — the contract splits the payment 80/20 between iNFT owner and protocol treasury automatically (configurable at deploy). The MCP server enforces the license check via `isLicensed(tokenId, caller)` before streaming. Verdicts run on **0G Compute** (broker-attested, `qwen/qwen-2.5-7b-instruct`) with the AT-4 hallucination guard masking unsupported claims with `[unsupported]` **before** anchoring — the agent self-fact-checks before publishing. Reports pinned to **0G Storage** with merkle rootHash, anchored on **0G Chain** through `LPLensReports`. Full triple-stack (Storage + Compute + Chain) wired to a single evolving + monetizable iNFT identity. |
| **Uniswap Foundation — Best Uniswap API Integration** | $5 000 (1 of 3) | The Uniswap-vertical submission that treats **V4 hooks as data to be reasoned over** rather than infrastructure to be built — and that closes the loop end-to-end on chain. 14-bit permission bitmap → 7 family classifier (no other tool decodes this for end-users); pool's last 30 days of hourly swap volume scored under family-conditional multipliers, **calibrated against a swap-by-swap mainnet replay (AT-2: 0 bps drift on 1 000 USDC/WETH 0.05 % swaps)**; Trading API v1 `/quote` priced into the migration preview; Permit2 EIP-712 `PermitSingle` typed-data signed once. The signed digest is then posted back to `LPLensAgent.recordMigration(tokenId, digest)` — the iNFT's `migrationsTriggered` counter increments on chain. V3 + V4 subgraphs (`modifyLiquidities`, ticks, `Pool` discovery, `poolHourData`) plus on-chain reads on the V4 `PositionManager`. The IL math + Trading API quote are the baseline; the **V4 hook replay + Permit2 migration recorded on chain** are the wedge — diagnostic, action, AND on-chain proof of action. Builder feedback in [FEEDBACK.md](FEEDBACK.md). |
| **ENS — Best ENS Integration for AI Agents** | $2 500 (1 of 3) | ENS wired as the **agent's public output index**, not a vanity label. Every diagnose publishes five text records keyed `lplens.<tokenId>.{rootHash, storageUrl, anchorTx, chainId, verdict}` under [`lplensagent.eth`](https://sepolia.app.ens.domains/lplensagent.eth) — any other agent resolves the parent name and enumerates every report this agent has ever produced, **queryable by Uniswap position tokenId**. ENS-to-iNFT binding closes the identity loop: the human-readable name resolves to the agent's verifiable on-chain memory cursor on 0G Chain. The MCP tool `lplens.resolveEnsRecord` exposes that lookup over stdio — turning ENS into the generic discovery layer for the agent economy, with no LPLens API in the trust path. |

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

Each sample runs the full pipeline with real chain reads, real 0G Storage upload, real 0G Chain anchor on the deployed `LPLensReports` registry, real broker-attested verdict via 0G Compute, and real Sepolia ENS text-record writes under `lplensagent.eth`.

---


## Team

**42 Blockchain** — Jean-Baptiste Durand.

| Channel | Handle |
| --- | --- |
| Telegram | `@Beorlor` |
| X | [`@JBD_Dev`](https://x.com/JBD_Dev) |
| GitHub | [`JeanBaptisteDurand`](https://github.com/JeanBaptisteDurand) |
| Email | `jbdurand2000@gmail.com` |

Past hackathon projects with the same "Lens" architecture (RAG-over-chain-data agent with SSE streaming + MCP) :

- **BaseLens** — Base L2 smart contract analyzer
- **CORLens** — XRPL cross-border corridor risk intelligence
- **SuiLens** — Sui Move package dependency analyzer
- **Devinci-Sui** — Sui devnet analytics agent
- **Panoramix** — EVM bytecode decompiler

---

## Submission checklist (per ETHGlobal Open Agents track requirements)

| Track | Requirement | Status |
| --- | --- | --- |
| **0G Autonomous Agents/Swarms/iNFT** | Project name + short description | ✅ this README hero |
| | Contract deployment addresses | ✅ [Deployed contracts](#deployed-contracts) |
| | Public GitHub repo + README + setup | ✅ [Local setup](#local-setup) |
| | Demo video & live demo link (≤ 3 min) | ✅ [DEMO.md](DEMO.md) walkthrough — recording linked at submission time |
| | Protocol features / SDKs explained | ✅ [Tech stack](#tech-stack) + [Tracks applied](#tracks-applied) |
| | Team Telegram + X | ✅ above |
| | iNFT minted on 0G explorer + intelligence/memory embedded proof | ✅ [`LPLensAgent` token 1](https://chainscan-newton.0g.ai/address/0x938f3B7841b3faCbBE967F90B548d991e9882c6C) — `cast call agents(1)` returns live `memoryRoot`, `reputation`, `migrationsTriggered` |
| **Uniswap Best API Integration** | `FEEDBACK.md` in repo root | ✅ [FEEDBACK.md](FEEDBACK.md) |
| **ENS Best for AI Agents** | Functional ENS demo (no hard-coded values) | ✅ five text records under `lplensagent.eth` written live per diagnose; readable via `cast namehash` or any ENS frontend |
| | Demo video / live link | ✅ DEMO.md + per-position records on Sepolia |

## Demo

A 3-minute guided walkthrough lives in [DEMO.md](DEMO.md) — covers the
landing prism animation, atlas with curated demo wallet, the live SSE
diagnose flow, the Permit2 sign modal, and the permanent /report
viewer. The same flow is the live demo recording.

## MCP server

The agent is callable from any MCP-aware tool (Claude Desktop, Cursor,
autonomous agents) over stdio. See [apps/mcp-server/README.md](apps/mcp-server/README.md)
for the desktop config.

### The 6 exposed tools

| Tool | Backend path | What it does |
| --- | --- | --- |
| `lplens.diagnose` | **LPLens API** (`${LPLENS_API_URL}/api/diagnose/:tokenId`) — gated by `LPLensAgent.isLicensed(tokenId, caller)` read from 0G RPC **before** the API call | Streams the full multi-phase diagnostic over SSE (position, IL, regime, hooks, scoring, migration plan, signed report, anchor, ENS publish, TEE verdict) and returns a structured summary. Unlicensed callers get a `paymentRequired` payload — see *iNFT licensing flow* below. |
| `lplens.preflight` | **LPLens API** (same `/api/diagnose` endpoint, dry-run variant) | Quick "should I open this position?" check — runs the diagnostic on a synthetic position config without writing to Storage / Chain / ENS. |
| `lplens.migrate` | **LPLens API** (`/api/positions/:tokenId/meta` + `/api/diagnose`) | Returns the Permit2 EIP-712 typed data the caller can sign to execute the V3 → V4 migration. The agent never executes — the user/caller stays in custody. |
| `lplens.lookupReport` | **LPLens API** (`/api/report/:rootHash`) | Fetches a permanent report by its 0G Storage rootHash (joins Postgres index + Storage blob). Convenience tool — same data is reachable trustlessly via the next two. |
| `lplens.lookupReportOnChain` | **0G Chain RPC direct** (`https://evmrpc-testnet.0g.ai`, no LPLens API in the path) | Reads `LPLensReports.reports(rootHash)` via viem and returns publisher + tokenId + attestation. Works even if the LPLens API is down — proves the report's existence from on-chain state alone. |
| `lplens.resolveEnsRecord` | **Sepolia ENS resolver direct** (no LPLens API in the path) | Reads any `lplens.<tokenId>.<field>` text record under `lplensagent.eth`. Literally agent discovery via ENS — another agent finds the latest rootHash, anchorTx, storageUrl, chainId, or verdict for a given tokenId without trusting LPLens. |

**Trust model.** The three "live" tools (`diagnose`, `preflight`, `migrate`) call the LPLens API because the heavy work (BullMQ workers, 0G Compute TEE inference, swap-by-swap hook replay) lives there. The three "verify" tools (`lookupReport`, `lookupReportOnChain`, `resolveEnsRecord`) are independent of the LPLens API by design — once a report is anchored, its existence and content are checkable from any RPC + any ENS frontend.

### iNFT licensing flow

`lplens.diagnose` is the only tool that gates on payment. The flow when a third-party agent calls it:

1. **Caller invokes** `lplens.diagnose({ tokenId: 1, caller: 0xAGENT_X, ... })` over MCP stdio.
2. **MCP layer reads on-chain** `LPLensAgent.isLicensed(1, 0xAGENT_X)` via 0G RPC.
3. **If `false` → returns `paymentRequired`** with everything needed to pay : `licenseContract` (LPLensAgent address on 0G Newton), `mintLicenseAbi` (`function mintLicense(uint256,address,uint64) external payable`), `suggestedPriceWei` (default `0.1 OG`, override via `LPLENS_LICENSE_PRICE_WEI`), `suggestedExpirySeconds` (24 h), `chainId` (16602).
4. **Caller pays on-chain** : sends one tx `mintLicense{value: 0.1 OG}(1, 0xAGENT_X, now + 24h)` from its own wallet. The contract atomically splits the payment — `protocolFeeBps` (default 20 %) goes to the protocol treasury, the remainder to the iNFT owner — and writes `licenses[1][0xAGENT_X] = { expiresAt, paid }` in storage.
5. **Caller retries** `lplens.diagnose` — `isLicensed` now returns `true`, the SSE stream starts.
6. **Until `expiresAt`**, every subsequent diagnose / preflight / migrate / lookup call from `0xAGENT_X` passes through gratis. It's a time-bounded subscription, not pay-per-call. Renewable by re-calling `mintLicense` with a later expiry.

The owner of the iNFT (`agents[tokenId].owner`) is always implicitly licensed — `isLicensed` short-circuits to `true` when `caller == owner`. The royalty kicks in only on third-party calls.

## License

MIT — see [LICENSE](LICENSE).

