import { GraphQLClient } from "graphql-request";
import { config } from "../config.js";
import { logger } from "../logger.js";

const V3_GATEWAY = "https://gateway.thegraph.com/api";

function buildV3Endpoint(): string | null {
  if (!config.THE_GRAPH_KEY) return null;
  const id = "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV";
  return `${V3_GATEWAY}/${config.THE_GRAPH_KEY}/subgraphs/id/${id}`;
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
}

export const subgraph = new SubgraphClient();
