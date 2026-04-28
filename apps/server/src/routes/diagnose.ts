import type { Request, Response } from "express";
import {
  runPhase1,
  runPhase3,
  runPhase4,
  runPhase5,
  runPhase7,
  runPhase8,
  runPhase9,
  runPhase10,
  runPhase11,
  type EnsPublisher,
  type Quoter,
  type QuoteSummary,
  type ReportAnchorer,
  type ReportUploader,
  type VerdictSynthesizer,
} from "@lplens/agent";
import { fakePhaseSequence } from "../services/diagnoseFake.js";
import { SSEStream } from "../lib/sse.js";
import { logger } from "../logger.js";
import { subgraph } from "../services/subgraph.js";
import { tradingApi } from "../services/tradingApi.js";
import { ogStorage } from "../services/ogStorage.js";
import { ogChain } from "../services/ogChain.js";
import { ogCompute } from "../services/ogCompute.js";
import { ensWriter } from "../services/ensWriter.js";
import { reportCache } from "../services/reportCache.js";

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

    const uploadReport: ReportUploader = async (report) => {
      const result = await ogStorage.upload(report);
      return {
        rootHash: result.rootHash,
        txHash: result.txHash,
        storageUrl: result.storageUrl,
        size: result.size,
        stub: result.stub,
      };
    };

    // Set after runPhase1 resolves so the LPLensReports contract call
    // (when configured) can index the report by tokenId.
    let anchorTokenId: string | undefined;
    const anchorReport: ReportAnchorer = async (rootHash) => {
      const result = await ogChain.anchor(rootHash, anchorTokenId);
      return {
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        chainId: result.chainId,
        explorerUrl: result.explorerUrl,
        stub: result.stub,
      };
    };

    const synthesizeVerdict: VerdictSynthesizer = async (reportJson) => {
      const result = await ogCompute.synthesizeVerdict(reportJson);
      return {
        markdown: result.markdown,
        model: result.model,
        providerAddress: result.providerAddress,
        stub: result.stub,
        latencyMs: result.latencyMs,
      };
    };

    const publishEns: EnsPublisher = async (args) => {
      const result = await ensWriter.publish(args);
      return {
        parentName: result.parentName,
        subnameLabel: result.subnameLabel,
        records: result.records,
        resolverAddress: result.resolverAddress,
        network: result.network,
        stub: result.stub,
      };
    };

    const deps = {
      fetchV3Position: (id: string) => subgraph.getV3PositionById(id),
      fetchPoolHourDatas: (poolId: string, from: number) =>
        subgraph.getV3PoolHourDatas(poolId, from),
      fetchV4HookedPools: (token0: string, token1: string) =>
        subgraph.getV4HookedPoolsByPair(token0, token1),
      quoteSwap,
      uploadReport,
      anchorReport,
      synthesizeVerdict,
      publishEns,
    };

    const position = await runPhase1(tokenId, deps, (event) => sse.emit(event));
    anchorTokenId = position.tokenId;
    const il = await runPhase3(position, (event) => sse.emit(event));
    const regime = await runPhase4(position, deps, (event) => sse.emit(event));
    const hooks = await runPhase5(position, deps, (event) => sse.emit(event));
    const migration = await runPhase7(position, hooks, deps, (event) =>
      sse.emit(event),
    );
    const storage = await runPhase8(
      position,
      { il, regime, hooks, migration },
      deps,
      (event) => sse.emit(event),
    );
    const anchor = await runPhase9(storage, deps, (event) => sse.emit(event));
    const verdict = await runPhase10(storage, deps, (event) => sse.emit(event));
    await runPhase11(
      position,
      { storage, anchor, verdict },
      deps,
      (event) => sse.emit(event),
    );

    if (storage) {
      const provenance = storage.provenance.value;
      reportCache.put({
        rootHash: provenance.rootHash,
        storageUrl: provenance.storageUrl,
        anchorTxHash: anchor?.anchor.value.txHash,
        anchorChainId: anchor?.anchor.value.chainId,
        storageStub: provenance.stub,
        anchorStub: anchor?.anchor.value.stub,
        cachedAt: new Date().toISOString(),
        payload: storage.report.value,
      });
    }

    // Phases 2, 6 — placeholder fake script until each phase is real.
    for await (const event of fakePhaseSequence(tokenId)) {
      if (
        (event.type === "phase.start" || event.type === "phase.end") &&
        (event.phase === 11 ||
          event.phase === 1 ||
          event.phase === 3 ||
          event.phase === 4 ||
          event.phase === 5 ||
          event.phase === 7 ||
          event.phase === 8 ||
          event.phase === 9 ||
          event.phase === 10)
      )
        continue;
      if (
        (event.type === "tool.call" || event.type === "tool.result") &&
        (event.tool === "getPosition" || event.tool === "computeIL")
      )
        continue;
      if (
        event.type === "report.uploaded" ||
        event.type === "report.anchored" ||
        event.type === "verdict.partial" ||
        event.type === "verdict.final"
      )
        continue;
      sse.emit(event);
    }
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
