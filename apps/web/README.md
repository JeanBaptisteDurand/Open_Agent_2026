# @lplens/web

Vite + React + Tailwind frontend.

## Honesty layer — label colors

Every numeric value rendered in a report has a color-coded label so a viewer
can tell at a glance how trusted the value is.

| Label | Dot | Color | Meaning |
| --- | --- | --- | --- |
| `VERIFIED` | 🟢 | emerald | read directly on-chain or from a canonical subgraph |
| `COMPUTED` | 🔵 | cyan | derived mathematically from VERIFIED data |
| `ESTIMATED` | 🟡 | amber | heuristic — comes with a confidence interval |
| `EMULATED` | 🟠 | orange | simulation result — comes with a `warnings[]` array |
| `LABELED` | 🏷️ | violet | manual curation by us |

The `<LabelBadge label="..." />` component renders these consistently.

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Atlas — wallet input, list of LP positions, sample-address shortcut |
| `/diagnose/:tokenId` | Live SSE diagnostic — phases, IL, regime, hooks, migration preview, report provenance + anchor, narrative |
| `/report/:rootHash` | Permanent read-only report — every section that the agent emitted, served from the server-side cache keyed by the report's 0G Storage rootHash |

## Components

| Component | Used by | Notes |
| --- | --- | --- |
| `LabelBadge` | header, panels, report sections | renders the 5 honesty labels |
| `ILPanel` | diagnose page | HODL / LP / fees / vs HODL with COMPUTED label |
| `RegimePanel` | diagnose page | mean-reverting / trending / toxic / JIT scores with ESTIMATED label |
| `HooksPanel` | diagnose page | candidate V4 hooks for the pair, family-coloured, with LABELED tag |
| `FlagBitChips` | hooks panel detail | 14-bit permission flag visualisation |
| `MigrationPanel` | diagnose page | close → swap → mint preview with EMULATED tag, sourced from Uniswap Trading API |
| `ReportProvenancePanel` | diagnose page | rootHash + 0G Storage URL + 0G Chain anchor tx + view-report link |
| `PositionCard` | atlas | green/amber/red traffic light + click-to-diagnose link |
| `ToolCallBadge` | diagnose page | tool.call / tool.result events badge |
| `TypewriterText` | diagnose page | typewriter animation for live narrative |

## Migration preview & the Trading API

The migration panel is wired to the Uniswap Trading API via the agent's
phase 7. The agent quotes a small sample notional (1 unit of token0) so the
preview is fast and deterministic; the user signs at migration time with
their own slippage budget. The agent never executes the swap — the result
is rendered as `EMULATED` with the `warnings[]` array exposed to the user.

## Report provenance — 0G Storage + 0G Chain + permanent viewer

Phase 8 assembles the agent's verdict (position, IL, regime, hooks,
migration plan) into a single JSON report and uploads it to 0G Storage.
The merkle rootHash returned by the indexer is content-addressed, which
means anyone can re-download the report and verify it byte-for-byte
matches the hash.

Phase 9 anchors that rootHash on 0G Chain by submitting a transaction
whose calldata is the rootHash. The transaction hash becomes a permanent,
tamper-evident commitment.

The server keeps a local mirror of every report it generates, keyed by
the rootHash, so the `/report/:rootHash` page can serve a permanent
read-only view without re-downloading from 0G. The `view report →` link
in the provenance panel of the diagnose page navigates straight to it.
The page renders the same six sections (provenance, position, IL, regime,
hooks, migration) the agent emitted, with the same honesty labels, so a
judge can share the URL and reviewers see exactly what the agent
committed.
