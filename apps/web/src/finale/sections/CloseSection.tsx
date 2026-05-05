// /finale Section 8 — Close. Three-column closer that mirrors deck
// slide 14 (Try it / Open repo / Team). Lens series visible. Three
// partner badges (0G · Uniswap · ENS). Big "thank you" beat for the
// final 25 seconds before Q&A.

import { Mono } from "../../design/atoms.js";

export function CloseSection() {
  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 22,
        padding: "56px 64px 36px",
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
        <span style={{ color: "var(--cyan)" }}>TRY IT · READ IT · FORK IT</span>
      </div>

      {/* Headline */}
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: "clamp(36px, 5vw, 64px)",
          fontWeight: 500,
          letterSpacing: "-0.03em",
          lineHeight: 1.04,
          color: "var(--text)",
          maxWidth: 1100,
        }}
      >
        Three partners.{" "}
        <span style={{ color: "var(--cyan)" }}>One coherent thesis.</span>
        <br />
        The Lens series.
      </h2>
      <p
        style={{
          margin: 0,
          maxWidth: 880,
          fontSize: 17,
          lineHeight: 1.55,
          color: "var(--text-secondary)",
        }}
      >
        Six demo wallets. One live agent. One signed report per click. Open
        repo, public testnet — bring your own wallet if you prefer.
      </p>

      {/* Three partner badges */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 14,
          marginTop: 6,
        }}
      >
        <PartnerCard
          tone="cyan"
          name="0G"
          tag="AI-NATIVE L1 · iNFT"
          bullets={[
            "Compute (TEE) — qwen-2.5-7b verdicts",
            "Storage — merkle rootHash anchored",
            "Chain — LPLensReports + LPLensAgent",
            "ERC-7857 iNFT (tokenId 1)",
          ]}
        />
        <PartnerCard
          tone="violet"
          name="Uniswap Foundation"
          tag="DEFI PROTOCOL · 4 PRIMITIVES"
          bullets={[
            "Subgraph — V3 + V4 tick history",
            "Trading API — /v1/quote",
            "Permit2 EIP-712 — atomic migration",
            "V4 hooks — 1 000-swap replay (AT-2)",
          ]}
        />
        <PartnerCard
          tone="healthy"
          name="ENS"
          tag="AGENT IDENTITY · MEMORY"
          bullets={[
            "lplensagent.eth (Sepolia) — parent name",
            "Per-position text records (5 keys)",
            "MCP resolver — no API trust",
            "Memory cursor lives in ENS",
          ]}
        />
      </section>

      {/* Try-it strip + Lens series row */}
      <section
        style={{
          marginTop: 4,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: 14,
        }}
      >
        {/* Lplens.xyz / repo / MCP block */}
        <div
          style={{
            padding: "20px 22px",
            borderRadius: 12,
            border: "1px solid var(--border-strong)",
            background: "var(--surface)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <Mono
            color="text-tertiary"
            style={{ fontSize: 10, letterSpacing: "0.2em" }}
          >
            LIVE DEMO
          </Mono>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 18,
              alignItems: "baseline",
            }}
          >
            <a
              href="https://lplens.xyz"
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                fontWeight: 500,
                color: "var(--cyan)",
                textDecoration: "none",
                letterSpacing: "-0.02em",
              }}
            >
              lplens.xyz
            </a>
            <a
              href="https://github.com/JeanBaptisteDurand/Open_Agent_2026"
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                color: "var(--text)",
                textDecoration: "none",
                lineHeight: 1.45,
              }}
            >
              github.com/<br />
              JeanBaptisteDurand/<br />
              Open_Agent_2026
            </a>
            <a
              href="https://sepolia.app.ens.domains/lplensagent.eth"
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 14,
                color: "var(--violet)",
                textDecoration: "none",
                lineHeight: 1.5,
              }}
            >
              lplensagent.eth<br />
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-tertiary)",
                  letterSpacing: "0.1em",
                }}
              >
                · Sepolia
              </span>
            </a>
          </div>
          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 12,
              display: "flex",
              gap: 16,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text-tertiary)",
              letterSpacing: "0.06em",
              flexWrap: "wrap",
            }}
          >
            <span>
              MCP — <span style={{ color: "var(--text-secondary)" }}>self-host (stdio)</span>
            </span>
            <span style={{ color: "var(--text-faint)" }}>·</span>
            <span>
              chain — <span style={{ color: "var(--text-secondary)" }}>0G Newton (16602) + Sepolia</span>
            </span>
            <span style={{ color: "var(--text-faint)" }}>·</span>
            <span>
              public testnet — <span style={{ color: "var(--text-secondary)" }}>bring your own wallet</span>
            </span>
          </div>
        </div>

        {/* Lens series block */}
        <div
          style={{
            padding: "20px 22px",
            borderRadius: 12,
            border: "1px solid var(--border-strong)",
            background:
              "linear-gradient(180deg, rgba(255,176,32,0.05) 0%, var(--surface) 80%)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <Mono
            color="text-tertiary"
            style={{ fontSize: 10, letterSpacing: "0.2em" }}
          >
            42 BLOCKCHAIN · THE LENS SERIES
          </Mono>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            <LensRow
              tone="cyan"
              name="BaseLens"
              sub="Base + AgentKit + x402 · MBC 2025"
            />
            <LensRow
              tone="violet"
              name="CORLens"
              sub="XRPL + 9-phase agent + MCP · PBW 2026"
            />
            <LensRow
              tone="healthy"
              name="SuiLens"
              sub="Move package dependencies · Sui"
            />
            <LensRow
              tone="bleed"
              name="LPLens"
              sub="Uniswap + 0G + ENS · Open Agents 2026"
              active
            />
          </ul>
        </div>
      </section>

      {/* Bottom thanks */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: 18,
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Mono color="text-tertiary" style={{ fontSize: 11, letterSpacing: "0.16em" }}>
          THANK YOU — ETHGLOBAL · 0G LABS · UNISWAP FOUNDATION · ENS LABS
        </Mono>
        <Mono color="cyan" style={{ fontSize: 12, letterSpacing: "0.1em" }}>
          ▶ ready for questions
        </Mono>
      </div>
    </div>
  );
}

interface PartnerCardProps {
  tone: "cyan" | "violet" | "healthy";
  name: string;
  tag: string;
  bullets: string[];
}

function PartnerCard({ tone, name, tag, bullets }: PartnerCardProps) {
  return (
    <div
      style={{
        position: "relative",
        padding: "20px 22px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        borderTop: `3px solid var(--${tone})`,
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          fontWeight: 500,
          color: `var(--${tone})`,
          letterSpacing: "-0.02em",
        }}
      >
        {name}
      </span>
      <Mono
        color="text-tertiary"
        style={{ fontSize: 10, letterSpacing: "0.2em" }}
      >
        {tag}
      </Mono>
      <ul
        style={{
          margin: "6px 0 0",
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {bullets.map((b, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "baseline",
              fontSize: 13,
              lineHeight: 1.45,
              color: "var(--text-secondary)",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 4,
                height: 4,
                borderRadius: 999,
                background: `var(--${tone})`,
                marginTop: 6,
                flexShrink: 0,
              }}
            />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface LensRowProps {
  tone: "cyan" | "violet" | "healthy" | "bleed";
  name: string;
  sub: string;
  active?: boolean;
}

function LensRow({ tone, name, sub, active }: LensRowProps) {
  return (
    <li
      style={{
        display: "flex",
        gap: 10,
        alignItems: "baseline",
        padding: "5px 8px",
        borderRadius: 6,
        background: active ? "rgba(255,176,32,0.06)" : "transparent",
        border: active ? "1px dashed rgba(255,176,32,0.3)" : "1px solid transparent",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: `var(--${tone})`,
          marginTop: 6,
          boxShadow: active ? `0 0 8px var(--${tone}-glow)` : undefined,
        }}
      />
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 16,
            fontWeight: 500,
            color: active ? "var(--cyan)" : `var(--${tone})`,
            letterSpacing: "-0.01em",
          }}
        >
          {name}
        </span>
        <Mono color="text-tertiary" style={{ fontSize: 11 }}>
          {sub}
        </Mono>
        {active && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.16em",
              color: "var(--cyan)",
              border: "1px solid rgba(255,176,32,0.4)",
              padding: "1px 6px",
              borderRadius: 3,
              textTransform: "uppercase",
            }}
          >
            today
          </span>
        )}
      </div>
    </li>
  );
}
