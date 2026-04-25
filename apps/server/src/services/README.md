# subgraph service

Wraps The Graph Network endpoints for Uniswap v3 and v4.

## Env

`THE_GRAPH_KEY` — obtain one at https://thegraph.com/studio/apikeys. The free
tier is sufficient for local development. Without the key the service stays in
a degraded mode (returns empty lists + logs a warning).

## Queries

| Method | Notes |
| --- | --- |
| `getV3PositionsByOwner(owner)` | returns all non-zero-liquidity v3 positions for an owner address |
| `getV3PositionById(tokenId)` | resolves a single v3 position by tokenId for phase 1 |
| `getV4ModifyLiquiditiesByOrigin(origin)` | returns the raw `modifyLiquidities` event stream initiated by an EOA in v4 |

## V4 caveats

- The plural is `modifyLiquidities` (note the `ies`) in the live v4 subgraph.
- The event has no `owner` field — `sender` is always the PositionManager
  contract, so user identity must be looked up via `origin` (EOA).
- `amount` is a signed `BigInt` (positive = add liquidity, negative = remove).
  Net liquidity per position is the sum.
- `salt` (which would disambiguate multiple positions in the same range for
  the same EOA) is not exposed by the deployed v4-subgraph at the moment.
  We aggregate by `(pool, tickLower, tickUpper)` as a coarse approximation.
- `Pool.hooks` is the address of the V4 hook contract attached to the pool;
  `0x000…000` means no hook.
- `Pool.isExternalLiquidity` is in the v4-subgraph main branch but not in the
  deployed schema yet — do not query it.

## Gotchas (general)

- Subgraph-returned addresses are lower-case. Always lower-case the incoming
  owner / origin address before querying.
- Free-tier rate limit is around ~100 queries / minute — cache aggressively
  once we move to the full analysis pipeline.
