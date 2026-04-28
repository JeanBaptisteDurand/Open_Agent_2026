# FEEDBACK · Uniswap Developer Platform

This file is required for the **Best Uniswap API integration** prize.
Below is honest, actionable feedback from building LPLens against the
Uniswap Trading API + V3 / V4 subgraphs during the Open Agents 2026
hackathon (Apr 24 – May 3 2026).

## What we used

- **Uniswap Trading API** (`/v1/quote`) — sample-notional swap quoting
  inside phase 7 of the agent (migration preview). Routing
  preference `BEST_PRICE`, `EXACT_INPUT`, slippage 0.5%.
- **Uniswap V3 subgraph** (gateway by The Graph) — position metadata,
  pool state (`sqrtPriceX96`, current tick, token prices), historical
  `poolHourData` (last 30 days for regime classification).
- **Uniswap V4 subgraph** — `Pool` discovery by token-pair, hook
  address extraction, fee tier / tick spacing.
- **`@uniswap/v3-sdk` + `jsbi`** — `SqrtPriceMath.getAmount0Delta` /
  `getAmount1Delta`, `TickMath.getSqrtRatioAtTick` (eq. 6.29 / 6.30 of
  the Uniswap V3 whitepaper) for impermanent-loss reconstruction.

## What worked

- **Trading API `/quote` was a clean experience** — single POST, JSON
  in / JSON out, route legs typed enough to surface to the user
  ("v3-pool", "v4-pool", "v2-pool"). The fact that `quote.route` is
  already a 2D array (multi-leg → multi-pool-per-leg) made it natural
  to render. We didn't even need the `/swap` endpoint to ship the
  preview UI.
- **Subgraph schema is stable** for V3. We could rely on
  `Position.depositedToken0`, `pool.token0Price`, etc. without
  surprises.
- **Routing preference `BEST_PRICE` vs `FASTEST`** was clearly
  documented and the response shape was identical, which let us pick
  it from a config flag without branching code.

## What didn't work (and how we worked around it)

- **`@uniswap/v3-sdk@3.30.0` ESM build is broken on strict Node ESM.**
  Its `dist/esm/src/index.js` does extensionless directory imports
  (`from './entities'`) which Node rejects with
  `ERR_UNSUPPORTED_DIR_IMPORT`. Typecheck passes but the runtime
  crashes on first import. We worked around it with
  `createRequire(import.meta.url)` to load the CJS build — cost us
  ~45 minutes to diagnose. **Suggestion:** ship a working ESM build,
  or document the workaround prominently in the SDK README.
- **V4 subgraph schema docs are partial.** We had to introspect the
  live schema to learn that the modify-liquidity event collection is
  named `modifyLiquidities` (plural) and that `Pool.isExternalLiquidity`
  is not in the public schema yet. **Suggestion:** publish the
  resolved schema in a stable place (today it's only available via
  introspection on the live endpoint).
- **Trading API `/quote` returns `permitData` but not calldata.** We
  expected to be able to render a "Migrate now" button straight from
  the quote, but the `/swap` endpoint is the one that gives signable
  calldata. This is mentioned in the docs but it's not obvious from
  the `/quote` response shape — a comment in the example payload
  saying "to migrate, call `/swap` next with the same body" would have
  saved us a tab.
- **No `/swap` example in the typescript SDK.** The agent stack we
  built is TypeScript-first; we ended up calling the API with raw
  `fetch`. **Suggestion:** publish a `@uniswap/trading-api-client`
  npm package with typed wrappers, or annotate the OpenAPI spec well
  enough that codegen produces something usable.
- **No "fees collected to date" field on V3 `Position` in the
  subgraph** — we computed it from `collectedFeesToken0` /
  `collectedFeesToken1` but those reset on `collect`. The way to get
  total lifetime fees is to walk `Collect` events, which is heavier.
  **Suggestion:** add a derived `lifetimeFeesUsd` / per-token field
  computed at indexing time.

## DX friction & feature requests

- **A "position health" hint in the V3 subgraph** would save every
  builder from reinventing the same in-range / out-of-range / drifting
  classification. Today we read the position's tick range + the pool's
  current tick and decide ourselves. Could be a `tickInRange: bool`
  derived field.
- **Sample wallet addresses with curated positions** in the developer
  docs — for testing, every builder has to find a wallet that holds
  3+ positions of varying health. A "demo wallet" for V3 / V4 with a
  green / amber / red position would speed up a hackathon demo by
  hours.
- **Trading API would benefit from `routes`-only mode** — when the
  agent only wants to surface candidate hops to the user (without
  committing to the swap path), `BEST_PRICE` returns a single best
  route. A flag to return top-K routes would help for agent-side
  reasoning over alternatives.
- **MCP-callable wrapper for the Trading API.** Agents in the wild
  call APIs through MCP servers; an official `@uniswap/mcp` would
  remove a layer that every agent dev otherwise builds themselves.

## Honesty layer note

Every numeric value LPLens renders carries a label
(`VERIFIED` / `COMPUTED` / `ESTIMATED` / `EMULATED` / `LABELED`).
Trading API quote results are surfaced as `EMULATED` because the
agent never executes the swap — the user signs at migration time
with their own slippage budget. We hope this pattern (UI labels
reflecting the trust level of the underlying source) lands as
broader convention for agent + DEX integrations.

— Jean-Baptiste Durand
