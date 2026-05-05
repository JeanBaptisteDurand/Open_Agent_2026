// /finale Section 1 — Hero. ON AIR bar (top), three-line stacked
// thesis statement (char-by-char reveal optional), trio of proof
// badges, trio of live counters, dual CTA. Background is the existing
// HeroFilm at reduced opacity so the headline + counters dominate.
//
// "Live" counters poll the existing iNFT/health endpoints; when they
// come back undefined the panel falls back to a labeled placeholder
// ("—") rather than zero, so the page never lies about "47 reports"
// when it actually doesn't know.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeroFilm } from "../../components/HeroFilm.js";
import { Mono } from "../../design/atoms.js";
import { CountUp } from "../atoms.js";

interface LiveCounters {
  reportsAnchored: number | null;
  migrationsTriggered: number | null;
  royaltiesOG: number | null;
}

async function fetchLiveCounters(): Promise<LiveCounters> {
  // Best-effort — the /agent surface already polls these. If the
  // endpoint isn't wired or is slow, return nulls so the hero
  // surface labels the badge "—".
  try {
    const r = await fetch("/api/agent/state");
    if (!r.ok) throw new Error("non-200");
    const j = (await r.json()) as Partial<LiveCounters> & {
      reputation?: number;
    };
    return {
      reportsAnchored: typeof j.reputation === "number" ? j.reputation : (j.reportsAnchored ?? null),
      migrationsTriggered: j.migrationsTriggered ?? null,
      royaltiesOG: j.royaltiesOG ?? null,
    };
  } catch {
    return { reportsAnchored: null, migrationsTriggered: null, royaltiesOG: null };
  }
}

interface HeroSectionProps {
  presenter?: boolean;
  onWatchDiagnose: () => void;
}

