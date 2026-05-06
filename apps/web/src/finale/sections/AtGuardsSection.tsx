// /finale honesty-layer slide. Audience-friendly map of the 11
// streaming phases plus the 6 Acceptance Tests (AT-N) that gate them.
// "AT" expands inline so the audience never has to ask.
//
// Left column: 11-phase pipeline, colour-coded by which AT guard
// covers it. Right column: AT-1…AT-6 cards with the one-line claim
// each test backs.

import { Mono } from "../../design/atoms.js";

interface PhaseRow {
  num: string;
  name: string;
  covers?: ReadonlyArray<string>;
  tone: "violet" | "cyan" | "healthy" | "amber" | "text-tertiary";
}

const PHASES: ReadonlyArray<PhaseRow> = [
  { num: "00", name: "Subgraph readiness", tone: "text-tertiary" },
  { num: "01", name: "Position resolve (V3 + V4 decode)", covers: ["AT-8"], tone: "cyan" },
  { num: "03", name: "IL reconstruction (closed-form)", covers: ["AT-1"], tone: "amber" },
  { num: "04", name: "Regime classify (vol · Hurst · MEV)", covers: ["AT-6", "AT-7"], tone: "violet" },
  { num: "05", name: "V4 hook discovery + flag decode", covers: ["AT-3", "AT-9"], tone: "violet" },
  { num: "06", name: "Hook scoring · 1 000-swap replay", covers: ["AT-2"], tone: "cyan" },
  { num: "07", name: "Migration plan (Permit2 bundle)", tone: "text-tertiary" },
  { num: "08", name: "Report assembly + 0G Storage upload", tone: "text-tertiary" },
  { num: "09", name: "0G Chain anchor + iNFT memory", covers: ["AT-5"], tone: "healthy" },
  { num: "10", name: "Verdict (TEE) + hallucination guard", covers: ["AT-4"], tone: "cyan" },
  { num: "11", name: "ENS publish (5 text records)", tone: "text-tertiary" },
];

interface GuardCard {
  tag: string;
  title: string;
  body: string;
  phaseRef: string;
  tone: "amber" | "cyan" | "violet" | "healthy";
}

const GUARDS: ReadonlyArray<GuardCard> = [
  {
    tag: "AT-1",
    title: "IL calibrated",
    body: "±1 % vs Revert.Finance · closed-form, no estimator.",
    phaseRef: "Phase 3",
    tone: "amber",
  },
  {
    tag: "AT-2",
    title: "0 bps replay",
    body: "1 000 mainnet swaps · final sqrtPrice matches chain.",
    phaseRef: "Phase 6",
    tone: "cyan",
  },
  {
    tag: "AT-3",
    title: "Hook direction",
    body: "Each family must move APR the right way vs baseline.",
    phaseRef: "Phase 5 → 6",
    tone: "violet",
  },
  {
    tag: "AT-4",
    title: "No hallucination",
    body: "Every verdict number traces to JSON · else [unsupported].",
    phaseRef: "Phase 10",
    tone: "cyan",
  },
  {
    tag: "AT-5",
    title: "TEE round-trip",
    body: "Re-download · re-hash · recover signer offline.",
    phaseRef: "Phase 9",
    tone: "healthy",
  },
  {
    tag: "AT-6",
    title: "Sandwich FPR",
    body: "≤ 15 % FPR · ≥ 70 % TPR vs EigenPhi labels.",
    phaseRef: "Phase 4",
    tone: "violet",
  },
  {
    tag: "AT-7",
    title: "Regime sanity",
    body: "5 known pools must land their expected label.",
    phaseRef: "Phase 4",
    tone: "amber",
  },
  {
    tag: "AT-8",
    title: "V4 decode",
    body: "Byte-exact ticks vs Solidity getPoolAndPositionInfo.",
    phaseRef: "Phase 1 (V4)",
    tone: "cyan",
  },
  {
    tag: "AT-9",
    title: "Flag bits",
    body: "getFlags(addr) matches PoolManager bitmask.",
    phaseRef: "Phase 5",
    tone: "violet",
  },
  {
    tag: "AT-10",
    title: "End-to-end ≤ 60 s",
    body: "All 11 phases finish inside the demo window.",
    phaseRef: "All phases",
    tone: "amber",
  },
];

