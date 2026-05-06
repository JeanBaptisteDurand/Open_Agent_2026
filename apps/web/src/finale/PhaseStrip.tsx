// Full-width sticky phase progression bar. Eleven segments, plain-
// English tooltip hovering above the active one. Past phases solid
// healthy-green, active pulses cyan, future muted gray. Sized for
// readability on a Zoom screenshare to a phone — text is min 11px,
// segments are ≥ 56px wide on desktop.

import type { DiagnosticEvent } from "@lplens/core";
import { Mono } from "../design/atoms.js";
import { EASE, PHASE_ORDER, PHASE_SHORT_NAME, PHASE_TOOLTIP } from "./tokens.js";

const PHASES: number[] = [...PHASE_ORDER];

interface Props {
  events: DiagnosticEvent[];
  /** When true, the strip uses absolute positioning (e.g. inside a
   *  finale-section container) instead of sticky page-level. */
  embedded?: boolean;
}

interface Status {
  state: "pending" | "running" | "done";
  startedAt?: number;
}

function buildStatus(events: DiagnosticEvent[]): Map<number, Status> {
  const m = new Map<number, Status>();
  for (const ev of events) {
    if (ev.type === "phase.start") {
      m.set(ev.phase, { state: "running", startedAt: Date.now() });
    } else if (ev.type === "phase.end") {
      m.set(ev.phase, { state: "done" });
    }
  }
  // Backfill: pipeline is sequential, so reaching phase N implies
  // every earlier phase in PHASE_ORDER is settled — even when a phase
  // skips silently (e.g. trading API unconfigured) without emitting
  // start/end. The narrative log still reflects the skip.
  let highestSettledIdx = -1;
  for (let i = 0; i < PHASES.length; i++) {
    const s = m.get(PHASES[i]!)?.state;
    if (s === "running" || s === "done") highestSettledIdx = i;
  }
  for (let i = 0; i < highestSettledIdx; i++) {
    const p = PHASES[i]!;
    if (!m.has(p)) m.set(p, { state: "done" });
  }
  return m;
}

function activePhase(status: Map<number, Status>): number | null {
  for (let i = PHASES.length - 1; i >= 0; i--) {
    const p = PHASES[i]!;
    const s = status.get(p);
    if (s?.state === "running") return p;
  }
  // No running phase — point at the last completed.
  for (let i = PHASES.length - 1; i >= 0; i--) {
    const p = PHASES[i]!;
    const s = status.get(p);
    if (s?.state === "done") return p;
  }
  return null;
}

export function PhaseStrip({ events, embedded = false }: Props) {
  const status = buildStatus(events);
  const active = activePhase(status);
  const tooltip =
    active !== null ? (PHASE_TOOLTIP[active] ?? "") : "Awaiting first event…";

  return (
    <div
      style={{
        position: embedded ? "relative" : "sticky",
        top: embedded ? undefined : 0,
        zIndex: 5,
        background: "rgba(11,11,14,0.92)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border)",
        padding: "12px 24px 14px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--cyan)",
          letterSpacing: "0.06em",
          marginBottom: 10,
          minHeight: 16,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "var(--cyan)",
            boxShadow: "0 0 10px var(--cyan-glow)",
            animation: "pulse-dot 1.4s infinite",
          }}
        />
        <span style={{ color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: 10 }}>
          Live
        </span>
        <Mono color="text" style={{ fontSize: 12 }}>
          {tooltip}
        </Mono>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${PHASES.length}, 1fr)`,
          gap: 6,
        }}
      >
        {PHASES.map((p) => {
          const s = status.get(p);
          const state = s?.state ?? "pending";
          const isActive = p === active;
          const fill =
            state === "done"
              ? "var(--healthy)"
              : state === "running"
                ? "var(--cyan)"
                : "var(--border)";
          return (
            <div
              key={p}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                paddingTop: 2,
              }}
            >
              <div
                style={{
                  height: 4,
                  borderRadius: 999,
                  background: fill,
                  opacity: state === "pending" ? 0.45 : 1,
                  boxShadow:
                    state === "running"
                      ? "0 0 10px var(--cyan-glow)"
                      : state === "done"
                        ? "0 0 8px var(--healthy-glow)"
                        : undefined,
                  animation:
                    state === "running"
                      ? "pulse-soft 1.4s infinite"
                      : undefined,
                  transition: `background 240ms ${EASE.signal}`,
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 6,
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  color: isActive
                    ? "var(--cyan)"
                    : state === "done"
                      ? "var(--text-secondary)"
                      : "var(--text-tertiary)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                <span style={{ color: "var(--text-tertiary)" }}>
                  {p.toString().padStart(2, "0")}
                </span>
                <span style={{ fontWeight: 500 }}>
                  {PHASE_SHORT_NAME[p]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
