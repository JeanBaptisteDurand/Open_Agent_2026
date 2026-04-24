import { GraphQLClient } from "graphql-request";
import { config } from "../config.js";
import { logger } from "../logger.js";

const V3_GATEWAY = "https://gateway.thegraph.com/api";

function buildV3Endpoint(): string | null {
  if (!config.THE_GRAPH_KEY) return null;
  const id = "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV";
  return `${V3_GATEWAY}/${config.THE_GRAPH_KEY}/subgraphs/id/${id}`;
}

const POSITIONS_BY_OWNER_V3 = /* GraphQL */ `
  query PositionsByOwner($owner: Bytes!) {
    positions(
      where: { owner: $owner, liquidity_gt: "0" }
      first: 100
      orderBy: transaction__timestamp
      orderDirection: desc
    ) {
      id
      owner
      liquidity
      depositedToken0
      depositedToken1
      collectedFeesToken0
      collectedFeesToken1
      tickLower {
        tickIdx
      }
      tickUpper {
        tickIdx
      }
      pool {
        id
        feeTier
        tickSpacing
        token0 {
          id
          symbol
          decimals
        }
        token1 {
          id
          symbol
          decimals
        }
      }
    }
  }
`;

export interface V3PositionRaw {
  id: string;
  owner: string;
  liquidity: string;
  depositedToken0: string;
  depositedToken1: string;
  collectedFeesToken0: string;
  collectedFeesToken1: string;
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

export class SubgraphClient {
  private readonly v3: GraphQLClient | null;

  constructor() {
    const v3Endpoint = buildV3Endpoint();
    this.v3 = v3Endpoint ? new GraphQLClient(v3Endpoint) : null;
    if (!this.v3) {
      logger.warn("THE_GRAPH_KEY not set — subgraph queries will return empty");
    }
  }

  isReady(): boolean {
    return this.v3 !== null;
  }

  async getV3PositionsByOwner(owner: string): Promise<V3PositionRaw[]> {
    if (!this.v3) return [];
    const data = await this.v3.request<{ positions: V3PositionRaw[] }>(
      POSITIONS_BY_OWNER_V3,
      { owner: owner.toLowerCase() },
    );
    return data.positions;
  }
}

export const subgraph = new SubgraphClient();
