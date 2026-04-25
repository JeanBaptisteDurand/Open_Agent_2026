import { Link } from "react-router-dom";
import type { V3PositionRaw } from "../lib/api.js";
import { classifyHealth, HEALTH_COLORS } from "../lib/health.js";

interface Props {
  position: V3PositionRaw;
}

export function PositionCard({ position }: Props) {
  const { pool, tickLower, tickUpper, liquidity } = position;
  const health = classifyHealth(position);

  return (
    <Link
      to={`/diagnose/${position.id}`}
      className="block p-4 rounded-lg border border-slate-700 bg-slate-900/50 hover:border-cyan-500/40 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">
          {pool.token0.symbol} / {pool.token1.symbol}
        </h3>
        <span
          className={`px-2 py-0.5 text-xs font-mono rounded border ${HEALTH_COLORS[health]}`}
        >
          {health}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-y-1 text-xs font-mono">
        <dt className="text-slate-500">fee tier</dt>
        <dd>{(parseInt(pool.feeTier) / 10_000).toFixed(2)}%</dd>
        <dt className="text-slate-500">range</dt>
        <dd>
          {tickLower.tickIdx} → {tickUpper.tickIdx}
        </dd>
        <dt className="text-slate-500">liquidity</dt>
        <dd>{BigInt(liquidity).toLocaleString()}</dd>
      </dl>
    </Link>
  );
}
