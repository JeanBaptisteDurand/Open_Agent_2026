// @lplens/agent — orchestrates the 9-phase diagnostic pipeline.

export type { DiagnosticEvent } from "@lplens/core";
export {
  resolveV3Position,
  type V3PositionFetcher,
  type V3SubgraphPosition,
} from "./phases/01-resolution/resolveV3.js";
export type {
  Phase1Output,
  Phase1Pool,
  Phase1Token,
} from "./phases/01-resolution/types.js";
export {
  computeCurrentAmounts,
  computeIL,
  type CurrentAmounts,
  type ILBreakdown,
} from "./phases/03-il/math.js";
export {
  runPhase1,
  runPhase3,
  type AgentDeps,
  type Emit,
  type Phase3Output,
} from "./orchestrator.js";
