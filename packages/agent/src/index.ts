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
export { runPhase1, type AgentDeps, type Emit } from "./orchestrator.js";
