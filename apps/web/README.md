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
| `/diagnose/:tokenId` | Live SSE diagnostic — phases, IL, regime, hooks, migration preview, report provenance + anchor, verdict, narrative |
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
| `VerdictPanel` | diagnose page | TEE-attested LLM verdict via 0G Compute, ESTIMATED when real, EMULATED when stubbed |
| `PositionCard` | atlas | green/amber/red traffic light + click-to-diagnose link |
| `ToolCallBadge` | diagnose page | tool.call / tool.result events badge |
| `TypewriterText` | diagnose page | typewriter animation for live narrative |

## The 0G stack

LPLens uses all three 0G primitives end-to-end:

- **0G Compute (phase 10)** — verdict synthesis runs in a TEE-attested
  inference provider discovered via the `@0glabs/0g-serving-broker` SDK.
  The provider returns a signed completion that's verifiable against its
  on-chain attestation report. Default model: `qwen-2.5-7b-instruct` on
  testnet.
- **0G Storage (phase 8)** — every assembled report is uploaded to 0G
  Storage and the merkle rootHash is rendered in the provenance panel.
  Anyone can re-download the JSON and verify it matches the rootHash.
- **0G Chain (phase 9)** — the rootHash is anchored on 0G Newton (chain
  id 16602) by submitting a tx whose calldata is the rootHash. The
  resulting txHash is shown alongside the storage URL.

When the corresponding signing key is missing the adapter short-circuits
to a deterministic stub and the panel labels itself `EMULATED` so the
demo never silently lies about provenance.
