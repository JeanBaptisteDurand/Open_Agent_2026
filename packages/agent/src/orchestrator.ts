import type { DiagnosticEvent } from "@lplens/core";
import {
  resolveV3Position,
  type V3PositionFetcher,
} from "./phases/01-resolution/resolveV3.js";

export type Emit = (event: DiagnosticEvent) => void;

export interface AgentDeps {
  fetchV3Position: V3PositionFetcher;
}

// Runs phase 1 today; the rest of the pipeline is filled in subsequent PRs.
// Phases 2-9 are emitted from a fake script downstream so the demo stays
// end-to-end while real implementations land.
export async function runPhase1(
  tokenId: string,
  deps: AgentDeps,
  emit: Emit,
): Promise<void> {
  const t0 = Date.now();
  emit({ type: "phase.start", phase: 1, label: "position resolution" });
  emit({ type: "tool.call", tool: "getV3Position", input: { tokenId } });

  const position = await resolveV3Position(tokenId, deps.fetchV3Position);

  emit({
    type: "tool.result",
    tool: "getV3Position",
    output: {
      pair: `${position.pool.value.token0.symbol}/${position.pool.value.token1.symbol}`,
      tickLower: position.tickLower.value,
      tickUpper: position.tickUpper.value,
      liquidity: position.liquidity.value,
    },
    latencyMs: Date.now() - t0,
  });
  emit({
    type: "narrative",
    text: `Found ${position.pool.value.token0.symbol}/${position.pool.value.token1.symbol} V${position.version} position with liquidity ${position.liquidity.value}.`,
  });
  emit({ type: "phase.end", phase: 1, durationMs: Date.now() - t0 });
}