export function AtGuardsSection() {
  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        padding: "32px 64px 48px",
        maxWidth: 1480,
        margin: "0 auto",
        width: "100%",
        minHeight: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 24, height: 1, background: "var(--healthy)" }} />
        <span
          style={{
            color: "var(--healthy)",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          HONESTY LAYER · 11 PHASES · 10 ACCEPTANCE TESTS
        </span>
      </div>
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: "clamp(22px, 2.6vw, 32px)",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
          color: "var(--text)",
          maxWidth: 1080,
        }}
      >
        Every phase is covered by an{" "}
        <span style={{ color: "var(--healthy)" }}>Acceptance Test</span>.{" "}
        <span style={{ color: "var(--text-secondary)" }}>
          AT-N = the test that has to pass before that phase ships.
        </span>
      </h2>

      <section
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "minmax(0, 0.85fr) minmax(0, 1fr)",
          gap: 24,
          alignItems: "stretch",
        }}
      >
        {/* Left: 11-phase column, color-coded by covering AT */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "var(--surface)",
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            padding: "16px 20px",
            overflow: "hidden",
          }}
        >
          <Mono
            color="text-tertiary"
            style={{ fontSize: 10, letterSpacing: "0.18em", marginBottom: 6 }}
          >
            STREAMING PIPELINE · 11 SSE PHASES
          </Mono>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {PHASES.map((p) => (
              <PhaseLine key={p.num} {...p} />
            ))}
          </div>
        </div>

        {/* Right: AT guard cards — stretch to fill the column so the
            10 cards consume the slide's available real estate. */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridAutoRows: "1fr",
            gap: 14,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {GUARDS.map((g) => (
            <GuardCardEl key={g.tag} {...g} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PhaseLine({ num, name, covers, tone }: PhaseRow) {
  const dot = tone === "text-tertiary" ? "var(--text-tertiary)" : `var(--${tone})`;
  const hasCover = !!covers && covers.length > 0;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 0",
        borderTop: "1px solid var(--border-faint, var(--border))",
        fontSize: 13,
        fontFamily: "var(--font-mono)",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: dot,
          boxShadow: hasCover ? `0 0 6px ${dot}` : undefined,
          flexShrink: 0,
        }}
      />
      <span style={{ width: 22, color: "var(--text-tertiary)", flexShrink: 0 }}>
        {num}
      </span>
      <span style={{ flex: 1, color: "var(--text)" }}>{name}</span>
      {hasCover && (
        <span style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {covers!.map((c) => (
            <span
              key={c}
              style={{
                fontSize: 10,
                letterSpacing: "0.12em",
                padding: "2px 6px",
                borderRadius: 4,
                color: dot,
                border: `1px solid ${dot}`,
                background: "rgba(0,0,0,0.18)",
                whiteSpace: "nowrap",
              }}
            >
              {c}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

function GuardCardEl({ tag, title, body, phaseRef, tone }: GuardCard) {
  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: 10,
        border: "1px solid var(--border)",
        borderLeft: `4px solid var(--${tone})`,
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 6,
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <span style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <Mono
            style={{
              fontSize: 12,
              letterSpacing: "0.16em",
              color: `var(--${tone})`,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {tag}
          </Mono>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: "var(--text)",
              lineHeight: 1.15,
            }}
          >
            {title}
          </span>
        </span>
        <Mono
          color="text-tertiary"
          style={{
            fontSize: 10,
            letterSpacing: "0.14em",
            whiteSpace: "nowrap",
          }}
        >
          {phaseRef}
        </Mono>
      </div>
      <span
        style={{
          fontSize: 13,
          lineHeight: 1.45,
          color: "var(--text-secondary)",
        }}
      >
        {body}
      </span>
    </div>
  );
}
