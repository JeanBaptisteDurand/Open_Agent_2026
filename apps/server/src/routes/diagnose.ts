import type { Request, Response } from "express";
import { runPhase1 } from "@lplens/agent";
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
    // Phase 1 — real position resolution from the v3 subgraph.
    await runPhase1(
      tokenId,
      { fetchV3Position: (id) => subgraph.getV3PositionById(id) },
      (event) => sse.emit(event),
    );

    // Phases 2-9 — placeholder fake script until each phase is implemented.
    for await (const event of fakePhaseSequence(tokenId)) {
      // Skip the fake phase 1 — we already emitted the real one above.
      if (
        (event.type === "phase.start" || event.type === "phase.end") &&
        event.phase === 1
      )
        continue;
      if (event.type === "tool.call" && event.tool === "getPosition") continue;
      if (event.type === "tool.result" && event.tool === "getPosition")
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
