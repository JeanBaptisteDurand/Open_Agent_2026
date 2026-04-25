import cors from "cors";
import express, { type Request, type Response } from "express";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { diagnoseHandler } from "./routes/diagnose.js";
import { subgraph } from "./services/subgraph.js";
import { deriveV4Positions } from "./services/v4Aggregator.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "lplens-server",
    env: config.NODE_ENV,
    subgraph: subgraph.isReady() ? "ready" : "no-api-key",
    subgraphV4: subgraph.isReadyV4() ? "ready" : "no-api-key",
  });
});

app.get<{ address: string }>(
  "/api/positions/:address",
  async (req, res) => {
    const { address } = req.params;
    try {
      const positions = await subgraph.getV3PositionsByOwner(address);
      res.json({ address, version: 3, positions });
    } catch (err) {
      logger.error(
        `subgraph getV3PositionsByOwner failed for ${address}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      res.status(502).json({ error: "subgraph unavailable" });
    }
  },
);

app.get<{ address: string }>(
  "/api/positions/v4/:address",
  async (req, res) => {
    const { address } = req.params;
    try {
      const events = await subgraph.getV4ModifyLiquiditiesByOrigin(address);
      const derived = deriveV4Positions(events).map((p) => ({
        ...p,
        netLiquidity: p.netLiquidity.toString(),
      }));
      res.json({ address, version: 4, positions: derived });
    } catch (err) {
      logger.error(
        `subgraph getV4ModifyLiquiditiesByOrigin failed for ${address}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      res.status(502).json({ error: "subgraph v4 unavailable" });
    }
  },
);

app.get<{ tokenId: string }>("/api/diagnose/:tokenId", diagnoseHandler);

app.listen(config.PORT, () => {
  logger.info(`lplens-server listening on :${config.PORT}`);
});
