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

### 1. Landing — the prism

Open `http://localhost:3100/`. The hero animates a 14s six-beat prism
sequence (idle → pilot beam → refraction → fan → crystallize → sign).
Each ray crystallizes into a labeled data node — IL, REGIME, FEES,
TOXIC, HOOK. This is the agent's "what does it analyze" pictured.

Click **Connect wallet** (top-right) → opens the wallet modal. For the
demo we use a sample address shortcut on the next page, so this can
be skipped.

### 2. Atlas — your liquidity, under the lens

Navigate to `/atlas`. Click **try a sample address** to load the
curated demo wallet (`0x50ec…79c3`). The page renders:

- The aggregate strip — total deposited, fees captured, healthy /
  drifting / bleeding counts.
- One PositionCard per LP position with a status accent (green /
  amber / red), token-pair glyph, deposited / fees / liquidity stats,
  and a "DIAGNOSE →" CTA.
- Bleeding positions sweep a soft red gradient across the card to
  draw attention.

Click any card to enter the diagnose flow.

### 3. Diagnose — the live pipeline

The page opens an SSE stream to `/api/diagnose/:tokenId` and the
panels populate as each phase emits. Watch:

1. **DiagnosticGraph** — ReactFlow nodes appear as phases start.
2. **ILPanel** (COMPUTED, eq. 6.29 / 6.30) — HODL value vs LP value
   vs fees, all in token1 units.
3. **RegimePanel** (ESTIMATED) — top regime label + confidence.
4. **HooksPanel** (LABELED) — candidate v4 hooks with family color
   coding; each row expandable to show the 14-bit flag bitmap.
5. **ReplayPanel** (EMULATED) — top hook replayed against 30d of
   pool history; baseline APR vs simulated APR with delta.
6. **MigrationPanel** (EMULATED) — close v3 → swap → mint v4 plan
   with the Trading API quote. **Migrate** button opens the modal.
7. **ReportProvenancePanel** (VERIFIED when keys set, else EMULATED)
   — rootHash + storage URL + 0G Chain anchor txHash + view-report
   link.
8. **VerdictPanel** (ESTIMATED, TEE-attested) — 3-sentence verdict
   from 0G Compute. Streams in markdown with a typewriter effect.
9. **EnsPanel** (VERIFIED when keys set, else EMULATED) — per-position
   text records under `lplens-demo.eth`.

Each panel's label badge tells the truth about its trust level. A
fully-signed run shows VERIFIED + COMPUTED + ESTIMATED + LABELED +
EMULATED + VERIFIED + ESTIMATED + VERIFIED in the header.

### 4. Migration — Permit2 in one signature

Click **Migrate →** on the MigrationPanel. The modal shows the
3-step bundle, the Permit2 EIP-712 typed data preview (verifying
contract, spender, sigDeadline). Click **Sign Permit2** → the wallet
asks for an EIP-712 signature on the PermitSingle struct. After signing,
the modal shows the captured signature ready for the agent's relayer
to submit. The agent never executes — the user stays in custody.

### 5. Report — the permanent witness

Click **view report →** on the ReportProvenancePanel. Lands at
`/report/<rootHash>`. The page renders every section the agent
emitted (provenance, position, IL, regime, hooks, migration) read-
only with the same honesty labels. This URL is shareable — anyone
with the link sees exactly what was committed.

For the on-chain verification path: copy the rootHash, open the MCP
server in Claude Desktop, call `lplens.lookupReportOnChain` with the
rootHash. The contract returns the publisher + timestamp + tokenId
straight from `LPLensReports` — no LPLens API trust required.

For the ENS verification path: call `lplens.resolveEnsRecord` with
`name: lplens-demo.eth, key: lplens.<tokenId>.rootHash`. The on-chain
text record returns the same hash.

## Sample positions (curated wallet)

The sample address `0x50ec05ade8280758e2077fcbc08d878d4aef79c3` has
LP positions across the three health states so a single demo run
covers all three CTA narratives:

- **healthy** — in-range USDC/WETH-ish position, fees > deposit ratio
- **drifting** — close-to-edge, modest fee capture
- **bleeding** — far out of range, IL dominant

The curated set lets a judge run through the full flow without
needing their own wallet.
