import type { Request, Response } from "express";
import { runPhase1, runPhase3 } from "@lplens/agent";
import { fakePhaseSequence } from "../services/diagnoseFake.js";
import { SSEStream } from "../lib/sse.js";
import { logger } from "../logger.js";
import { subgraph } from "../services/subgraph.js";

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
    // Phase 1 — real position resolution.
    const position = await runPhase1(
      tokenId,
      { fetchV3Position: (id) => subgraph.getV3PositionById(id) },
      (event) => sse.emit(event),
    );

    // Phase 3 — real IL reconstruction.
    await runPhase3(position, (event) => sse.emit(event));

    // Phases 2, 4-9 — placeholder fake script until each phase is real.
    for await (const event of fakePhaseSequence(tokenId)) {
      // Skip the fake phases we now serve from the real agent.
      if (
        (event.type === "phase.start" || event.type === "phase.end") &&
        (event.phase === 1 || event.phase === 3)
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
