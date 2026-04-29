# Demo walkthrough

A 3-minute guided tour for judges. Every step below is in the live demo
without scripting — the agent is real, the panels are bound to real
events.

## Prerequisites

```bash
pnpm install
cp .env.example .env  # fill THE_GRAPH_KEY (free), UNISWAP_TRADING_API_KEY (free dev key)
docker compose up -d  # postgres + redis
pnpm dev              # starts API on :3001, web on :3100, MCP on stdio
```

The four 0G keys (`OG_STORAGE_PRIVATE_KEY`, `OG_ANCHOR_PRIVATE_KEY`,
`OG_COMPUTE_PRIVATE_KEY`, `ENS_PARENT_PRIVATE_KEY`) are optional —
when missing, each adapter short-circuits to a deterministic stub and
the corresponding panel labels itself `EMULATED`. The demo flow stays
intact and is honest about what hit the network.

## Walkthrough — 5 beats, ~3 minutes

### Beat 1 — Atlas → bleeding position card (0:00–0:30)

Open `http://localhost:3100/atlas`. Three demo wallet buttons sit at
the top — `healthy`, `drifting`, `bleeding`. Click **bleeding** —
loads a curated fixture wallet whose top position is far out of range
with dominant IL, labeled `EMULATED — curated demo fixture` on the
PositionCard so the source is unambiguous.

The aggregate strip shows: total deposited, fees captured, healthy /
drifting / bleeding counts. The bleeding card sweeps a soft red
gradient — the visual cue that frames the rest of the demo.

Click the bleeding card → enters the diagnose flow.

### Beat 2 — Diagnose: live IL math + regime + hook scoring (0:30–1:30)

The page opens an SSE stream to `/api/diagnose/:tokenId`. Phase
progress strips at the top of the page tick from phase 1 → 11 as the
agent runs. Each panel renders the moment its phase emits.

1. **ILPanel** (COMPUTED, eq. 6.29 / 6.30) — HODL value vs LP value
   vs fees, all in token1 units. Numbers are deterministic given the
   chain reads.
2. **RegimePanel** (ESTIMATED) — top regime label + confidence + the
   raw features (realized vol, Hurst, sandwich-spike proxy, JIT
   proxy) so the assumption surface is auditable.
3. **HooksPanel** (LABELED) — candidate v4 hooks with family color
   coding; each row expandable to show the 14-bit flag bitmap.
4. **HookScoringPanel** (EMULATED) — top hook scored against 30d of
   pool history; baseline APR vs simulated APR with delta. The
   panel renders the **multiplier table** explicitly (feeApr,
   volume, ilImpact, retention) — the assumption surface, not a
   black box.

### Beat 3 — Migration: Permit2 in one signature (1:30–2:15)

Scroll to the **MigrationPanel** (EMULATED). Shows the close v3 →
swap → mint v4 plan with a real Trading API quote. Click **Migrate
→** opens the modal: 3-step bundle, Permit2 EIP-712 typed data
preview (verifying contract, spender, sigDeadline). Click **Sign
Permit2** → the wallet asks for an EIP-712 signature on the
`PermitSingle` struct. After signing, the modal shows the captured
signature. **The agent never executes — the user stays in custody.**

### Beat 4 — Report + on-chain verification (2:15–2:45)

Scroll to **ReportProvenancePanel** (VERIFIED when keys set, else
EMULATED). Shows the rootHash + 0G Storage URL + 0G Chain anchor
txHash + view-report link. Click **view report →** lands at
`/report/<rootHash>` — every section the agent emitted (provenance,
position, IL, regime, hooks, scoring, migration) read-only with
honesty labels intact.

For the on-chain verification path (this is the headline composability
beat): copy the rootHash, open Claude Desktop with the LPLens MCP
server configured, call `lplens.lookupReportOnChain` with the
rootHash. The contract returns the publisher + timestamp + tokenId
straight from `LPLensReports` — no LPLens API trust required, the
verification is a pure on-chain read from a separate process.

### Beat 5 — Verdict + ENS (2:45–3:00)

Back on the diagnose page, the **VerdictPanel** (ESTIMATED,
provider-attested via 0G Compute) streams a 3-sentence markdown
verdict. The AT-4 hallucination guard runs inline — every `$` / `%` /
hex claim in the verdict is regex-extracted and checked (within ±2 %)
against the report payload; unsupported claims are masked with
`[unsupported]` and the panel surfaces the mismatch list as a warning.

The **EnsPanel** shows the per-position text records published under
`lplens-demo.eth`, keyed `lplens.<tokenId>.rootHash`,
`lplens.<tokenId>.storageUrl`, etc. Resolves through any ENS
frontend; the MCP `lplens.resolveEnsRecord` tool reads them
independently of the LPLens API.

## Demo wallets (three buttons, three health states)

The three demo wallet buttons load curated fixtures so the demo's
green / amber / red narrative is pinned regardless of real-time chain
state:

- **healthy** — in-range USDC/WETH-ish position, fees > deposit ratio.
- **drifting** — close-to-edge position, modest fee capture.
- **bleeding** — far out of range, IL dominant, recommended migration
  to a `GATED_SWAP` family hook.

Each fixture position is rendered with the `EMULATED — curated demo
fixture` label so the source is explicit. Judges who want a live read
can paste their own wallet address into the search bar above the
buttons.
