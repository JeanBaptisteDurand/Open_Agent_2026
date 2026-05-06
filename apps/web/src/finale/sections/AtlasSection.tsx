// /finale Section 2 — Atlas with the bleeding wallet pinned. Single
// hero card with a narrative overlay always visible (no hover-only
// reveal — this needs to land in 30 seconds on a Zoom screenshare).

import { Mono } from "../../design/atoms.js";

interface AtlasSectionProps {
  onDiagnose: () => void;
}

export function AtlasSection({ onDiagnose }: AtlasSectionProps) {
  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 28,
        padding: "72px 64px",
        maxWidth: 1480,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 24, height: 1, background: "var(--bleed)" }} />
        <span
          style={{
            color: "var(--bleed)",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          BLEEDING · WALLET 0x8f4d…e95
        </span>
      </div>
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: "clamp(40px, 5.6vw, 72px)",
          fontWeight: 500,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          color: "var(--text)",
          maxWidth: 1080,
        }}
      >
        Deposited <span style={{ color: "var(--cyan)" }}>$20,000</span> on Apr 17.
        <br />
        Today: <span style={{ color: "var(--bleed)" }}>$17,640</span>.{" "}
        <span style={{ color: "var(--text-secondary)" }}>Why?</span>
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 28,
          alignItems: "stretch",
        }}
      >
        {/* Hero card */}
        <button
          onClick={onDiagnose}
          style={{
            position: "relative",
            padding: "28px 32px",
            borderRadius: 14,
            background:
              "linear-gradient(135deg, rgba(255,94,79,0.10) 0%, var(--surface) 60%)",
            border: "1px solid rgba(255,94,79,0.35)",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            textAlign: "left",
            color: "inherit",
            font: "inherit",
            overflow: "hidden",
            animation: "pulse-soft 2.4s infinite",
          }}
        >
          {/* Sweep band */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background:
                "linear-gradient(90deg, transparent, rgba(255,94,79,0.7), transparent)",
              backgroundSize: "200% 100%",
              animation: "bleed-sweep 4s linear infinite",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.14em",
                color: "var(--bleed)",
                textTransform: "uppercase",
              }}
            >
              ● POSITION #605311 — USDC / WETH 0.05%
            </span>
            <Mono color="text-tertiary" style={{ fontSize: 10 }}>
              tickRange · 23 below current
            </Mono>
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 64,
              fontWeight: 500,
              color: "var(--bleed)",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              textShadow: "0 0 24px rgba(255,94,79,0.2)",
            }}
          >
            −$2,360
          </div>
          <Mono color="text-tertiary" style={{ fontSize: 12, letterSpacing: "0.06em" }}>
            IL dominant · fee capture starved · out of range 23 ticks below
          </Mono>
          <div
            style={{
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              borderRadius: 10,
              border: "1px dashed rgba(255,176,32,0.5)",
              background: "rgba(255,176,32,0.05)",
              gap: 14,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "var(--cyan)",
                boxShadow: "0 0 10px var(--cyan-glow)",
                animation: "pulse-dot 1.4s infinite",
              }}
            />
            <span
              style={{
                flex: 1,
                fontFamily: "var(--font-display)",
                fontSize: 18,
                fontWeight: 500,
                color: "var(--text)",
              }}
            >
              DIAGNOSE THIS POSITION
            </span>
            <Mono color="cyan" style={{ fontSize: 14 }}>
              ⏎ space
            </Mono>
          </div>
        </button>

        {/* Aggregate stats */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: "auto auto auto",
            gap: 14,
          }}
        >
          <AggCell
            label="DEPOSITED"
            value="$20,000"
            sub="Apr 17 2026 · 10 positions"
          />
          <AggCell
            label="FEES CAPTURED"
            value="$402"
            sub="2.0% — way under benchmark"
            tone="toxic"
          />
          <AggCell
            label="OUT OF RANGE"
            value="10 / 10"
            sub="100% bleeding · 0 healthy"
            tone="bleed"
          />
        </div>
      </div>
    </div>
  );
}

interface AggCellProps {
  label: string;
  value: string;
  sub: string;
  tone?: "cyan" | "toxic" | "bleed" | "healthy";
}

function AggCell({ label, value, sub, tone = "cyan" }: AggCellProps) {
  return (
    <div
      style={{
        padding: "20px 22px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <Mono color="text-tertiary" style={{ fontSize: 10, letterSpacing: "0.16em" }}>
        {label}
      </Mono>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 36,
          fontWeight: 500,
          color: `var(--${tone})`,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <Mono color="text-secondary" style={{ fontSize: 12 }}>
        {sub}
      </Mono>
    </div>
  );
}
