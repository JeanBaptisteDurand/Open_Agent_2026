# @lplens/agent

The diagnostic pipeline. Each phase is a small, isolated step that emits
typed `DiagnosticEvent`s; the route runs them in this order: 1, 3, 4, 5,
6, 7, **10 (verdict)**, 8 (report assembly + storage), 9 (chain anchor),
11 (ENS publish). Phase 10 runs before 8 so the broker attestation is
embedded in the rootHash-anchored report payload.

## Status

| Phase | Status | Notes |
| --- | --- | --- |
| 0 — preflight | served from server (subgraph status) | not strictly an agent phase |
| 1 — position resolution | **implemented** | v3 only, via `resolveV3Position` |
| 1.5 — pool RAG | TODO | pgvector lookup over historical regime notes |
| 2 — AI planning | TODO | 0G Compute TEE plan generation |
| 3 — IL reconstruction | TODO | whitepaper eq. 6.29/6.30 via @uniswap/v3-sdk |
| 4 — regime classification | TODO | mean-reverting / trending / toxic / JIT-dominated |
| 5 — V4 hook discovery | TODO | dedupe Pool.hooks + curated registry |
| 6 — hook scoring | **implemented** | family-multiplier scoring against pool history (heuristic, not EVM-state replay) |
| 7 — migration plan | TODO | Permit2 bundle via Trading API |
| 8 — verdict | TODO | LLM markdown + hallucination validator |
| 9 — report signing | TODO | TEE signature + 0G Storage upload |

## Honesty

Every numeric value the agent emits is wrapped in `Labeled<T>` with a label
of `VERIFIED | COMPUTED | ESTIMATED | EMULATED | LABELED`. Phase 6 results
are always `EMULATED` and carry a non-empty `warnings[]`. The scoring
engine surfaces its assumption surface (family multipliers) on every
result so the panel can render the calibration that produced the score.
