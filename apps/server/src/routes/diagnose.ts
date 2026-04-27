import type { Request, Response } from "express";
import {
  runPhase1,
  runPhase3,
  runPhase4,
  runPhase5,
  runPhase7,
  type Quoter,
  type QuoteSummary,
} from "@lplens/agent";
import { fakePhaseSequence } from "../services/diagnoseFake.js";
import { SSEStream } from "../lib/sse.js";
import { logger } from "../logger.js";
import { subgraph } from "../services/subgraph.js";
import { tradingApi } from "../services/tradingApi.js";

export async function diagnoseHandler(
  req: Request<{ tokenId: string }>,
  res: Response,
): Promise<void> {
  const { tokenId } = req.params;
  const sse = new SSEStream(res);

  req.on("close", () => {
    logger.info(`diagnose stream closed by client (tokenId=${tokenId})`);
  });

  // Preflight phase 0 — subgraph readiness banner.
  sse.emit({
    type: "phase.start",
    phase: 0,
    label: subgraph.isReady() ? "subgraph ready" : "subgraph degraded",
  });
  sse.emit({ type: "phase.end", phase: 0, durationMs: 0 });

  try {
    const quoteSwap: Quoter | undefined = tradingApi.isReady()
      ? async (args): Promise<QuoteSummary | null> => {
          try {
            const r = await tradingApi.quote({
              tokenIn: args.tokenIn,
              tokenOut: args.tokenOut,
              amount: args.amount,
              chainId: args.chainId,
              swapper: args.swapper,
            });
            return {
              routing: r.routing,
              route: r.quote.route,
              input: r.quote.input,
              output: {
                amount: r.quote.output.amount,
                token: r.quote.output.token,
              },
              slippage: r.quote.slippage,
              priceImpact: r.quote.priceImpact,
              gasFeeUSD: r.quote.gasFeeUSD,
            };
          } catch (err) {
            logger.error(
              `tradingApi.quote failed: ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
            return null;
          }
        }
      : undefined;

    const deps = {
      fetchV3Position: (id: string) => subgraph.getV3PositionById(id),
      fetchPoolHourDatas: (poolId: string, from: number) =>
        subgraph.getV3PoolHourDatas(poolId, from),
      fetchV4HookedPools: (token0: string, token1: string) =>
        subgraph.getV4HookedPoolsByPair(token0, token1),
      quoteSwap,
    };

    const position = await runPhase1(tokenId, deps, (event) => sse.emit(event));
    await runPhase3(position, (event) => sse.emit(event));
    await runPhase4(position, deps, (event) => sse.emit(event));
    const hookResult = await runPhase5(position, deps, (event) => sse.emit(event));
    await runPhase7(position, hookResult, deps, (event) => sse.emit(event));

    // Phases 2, 6, 8, 9 — placeholder fake script until each phase is real.
    for await (const event of fakePhaseSequence(tokenId)) {
      if (
        (event.type === "phase.start" || event.type === "phase.end") &&
        (event.phase === 1 ||
          event.phase === 3 ||
          event.phase === 4 ||
          event.phase === 5 ||
          event.phase === 7)
      )
        continue;
      if (
        (event.type === "tool.call" || event.type === "tool.result") &&
        (event.tool === "getPosition" || event.tool === "computeIL")
      )
        continue;
      sse.emit(event);
    }

    sse.emit({
      type: "report.uploaded",
      rootHash: "0x00",
      storageUrl: "stub",
    });
  } catch (err) {
    logger.error(
      `diagnose stream errored for ${tokenId}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    sse.emit({
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    });
  } finally {
    sse.close();
  }
}
