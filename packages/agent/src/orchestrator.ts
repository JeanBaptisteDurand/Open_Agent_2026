import { computed } from "@lplens/core";
import type { DiagnosticEvent, Labeled } from "@lplens/core";
import {
  resolveV3Position,
  type V3PositionFetcher,
} from "./phases/01-resolution/resolveV3.js";
import type { Phase1Output } from "./phases/01-resolution/types.js";
import {
  computeCurrentAmounts,
  computeIL,
  type ILBreakdown,
} from "./phases/03-il/math.js";

export type Emit = (event: DiagnosticEvent) => void;

export interface AgentDeps {
  fetchV3Position: V3PositionFetcher;
}

export interface Phase3Output {
  hodlValueT1: Labeled<number>;
  lpValueT1: Labeled<number>;
  feesValueT1: Labeled<number>;
  ilT1: Labeled<number>;
  ilPct: Labeled<number>;
}

export async function runPhase1(
  tokenId: string,
  deps: AgentDeps,
  emit: Emit,
): Promise<Phase1Output> {
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

  return position;
}

export async function runPhase3(
  position: Phase1Output,
  emit: Emit,
): Promise<Phase3Output> {
  const t0 = Date.now();
  emit({ type: "phase.start", phase: 3, label: "il reconstruction" });
  emit({ type: "tool.call", tool: "computeIL", input: { tokenId: position.tokenId } });

  const pool = position.pool.value;
  const amounts = computeCurrentAmounts({
    liquidity: position.liquidity.value,
    tickLower: position.tickLower.value,
    tickUpper: position.tickUpper.value,
    currentTick: pool.tick,
    sqrtPriceX96: pool.sqrtPriceX96,
  });

  const il: ILBreakdown = computeIL({
    depositedToken0: position.depositedToken0.value,
    depositedToken1: position.depositedToken1.value,
    collectedFeesToken0: position.collectedFeesToken0.value,
    collectedFeesToken1: position.collectedFeesToken1.value,
    currentAmount0Raw: amounts.amount0,
    currentAmount1Raw: amounts.amount1,
    token0Decimals: pool.token0.decimals,
    token1Decimals: pool.token1.decimals,
    token0Price: pool.token0Price,
  });

  emit({
    type: "tool.result",
    tool: "computeIL",
    output: il,
    latencyMs: Date.now() - t0,
  });
  emit({
    type: "narrative",
    text: `Impermanent loss: ${il.ilT1.toFixed(4)} ${pool.token1.symbol} (${(il.ilPct * 100).toFixed(2)}%) vs HODL. Fees collected so far: ${il.feesValueT1.toFixed(4)} ${pool.token1.symbol}.`,
  });
  emit({ type: "phase.end", phase: 3, durationMs: Date.now() - t0 });

  return {
    hodlValueT1: computed(il.hodlValueT1, "uniswap-v3-whitepaper-eq-6.29-6.30"),
    lpValueT1: computed(il.lpValueT1, "uniswap-v3-whitepaper-eq-6.29-6.30"),
    feesValueT1: computed(il.feesValueT1, "uniswap-v3-subgraph-collected-fees"),
    ilT1: computed(il.ilT1, "uniswap-v3-whitepaper-eq-6.29-6.30"),
    ilPct: computed(il.ilPct, "uniswap-v3-whitepaper-eq-6.29-6.30"),
  };
}
