import { useParams } from "react-router-dom";
import { ILPanel, type ILBreakdown } from "../components/ILPanel.js";
import { ToolCallBadge } from "../components/ToolCallBadge.js";
import { TypewriterText } from "../components/TypewriterText.js";
import { useDiagnosticStream } from "../hooks/useDiagnosticStream.js";
import type { DiagnosticEvent } from "@lplens/core";

type ToolEvent = Extract<
  DiagnosticEvent,
  { type: "tool.call" } | { type: "tool.result" }
>;

interface ResolvedPositionOutput {
  pair: string;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
}

function pickToolResult<T>(events: DiagnosticEvent[], tool: string): T | null {
  const ev = events.find(
    (e) => e.type === "tool.result" && e.tool === tool,
  ) as Extract<DiagnosticEvent, { type: "tool.result" }> | undefined;
  return ev ? (ev.output as T) : null;
}

export function Diagnose() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const { events, status, error } = useDiagnosticStream(tokenId ?? null);

  const toolEvents = events.filter(
    (e): e is ToolEvent => e.type === "tool.call" || e.type === "tool.result",
  );
  const narratives = events.filter(
    (e): e is Extract<DiagnosticEvent, { type: "narrative" }> =>
      e.type === "narrative",
  );
  const phaseEvents = events.filter(
    (e): e is Extract<DiagnosticEvent, { type: "phase.start" }> =>
      e.type === "phase.start",
  );

  const resolved = pickToolResult<ResolvedPositionOutput>(events, "getV3Position");
  const ilBreakdown = pickToolResult<ILBreakdown>(events, "computeIL");
  const token1Symbol = resolved?.pair?.split("/")?.[1] ?? "T1";

  return (
    <div className="min-h-screen p-8">
      <header className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold tracking-tight">Diagnose</h1>
        <p className="mt-2 text-slate-400 font-mono text-sm">
          tokenId {tokenId ?? "(missing)"} — stream {status}
        </p>
        {error && <p className="mt-1 text-rose-400 text-sm">{error}</p>}
      </header>

      <main className="max-w-6xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 p-6 rounded-lg border border-slate-700 bg-slate-900/50 min-h-[400px]">
          <h2 className="text-xs uppercase tracking-wider text-slate-500">
            Phases
          </h2>
          <ul className="mt-4 space-y-2 text-sm font-mono">
            {phaseEvents.map((p, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-cyan-300">phase {p.phase}</span>
                <span className="text-slate-300">{p.label}</span>
              </li>
            ))}
            {phaseEvents.length === 0 && (
              <li className="text-slate-500">waiting for first phase…</li>
            )}
          </ul>
          <p className="mt-8 text-slate-500 text-xs">
            React Flow graph wires in a follow-up feature.
          </p>
        </section>

        <aside className="space-y-6">
          {ilBreakdown && (
            <ILPanel breakdown={ilBreakdown} token1Symbol={token1Symbol} />
          )}

          <section className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
            <h2 className="text-xs uppercase tracking-wider text-slate-500">
              Tool calls
            </h2>
            <div className="mt-3 space-y-2">
              {toolEvents.map((ev, i) => (
                <ToolCallBadge key={i} event={ev} />
              ))}
              {toolEvents.length === 0 && (
                <p className="text-slate-500 text-xs">no tool calls yet</p>
              )}
            </div>
          </section>

          <section className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
            <h2 className="text-xs uppercase tracking-wider text-slate-500">
              Narrative
            </h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed min-h-[3rem]">
              {narratives.length === 0 ? (
                <span className="text-slate-500 text-xs">
                  waiting for narrative…
                </span>
              ) : (
                narratives.map((n, i) =>
                  i === narratives.length - 1 ? (
                    <p key={i} className="text-slate-200">
                      <TypewriterText text={n.text} />
                    </p>
                  ) : (
                    <p key={i} className="text-slate-400">
                      {n.text}
                    </p>
                  ),
                )
              )}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
