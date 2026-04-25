# subgraph service

Wraps The Graph Network endpoints for Uniswap v3 (v4 added later).

## Env

`THE_GRAPH_KEY` — obtain one at https://thegraph.com/studio/apikeys. The free
tier is sufficient for local development. Without the key the service stays in
a degraded mode (returns empty lists + logs a warning).

## Queries

| Method | Notes |
| --- | --- |
| `getV3PositionsByOwner(owner)` | returns all non-zero-liquidity positions for an owner address, ordered by most recent tx first |

## Gotchas

- `modifyLiquidities` (note the plural) is the v4 alias — v3 uses separate
  Mint and Burn entities. Do not mix them up when adding v4 support.
- Subgraph-returned addresses are lower-case. Always lower-case the incoming
  owner address before querying.
- Free-tier rate limit is around ~100 queries / minute — cache aggressively
  once we move to the full analysis pipeline.
