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

## Routes

| Path | Purpose |
| --- | --- |
| `/` | Atlas — wallet input, list of LP positions, sample-address shortcut |
| `/diagnose/:tokenId` | Live SSE diagnostic — graph, panels, tool calls, narrative |

## Components

| Component | Used by | Notes |
| --- | --- | --- |
| `LabelBadge` | header, panels | renders the 5 honesty labels |
| `DiagnosticGraph` | diagnose page | React Flow graph fed by SSE phase events |
| `ILPanel` | diagnose page | HODL / LP / fees / vs HODL with COMPUTED label |
| `RegimePanel` | diagnose page | mean-reverting / trending / toxic / JIT scores with ESTIMATED label |
| `HooksPanel` | diagnose page | candidate V4 hooks, family-coloured, with LABELED tag |
| `FlagBitChips` | hooks panel detail | 14-bit permission flag visualisation |
| `PositionCard` | atlas | green/amber/red traffic light + click-to-diagnose link |
| `ToolCallBadge` | diagnose page | tool.call / tool.result events badge |
| `TypewriterText` | diagnose page | typewriter animation for live narrative |

## End-to-end tests

Smoke-level Playwright tests live in `tests/e2e/`. They cover :

- atlas page renders the LPLens header + form
- diagnose page renders for a synthetic tokenId
- the React Flow graph container mounts
- the server `/health` endpoint responds with `status: ok`

The Playwright `webServer` config boots `@lplens/server` and `@lplens/web`
on demand. Run :

```bash
pnpm --filter @lplens/web run test:e2e:install   # one-off browser install
pnpm --filter @lplens/web run test:e2e
```

Tests are intentionally structural so they stay green even when the live
subgraph rate-limits — they validate that the app boots and routes render.
