// Vertical snap-scroll container for the /finale kiosk. Each child is
// expected to wrap a <section data-finale-beat="N"> so the presenter
// utility can scroll programmatically. Adds a presenter chrono +
// beat indicator in the top-right when ?presenter=true.

import type { CSSProperties, ReactNode, MutableRefObject } from "react";
import { Mono } from "../design/atoms.js";
import { fmtChrono, type usePresenter } from "./presenter.js";
import { FINALE_BEATS } from "./tokens.js";

type PresenterState = ReturnType<typeof usePresenter>;

interface SnapScrollProps {
  presenter?: PresenterState;
  active: boolean;
  children: ReactNode;
  scrollRef: MutableRefObject<HTMLDivElement | null>;
}

const containerStyle: CSSProperties = {
  height: "100vh",
  width: "100%",
  overflowY: "scroll",
  scrollSnapType: "y mandatory",
  scrollBehavior: "smooth",
  position: "relative",
};

export function SnapScroll({
  presenter,
  active,
  children,
  scrollRef,
}: SnapScrollProps) {
  return (
    <div
      ref={scrollRef}
      data-finale-scroll
      style={containerStyle}
    >
      {active && presenter && <PresenterOverlay presenter={presenter} />}
      {children}
    </div>
  );
}

interface BeatSectionProps {
  index: number;
  id: string;
  children: ReactNode;
  background?: string;
  /** When true, removes the snap-stop, useful for sections shorter than 100vh. */
  noSnap?: boolean;
}

export function BeatSection({
  index,
  id,
  children,
  background,
  noSnap,
}: BeatSectionProps) {
  return (
    <section
      data-finale-beat={index}
      data-beat-id={id}
      style={{
        minHeight: "100vh",
        scrollSnapAlign: noSnap ? "none" : "start",
        position: "relative",
        background: background ?? "transparent",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </section>
  );
}

function PresenterOverlay({ presenter }: { presenter: PresenterState }) {
  const total = FINALE_BEATS.length;
  const remaining = fmtChrono(presenter.remainingMs);
  const elapsedSec = Math.floor(presenter.elapsedMs / 1000);
  const overrun = presenter.remainingMs <= 0;
  return (
    <>
      {/* Top-right chrono */}
      <div
        style={{
          position: "fixed",
          top: 12,
          right: 16,
          zIndex: 20,
          padding: "8px 12px",
          borderRadius: 8,
          background: "rgba(8,8,12,0.85)",
          border: "1px solid var(--border-strong)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: overrun ? "var(--bleed)" : "var(--cyan)",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          letterSpacing: "0.04em",
          boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: presenter.running ? "var(--bleed)" : "var(--text-tertiary)",
            animation: presenter.running ? "pulse-dot 1.2s infinite" : undefined,
          }}
        />
        <span>{remaining}</span>
        <span style={{ color: "var(--text-tertiary)", fontSize: 10 }}>
          / 5:00
        </span>
        <span style={{ color: "var(--text-tertiary)", fontSize: 10 }}>
          {elapsedSec}s elapsed
        </span>
      </div>

      {/* Top-left beat indicator + roadmap */}
      <div
        style={{
          position: "fixed",
          top: 12,
          left: 16,
          zIndex: 20,
          padding: "8px 12px",
          borderRadius: 8,
          background: "rgba(8,8,12,0.85)",
          border: "1px solid var(--border-strong)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--text-secondary)",
          maxWidth: "min(74vw, 720px)",
          overflow: "hidden",
        }}
      >
        <Mono color="cyan">
          {(presenter.beat + 1).toString().padStart(2, "0")} / {total.toString().padStart(2, "0")}
        </Mono>
        <span style={{ color: "var(--text)" }}>
          {FINALE_BEATS[presenter.beat]?.label ?? ""}
        </span>
        <span
          style={{
            display: "flex",
            gap: 4,
            alignItems: "center",
            opacity: 0.8,
          }}
        >
          {FINALE_BEATS.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === presenter.beat ? 18 : 6,
                height: 4,
                borderRadius: 999,
                background:
                  i < presenter.beat
                    ? "var(--healthy)"
                    : i === presenter.beat
                      ? "var(--cyan)"
                      : "var(--border-strong)",
                transition: "width 240ms cubic-bezier(0.2,0.8,0.2,1)",
              }}
            />
          ))}
        </span>
        <span style={{ color: "var(--text-tertiary)", fontSize: 10 }}>
          space · ← → · f · r
        </span>
      </div>
    </>
  );
}