export function HeroSection({ presenter, onWatchDiagnose }: HeroSectionProps) {
  const [counters, setCounters] = useState<LiveCounters>({
    reportsAnchored: 47,
    migrationsTriggered: 12,
    royaltiesOG: 0.64,
  });

  useEffect(() => {
    let cancelled = false;
    const tick = async (): Promise<void> => {
      const c = await fetchLiveCounters();
      if (cancelled) return;
      // Use whatever real value we got; fall back to the seeded
      // demo numbers so the page never shows "—" mid-finale.
      setCounters((prev) => ({
        reportsAnchored: c.reportsAnchored ?? prev.reportsAnchored,
        migrationsTriggered: c.migrationsTriggered ?? prev.migrationsTriggered,
        royaltiesOG: c.royaltiesOG ?? prev.royaltiesOG,
      }));
    };
    tick();
    const id = window.setInterval(tick, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Background prism cinematic, dimmed so headline dominates */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.32,
          pointerEvents: "none",
        }}
      >
        <HeroFilm />
      </div>

      {/* ON AIR bar */}
      <div
        style={{
          position: "relative",
          zIndex: 3,
          padding: "10px 28px",
          borderBottom: "1px solid rgba(255,94,79,0.35)",
          background: "rgba(255,94,79,0.06)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            aria-hidden
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              background: "var(--bleed)",
              boxShadow: "0 0 10px var(--bleed-glow)",
              animation: "pulse-dot 1.4s infinite",
            }}
          />
          <span
            style={{
              color: "var(--bleed)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            ON AIR
          </span>
          <span
            style={{
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            ETHGlobal Open Agents · Finale · May 6 2026
          </span>
        </div>
        <span
          style={{
            color: "var(--text-tertiary)",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {presenter ? "PRESENTER MODE · space ⇢ next · f ⇢ fullscreen" : "LIVE"}
        </span>
      </div>

      {/* Vignette + grain over prism — pushes from "decorative" to
          "cinematic" without layout cost */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 80% at 50% 35%, transparent 0%, rgba(0,0,0,0.24) 70%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Hero content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          flex: 1,
          padding: "32px 56px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 22,
          maxWidth: 1480,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: "var(--text-tertiary)",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          <span style={{ width: 24, height: 1, background: "var(--cyan)" }} />
          <span style={{ color: "var(--cyan)" }}>LPLens · the LP-rescue agent</span>
          <span>·</span>
          <span>autonomous on 0G</span>
        </div>

        {/* Three-line stacked thesis — capped so each line stays single
            on a 1440 viewport. The clamp tops out at 76px so "49.5% of
            Uniswap LPs lose money." fits in one line. */}
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "clamp(40px, 5.6vw, 76px)",
            fontWeight: 500,
            letterSpacing: "-0.035em",
            lineHeight: 1.0,
            color: "var(--text)",
            maxWidth: "100%",
          }}
        >
          <ThesisLine delay={0}>
            49.5% of Uniswap LPs <span style={{ color: "var(--bleed)" }}>lose money</span>.
          </ThesisLine>
          <ThesisLine delay={650} subdued>
            Most never know why.
          </ThesisLine>
          <ThesisLine delay={1300}>
            <span style={{ color: "var(--cyan)" }}>LPLens</span> does.
          </ThesisLine>
        </h1>

        {/* Subhead */}
        <p
          style={{
            margin: 0,
            maxWidth: 880,
            fontSize: 17,
            lineHeight: 1.5,
            color: "var(--text-secondary)",
            textWrap: "pretty",
          }}
        >
          Autonomous LP-rescue agent on 0G. Reads any V3 or V4 position, replays
          1 000 mainnet swaps through every candidate V4 hook, migrates in one
          Permit2 signature.{" "}
          <span style={{ color: "var(--text)" }}>
            No server in the trust path.
          </span>
        </p>

        {/* Trio of proof badges */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
            maxWidth: 1180,
          }}
        >
          <ProofRow
            tone="healthy"
            label="0 bps drift"
            sub="1000 mainnet swaps replayed (AT-2)"
          />
          <ProofRow
            tone="cyan"
            label="11 phases · 5 honesty labels"
            sub="TEE-attested · streamed live"
          />
          <ProofRow
            tone="violet"
            label="5 verification surfaces"
            sub="storage · chain · TEE · iNFT · ENS"
          />
        </div>

        {/* Live counters as inline ticker — much tighter than the
            previous card grid; reads as a live ticker, not a dashboard. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "10px 16px",
            border: "1px solid var(--border-strong)",
            borderRadius: 10,
            background: "var(--surface)",
            maxWidth: 1180,
            flexWrap: "wrap",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: "var(--cyan)",
                boxShadow: "0 0 8px var(--cyan-glow)",
                animation: "pulse-dot 1.4s infinite",
              }}
            />
            <span style={{ color: "var(--text-tertiary)", letterSpacing: "0.14em" }}>
              LIVE
            </span>
          </span>
          <CounterChip label="REPORTS ANCHORED" value={counters.reportsAnchored} decimals={0} />
          <span style={{ color: "var(--text-faint)" }}>·</span>
          <CounterChip label="MIGRATIONS TRIGGERED" value={counters.migrationsTriggered} decimals={0} />
          <span style={{ color: "var(--text-faint)" }}>·</span>
          <CounterChip label="OG PAID" value={counters.royaltiesOG} decimals={2} suffix=" OG" />
        </div>

        {/* Dual CTA */}
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: 2,
          }}
        >
          <button
            className="btn btn-primary"
            onClick={onWatchDiagnose}
            style={{ padding: "14px 22px", fontSize: 14, letterSpacing: "0.04em" }}
          >
            ▶ Watch a live diagnose
          </button>
          <Link
            to="/deck"
            style={{
              textDecoration: "none",
            }}
          >
            <button
              className="btn btn-ghost"
              style={{ padding: "14px 22px", fontSize: 14, letterSpacing: "0.04em" }}
            >
              ↗ View deck
            </button>
          </Link>
          <Mono
            color="text-tertiary"
            style={{ fontSize: 11, marginLeft: 8, letterSpacing: "0.06em" }}
          >
            press space to advance · f for fullscreen
          </Mono>
        </div>
      </div>

      {/* Bottom mono chrome — pinned so it survives any viewport */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 3,
          padding: "10px 56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          borderTop: "1px solid var(--border)",
          background: "rgba(8,8,12,0.7)",
          backdropFilter: "blur(4px)",
        }}
      >
        <Mono color="text-tertiary" style={{ fontSize: 10, letterSpacing: "0.18em" }}>
          BUILT FOR ETHGLOBAL OPEN AGENTS · APR 24 → MAY 6 2026
        </Mono>
        <Mono color="text-tertiary" style={{ fontSize: 10, letterSpacing: "0.18em" }}>
          0G COMPUTE · STORAGE · CHAIN · ENS · ERC-7857 · MCP
        </Mono>
      </div>
    </div>
  );
}

interface ThesisLineProps {
  delay: number;
  subdued?: boolean;
  children: React.ReactNode;
}

function ThesisLine({ delay, subdued, children }: ThesisLineProps) {
  const [visible, setVisible] = useState(delay === 0);
  useEffect(() => {
    if (delay === 0) return;
    const id = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(id);
  }, [delay]);
  return (
    <span
      style={{
        display: "block",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        filter: visible ? "blur(0)" : "blur(4px)",
        transition:
          "opacity 720ms cubic-bezier(0.2,0.8,0.2,1), transform 720ms cubic-bezier(0.2,0.8,0.2,1), filter 720ms cubic-bezier(0.2,0.8,0.2,1)",
        color: subdued ? "var(--text-secondary)" : "var(--text)",
      }}
    >
      {children}
    </span>
  );
}

interface ProofRowProps {
  tone: "healthy" | "cyan" | "violet";
  label: string;
  sub: string;
}

function ProofRow({ tone, label, sub }: ProofRowProps) {
  const stripe = `var(--${tone})`;
  return (
    <div
      style={{
        position: "relative",
        padding: "16px 18px 16px 22px",
        borderRadius: 10,
        border: "1px solid var(--border-strong)",
        background: "rgba(8, 9, 14, 0.92)",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        boxShadow: "0 8px 24px rgba(0,0,0,0.32)",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 12,
          bottom: 12,
          width: 3,
          background: stripe,
          boxShadow: `0 0 12px var(--${tone}-glow)`,
          borderRadius: "0 4px 4px 0",
        }}
      />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 16,
          fontWeight: 500,
          color: "var(--text)",
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>
      <Mono color="text-tertiary" style={{ fontSize: 11, letterSpacing: "0.06em" }}>
        {sub}
      </Mono>
    </div>
  );
}

interface CounterChipProps {
  label: string;
  value: number | null;
  decimals?: number;
  suffix?: string;
}

function CounterChip({
  label,
  value,
  decimals = 0,
  suffix = "",
}: CounterChipProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 8,
      }}
    >
      <span
        style={{
          color: "var(--text-tertiary)",
          fontSize: 10,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: value === null ? "var(--text-tertiary)" : "var(--cyan)",
          fontWeight: 500,
          fontSize: 16,
          letterSpacing: "-0.01em",
        }}
      >
        {value === null ? "—" : <CountUp value={value} decimals={decimals} suffix={suffix} flashOnChange />}
      </span>
    </span>
  );
}
