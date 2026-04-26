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

The `<LabelBadge label="..." />` component renders these consistently. The
diagnose page surfaces VERIFIED + COMPUTED + ESTIMATED + LABELED in the
header today; EMULATED lands when phase 6 hook replay ships.

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Atlas — wallet input, list of LP positions, sample-address shortcut |
| `/diagnose/:tokenId` | Live SSE diagnostic — phases, IL panel, regime panel, hooks panel, narrative |

## Components

| Component | Used by | Notes |
| --- | --- | --- |
| `LabelBadge` | header, panels | renders the 5 honesty labels |
| `ILPanel` | diagnose page | HODL / LP / fees / vs HODL with COMPUTED label |
| `RegimePanel` | diagnose page | mean-reverting / trending / toxic / JIT scores with ESTIMATED label |
| `HooksPanel` | diagnose page | candidate V4 hooks for the pair, family-coloured, with LABELED tag |
| `FlagBitChips` | hooks panel detail | 14-bit permission flag visualisation |
| `PositionCard` | atlas | green/amber/red traffic light + click-to-diagnose link |
| `ToolCallBadge` | diagnose page | tool.call / tool.result events badge |
| `TypewriterText` | diagnose page | typewriter animation for live narrative |
