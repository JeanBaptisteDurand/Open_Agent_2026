import { LabelBadge } from "./LabelBadge.js";

// Wire-format shape emitted by the server's `tool.result` for `discoverV4Hooks`.
// Must stay in sync with @lplens/agent's HookCandidate / Phase5Output.
export type HookFamily =
  | "DYNAMIC_FEE_ADVANCED"
  | "SWAP_DELTA_CUT"
  | "MEMECOIN_ROYALTY"
  | "GATED_SWAP"
  | "INIT_GATE"
  | "CUSTOM_LIFECYCLE"
  | "UNKNOWN";

export interface HookCandidate {
  poolId: string;
  hookAddress: string;
  family: HookFamily;
  flagsBitmap: number;
  activeFlags: string[];
  feeTier: number;
  tickSpacing: number;
  tvlUsd: number;
  volumeUsd: number;
  pair: string;
}

export interface HookDiscoveryResult {
  candidates: HookCandidate[];
  topFamily: HookFamily;
  count: number;
}

const FAMILY_TEXT: Record<HookFamily, string> = {
  DYNAMIC_FEE_ADVANCED: "dynamic fee advanced",
  SWAP_DELTA_CUT: "swap delta cut",
  MEMECOIN_ROYALTY: "memecoin royalty",
  GATED_SWAP: "gated swap",
  INIT_GATE: "init gate",
  CUSTOM_LIFECYCLE: "custom lifecycle",
  UNKNOWN: "unknown",
};

const FAMILY_CLS: Record<HookFamily, string> = {
  DYNAMIC_FEE_ADVANCED: "text-cyan-300",
  SWAP_DELTA_CUT: "text-amber-300",
  MEMECOIN_ROYALTY: "text-rose-300",
  GATED_SWAP: "text-emerald-300",
  INIT_GATE: "text-emerald-200",
  CUSTOM_LIFECYCLE: "text-violet-300",
  UNKNOWN: "text-slate-400",
};

function shortAddr(addr: string): string {
  return addr.length > 10
    ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
    : addr;
}

function formatUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

interface Props {
  result: HookDiscoveryResult;
}

export function HooksPanel({ result }: Props) {
  const { candidates, topFamily, count } = result;

  return (
    <section className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-xs uppercase tracking-wider text-slate-500">
          V4 hook candidates
        </h2>
        <LabelBadge label="LABELED" />
      </header>

      {count === 0 ? (
        <p className="mt-3 text-slate-500 text-sm">
          No active V4 hook found for this pair on mainnet.
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm">
            <span className="text-slate-400">{count} hook(s) — top family</span>
            <span className={`ml-2 font-semibold ${FAMILY_CLS[topFamily]}`}>
              {FAMILY_TEXT[topFamily]}
            </span>
          </p>
          <ul className="mt-3 space-y-2">
            {candidates.slice(0, 8).map((c) => (
              <li
                key={c.poolId}
                className="flex items-center justify-between gap-3 text-xs font-mono py-1 border-b border-slate-800 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className={`font-semibold ${FAMILY_CLS[c.family]}`}>
                    {FAMILY_TEXT[c.family]}
                  </div>
                  <div className="text-slate-500 text-[10px] mt-0.5">
                    {shortAddr(c.hookAddress)} · fee{" "}
                    {c.feeTier === 8388608
                      ? "dynamic"
                      : `${(c.feeTier / 10_000).toFixed(2)}%`}
                  </div>
                </div>
                <div className="text-right text-slate-400">
                  <div>{formatUsd(c.tvlUsd)}</div>
                  <div className="text-[10px] text-slate-500">tvl</div>
                </div>
              </li>
            ))}
          </ul>
          {candidates.length > 8 && (
            <p className="mt-2 text-[10px] text-slate-500 text-right">
              + {candidates.length - 8} more
            </p>
          )}
        </>
      )}

      <p className="mt-3 text-[10px] text-slate-500">
        Family inferred from the 14-bit permission flag pattern in each hook
        address — pattern matched against research notes.
      </p>
    </section>
  );
}
