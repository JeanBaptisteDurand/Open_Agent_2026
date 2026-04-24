import cors from "cors";
import express, { type Request, type Response } from "express";
import { config } from "./config.js";
import { logger } from "./logger.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "lplens-server", env: config.NODE_ENV });
});

app.get("/api/positions/:address", (req: Request, res: Response) => {
  // Stub — wired against the Uniswap subgraph later.
  res.json({ address: req.params.address, positions: [], note: "stub — wiring subgraph next" });
});

app.listen(config.PORT, () => {
  logger.info(`lplens-server listening on :${config.PORT}`);
});
