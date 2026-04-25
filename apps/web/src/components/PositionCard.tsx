import type { V3PositionRaw } from "../lib/api.js";

interface Props {
  position: V3PositionRaw;
}

export function PositionCard({ position }: Props) {
  const { pool, tickLower, tickUpper, liquidity } = position;
  return (
    <div className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {pool.token0.symbol} / {pool.token1.symbol}
        </h3>
        <span className="text-xs font-mono text-slate-500">
          {(parseInt(pool.feeTier) / 10_000).toFixed(2)}%
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-y-1 text-xs font-mono">
        <dt className="text-slate-500">range</dt>
        <dd>
          {tickLower.tickIdx} → {tickUpper.tickIdx}
        </dd>
        <dt className="text-slate-500">liquidity</dt>
        <dd>{BigInt(liquidity).toLocaleString()}</dd>
      </dl>
    </div>
  );
}
