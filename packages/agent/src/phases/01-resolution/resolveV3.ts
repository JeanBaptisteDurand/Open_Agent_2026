import { verified } from "@lplens/core";
import type { Phase1Output, Phase1Pool } from "./types.js";

// Server-shaped row — matches the GraphQL response from the v3 subgraph.
// We accept it via dependency injection so the agent stays free of any
// Express/Node-specific imports.
export interface V3SubgraphPosition {
  id: string;
  owner: string;
  liquidity: string;
  depositedToken0: string;
  depositedToken1: string;
  tickLower: { tickIdx: string };
  tickUpper: { tickIdx: string };
  pool: {
    id: string;
    feeTier: string;
    tickSpacing: string;
    token0: { id: string; symbol: string; decimals: string };
    token1: { id: string; symbol: string; decimals: string };
  };
}

export type V3PositionFetcher = (
  tokenId: string,
) => Promise<V3SubgraphPosition | null>;

export async function resolveV3Position(
  tokenId: string,
  fetcher: V3PositionFetcher,
): Promise<Phase1Output> {
  const raw = await fetcher(tokenId);
  if (!raw) {
    throw new Error(`v3 position ${tokenId} not found in subgraph`);
  }

  const pool: Phase1Pool = {
    address: raw.pool.id,
    feeTier: parseInt(raw.pool.feeTier, 10),
    tickSpacing: parseInt(raw.pool.tickSpacing, 10),
    token0: {
      address: raw.pool.token0.id,
      symbol: raw.pool.token0.symbol,
      decimals: parseInt(raw.pool.token0.decimals, 10),
    },
    token1: {
      address: raw.pool.token1.id,
      symbol: raw.pool.token1.symbol,
      decimals: parseInt(raw.pool.token1.decimals, 10),
    },
  };

  return {
    tokenId,
    version: 3,
    owner: verified(raw.owner, "uniswap-v3-subgraph"),
    pool: verified(pool, "uniswap-v3-subgraph"),
    tickLower: verified(parseInt(raw.tickLower.tickIdx, 10), "uniswap-v3-subgraph"),
    tickUpper: verified(parseInt(raw.tickUpper.tickIdx, 10), "uniswap-v3-subgraph"),
    liquidity: verified(raw.liquidity, "uniswap-v3-subgraph"),
    depositedToken0: verified(raw.depositedToken0, "uniswap-v3-subgraph"),
    depositedToken1: verified(raw.depositedToken1, "uniswap-v3-subgraph"),
  };
}
