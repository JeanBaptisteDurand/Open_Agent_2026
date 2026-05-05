// /composability — split-screen scripted MCP loop. Left column: an
// external agent (Claude-Desktop-style terminal) types a tool call,
// receives a payment-required response, signs the mintLicense tx.
// Right column: the LPLensAgent contract receives the tx, splits the
// 0.1 OG payment 80/20, flips isLicensed to green. Once licensed,
// the diagnose result streams into the left column. Loops every 30s.
//
// IMPORTANT: this is scripted animation, not a live broker call. The
// real mintLicense tx (0xe8e55c75…) is referenced for proof. The
// audience leaves with a clear visual of "agent paid → contract
// settled → LPLens called → report returned."

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AppHeader } from "../components/AppHeader.js";
import { Mono } from "../design/atoms.js";
import { CountUp } from "../finale/atoms.js";
import { ProofBadge } from "../finale/ProofBadge.js";

// Real mintLicense tx — referenced in the demo so the audience can
// click through. Sourced from the prior on-chain submission run.
const REAL_TX = "0xe8e55c75de9a32a9f410cbafa7be7d2eecd8e0fa6b1d20fef00d7f6e9f3a5c00";
const SCRIPT_DURATION_MS = 16000;

interface Step {
  id: string;
  at: number; // ms within the loop
  label: string;
}

const STEPS: Step[] = [
  { id: "type-cmd", at: 0, label: "type lplens.diagnose(tokenId: 605311)" },
  { id: "402", at: 1500, label: "server returns 402 Payment Required" },
  { id: "sign", at: 3500, label: "wallet pop · sign mintLicense(0.1 OG)" },
  { id: "tx-sent", at: 5500, label: "tx sent to LPLensAgent contract" },
  { id: "tx-confirmed", at: 7500, label: "tx confirmed · split 0.08 / 0.02" },
  { id: "isLicensed", at: 9500, label: "isLicensed(tokenId, caller) → true" },
  { id: "stream", at: 11000, label: "diagnose result streams back" },
  { id: "done", at: 14000, label: "rootHash + 5 ENS records published" },
];

function isAfter(stepId: string, t: number): boolean {
  const s = STEPS.find((x) => x.id === stepId);
  return !!s && t >= s.at;
}

export function Composability() {
  const [t, setT] = useState(0);
  const [licensesMinted, setLicensesMinted] = useState(8);
  const [running, setRunning] = useState(true);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = (now: number): void => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const next = elapsed % SCRIPT_DURATION_MS;
      setT(next);
      // Bump licenses minted once per loop, right when isLicensed flips.
      if (next < 100 && elapsed > 100) {
        setLicensesMinted((n) => n + 1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const replay = useCallback(() => {
    startRef.current = null;
    setT(0);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppHeader />
      <main
        style={{
          flex: 1,
          padding: "32px 36px 56px",
          maxWidth: 1480,
          margin: "0 auto",
          width: "100%",
          position: "relative",
        }}
      >
        <header style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <span style={{ width: 24, height: 1, background: "var(--violet)" }} />
            <span
              style={{
                color: "var(--violet)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              AGENT ECONOMY · MCP · MINTLICENSE 80/20
            </span>
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: "clamp(34px, 4.6vw, 56px)",
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "var(--text)",
              maxWidth: 1080,
            }}
          >
            LPLens is{" "}
            <span style={{ color: "var(--cyan)" }}>callable by other agents</span>.
          </h1>
          <p
            style={{
              margin: "10px 0 0",
              maxWidth: 880,
              fontSize: 16,
              lineHeight: 1.55,
              color: "var(--text-secondary)",
            }}
          >
            Pay <span style={{ color: "var(--cyan)" }}>0.1 OG</span> via{" "}
            <code style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>
              mintLicense
            </code>
            . Get a TEE-signed report. <strong>80%</strong> to the iNFT owner.{" "}
            <strong>20%</strong> to the protocol treasury.{" "}
            <span style={{ color: "var(--text)" }}>Atomically. On-chain.</span>
          </p>
        </header>

        {/* Split-screen */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
            gap: 20,
            alignItems: "stretch",
            marginBottom: 20,
          }}
        >
          <ExternalAgentColumn t={t} />
          <ContractColumn t={t} licensesMinted={licensesMinted} />
        </section>

        {/* Step ticker */}
        <section
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            padding: "12px 14px",
            border: "1px solid var(--border-strong)",
            borderRadius: 10,
            background: "var(--surface)",
            overflowX: "auto",
            marginBottom: 16,
          }}
        >
          {STEPS.map((s, i) => {
            const past = t > s.at;
            const active =
              t >= s.at && (i === STEPS.length - 1 || t < STEPS[i + 1]!.at);
            return (
              <span
                key={s.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: active
                    ? "var(--cyan)"
                    : past
                      ? "var(--healthy)"
                      : "var(--text-tertiary)",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                  fontWeight: active ? 600 : 400,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: active
                      ? "var(--cyan)"
                      : past
                        ? "var(--healthy)"
                        : "var(--border-strong)",
                    boxShadow: active ? "0 0 8px var(--cyan-glow)" : undefined,
                    animation: active ? "pulse-dot 1.4s infinite" : undefined,
                  }}
                />
                {String(i + 1).padStart(2, "0")} {s.label}
                {i < STEPS.length - 1 && (
                  <span style={{ marginLeft: 8, color: "var(--text-faint)" }}>→</span>
                )}
              </span>
            );
          })}
        </section>

        {/* CTAs */}
        <section
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button className="btn btn-ghost" onClick={replay}>
            ↻ Replay sequence
          </button>
          <Link to="/developers" style={{ textDecoration: "none" }}>
            <button className="btn btn-ghost">↗ Try via MCP (docs)</button>
          </Link>
          <a
            href={`https://chainscan-newton.0g.ai/tx/${REAL_TX}`}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
          >
            <button className="btn btn-ghost">↗ See real tx on chainscan</button>
          </a>
          <Link to="/agent" style={{ textDecoration: "none" }}>
            <button className="btn btn-ghost">↗ How licensing works</button>
          </Link>
          <Mono color="text-tertiary" style={{ fontSize: 11, marginLeft: 10 }}>
            scripted demo · loops every 16s · {Math.max(0, Math.ceil((SCRIPT_DURATION_MS - t) / 1000))}s remaining
          </Mono>
        </section>
      </main>
    </div>
  );
}

interface ColumnProps {
  t: number;
}

function ExternalAgentColumn({ t }: ColumnProps) {
  return (
    <div
      style={{
        position: "relative",
        padding: "16px 20px 18px",
        borderRadius: 12,
        border: "1px solid var(--border-strong)",
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minHeight: 480,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          paddingBottom: 12,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AgentDot label="2" tone="violet" />
          <Mono style={{ fontSize: 12, color: "var(--text)", letterSpacing: "0.04em" }}>
            agent #2
          </Mono>
          <span style={{ color: "var(--text-tertiary)" }}>→</span>
          <AgentDot label="1" tone="cyan" />
          <Mono style={{ fontSize: 12, color: "var(--text)", letterSpacing: "0.04em" }}>
            agent #1 · LPLens
          </Mono>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: "var(--text-tertiary)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginLeft: 8,
            }}
          >
            via MCP stdio
          </span>
        </div>
        <Mono color="text-tertiary" style={{ fontSize: 10, letterSpacing: "0.12em" }}>
          claude desktop
        </Mono>
      </div>

      <pre
        style={{
          margin: 0,
          fontFamily: "var(--font-mono)",
          fontSize: 12.5,
          lineHeight: 1.7,
          color: "var(--text)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          flex: 1,
          minHeight: 320,
        }}
      >
        <Line on={t >= 0} prefix="$">
          mcp call lplens.diagnose <span style={{ color: "var(--cyan)" }}>--tokenId 605311</span>
        </Line>
        <Line on={t >= 1500} prefix="←" tone="bleed">
          HTTP 402 Payment Required
        </Line>
        <Line on={t >= 1500} indent>
          {`{`}
          <br />
          {`  "contract": "LPLensAgent (tokenId 1)",`}
          <br />
          {`  "abi":      "mintLicense(uint256,address,uint256)",`}
          <br />
          {`  "price":    "0.1 OG",`}
          <br />
          {`  "expires":  "now + 24h",`}
          <br />
          {`  "split":    "80/20 owner/treasury"`}
          <br />
          {`}`}
        </Line>
        <Line on={t >= 3500} prefix="$">
          wallet sign mintLicense ·{" "}
          <span style={{ color: "var(--cyan)" }}>0.1 OG → 0xLPLensAgent</span>
        </Line>
        <Line on={t >= 5500} prefix="↗" tone="cyan">
          tx 0xe8e55c75…f3a5c00 broadcast → 0G Newton
        </Line>
        <Line on={t >= 7500} prefix="✓" tone="healthy">
          tx confirmed · block 4,128,902 · gas 0.00018 OG
        </Line>
        <Line on={t >= 9500} prefix="✓" tone="healthy">
          isLicensed(605311, caller) = true
        </Line>
        <Line on={t >= 11000} prefix="←" tone="cyan">
          diagnose stream open · 11 phases · streaming…
        </Line>
        <Line on={t >= 14000} prefix="✓" tone="healthy">
          rootHash 0xd0da9250…d5c4 · ENS records published
        </Line>
      </pre>
    </div>
  );
}

function Line({
  children,
  on,
  prefix,
  indent,
  tone,
}: {
  children: React.ReactNode;
  on: boolean;
  prefix?: string;
  indent?: boolean;
  tone?: "cyan" | "violet" | "bleed" | "healthy" | "toxic";
}) {
  const color = tone ? `var(--${tone})` : "var(--text)";
  return (
    <div
      style={{
        display: "block",
        opacity: on ? 1 : 0,
        transform: on ? "translateY(0)" : "translateY(4px)",
        transition: "opacity 320ms cubic-bezier(0.2,0.8,0.2,1), transform 320ms cubic-bezier(0.2,0.8,0.2,1)",
        paddingLeft: indent ? 18 : 0,
      }}
    >
      {prefix && (
        <span
          style={{
            color: "var(--text-tertiary)",
            marginRight: 8,
            display: "inline-block",
            width: 14,
          }}
        >
          {prefix}
        </span>
      )}
      <span style={{ color }}>{children}</span>
    </div>
  );
}

interface ContractColumnProps {
  t: number;
  licensesMinted: number;
}

function ContractColumn({ t, licensesMinted }: ContractColumnProps) {
  const isLicensed = isAfter("isLicensed", t);
  const txConfirmed = isAfter("tx-confirmed", t);
  return (
    <div
      style={{
        position: "relative",
        padding: "16px 20px 18px",
        borderRadius: 12,
        border: "1px solid var(--border-strong)",
        background:
          "linear-gradient(180deg, rgba(255,176,32,0.04) 0%, var(--surface) 100%)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          paddingBottom: 12,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "var(--cyan)",
              boxShadow: "0 0 8px var(--cyan-glow)",
              animation: "pulse-dot 1.4s infinite",
            }}
          />
          <Mono color="cyan" style={{ fontSize: 11, letterSpacing: "0.16em" }}>
            LPLensAgent · iNFT #1 · 0G Newton
          </Mono>
        </div>
        <Mono color="text-tertiary" style={{ fontSize: 10 }}>
          ERC-7857
        </Mono>
      </div>

      {/* Royalty split — 0.1 OG payment chip → SVG Y-fork → 0.08 + 0.02 */}
      <SplitFork
        flowing={t >= 5500 && t < 7500}
        committed={txConfirmed}
        paymentVisible={t >= 3500}
      />

      {/* Proportional 80 / 20 bar */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
          }}
        >
          <span>OWNER · 80%</span>
          <span style={{ color: "var(--text-secondary)" }}>ATOMIC ROYALTY SPLIT</span>
          <span>TREASURY · 20%</span>
        </div>
        <div
          style={{
            display: "flex",
            height: 8,
            borderRadius: 999,
            overflow: "hidden",
            border: "1px solid var(--border-strong)",
            background: "var(--base-deeper)",
          }}
        >
          <span
            style={{
              flex: 0.8,
              background:
                "linear-gradient(90deg, rgba(142,232,135,0.7), rgba(142,232,135,1))",
              boxShadow: "0 0 12px var(--healthy-glow) inset",
            }}
          />
          <span
            style={{
              flex: 0.2,
              background:
                "linear-gradient(90deg, rgba(197,156,255,0.85), rgba(197,156,255,1))",
              boxShadow: "0 0 12px var(--violet-glow) inset",
            }}
          />
        </div>
      </div>

      {/* Counters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <CounterStat
          label="LICENSES MINTED"
          value={licensesMinted}
          decimals={0}
        />
        <CounterStat
          label="OG ROYALTIES PAID"
          value={licensesMinted * 0.08}
          decimals={2}
          suffix=" OG"
        />
      </div>

      {/* isLicensed badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 14px",
          borderRadius: 8,
          background: isLicensed
            ? "rgba(142,232,135,0.08)"
            : "rgba(8,8,12,0.5)",
          border: isLicensed
            ? "1px solid rgba(142,232,135,0.45)"
            : "1px solid var(--border)",
          transition: "all 320ms cubic-bezier(0.2,0.8,0.2,1)",
        }}
      >
        <Mono
          style={{
            fontSize: 12,
            color: isLicensed ? "var(--healthy)" : "var(--text-tertiary)",
            letterSpacing: "0.04em",
          }}
        >
          isLicensed(605311, caller)
        </Mono>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            fontWeight: 600,
            color: isLicensed ? "var(--healthy)" : "var(--text-tertiary)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {isLicensed ? "✓ TRUE" : "false"}
        </span>
      </div>

      {/* Tx hash */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <ProofBadge
          label="0G Chain · mintLicense tx"
          hash={`${REAL_TX.slice(0, 14)}…${REAL_TX.slice(-6)}`}
          state={txConfirmed ? "verified" : t >= 5500 ? "verifying" : "pending"}
          href={`https://chainscan-newton.0g.ai/tx/${REAL_TX}`}
          size="sm"
        />
      </div>
    </div>
  );
}

interface SplitForkProps {
  flowing: boolean;
  committed: boolean;
  paymentVisible: boolean;
}

function AgentDot({ label, tone }: { label: string; tone: "cyan" | "violet" }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        borderRadius: 999,
        border: `1px solid var(--${tone})`,
        color: `var(--${tone})`,
        background: tone === "cyan" ? "rgba(255,176,32,0.1)" : "rgba(197,156,255,0.1)",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 0,
      }}
    >
      {label}
    </span>
  );
}

function SplitFork({ flowing, committed, paymentVisible }: SplitForkProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "auto auto auto",
        gap: 10,
        padding: "16px 14px",
        border: "1px dashed var(--border-strong)",
        borderRadius: 10,
        background: "var(--base-deeper)",
        minHeight: 200,
      }}
    >
      {/* Top: payment chip */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            borderRadius: 999,
            border: "1px solid var(--cyan)",
            background: "rgba(255,176,32,0.1)",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--cyan)",
            opacity: paymentVisible ? 1 : 0.25,
            transform: paymentVisible ? "translateY(0)" : "translateY(-6px)",
            boxShadow: flowing ? "0 0 18px var(--cyan-glow)" : undefined,
            transition: "all 320ms cubic-bezier(0.2,0.8,0.2,1)",
            letterSpacing: "0.02em",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: "var(--cyan)",
              boxShadow: "0 0 8px var(--cyan-glow)",
              animation: paymentVisible ? "pulse-dot 1.4s infinite" : undefined,
            }}
          />
          0.1 OG · mintLicense
        </span>
      </div>

      {/* Middle: SVG Y-fork */}
      <svg
        viewBox="0 0 320 64"
        width="100%"
        height="64"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="fork-flow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFB020" stopOpacity={flowing ? 1 : 0.5} />
            <stop offset="100%" stopColor="#FFB020" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* trunk */}
        <line
          x1="160"
          y1="0"
          x2="160"
          y2="22"
          stroke="var(--cyan)"
          strokeWidth="1.4"
          opacity={paymentVisible ? 0.9 : 0.3}
        />
        {/* branches */}
        <path
          d="M160 22 Q 160 46, 70 56"
          stroke="var(--healthy)"
          strokeWidth="1.4"
          fill="none"
          opacity={committed ? 0.9 : flowing ? 0.6 : 0.3}
        />
        <path
          d="M160 22 Q 160 46, 250 56"
          stroke="var(--violet)"
          strokeWidth="1.4"
          fill="none"
          opacity={committed ? 0.9 : flowing ? 0.6 : 0.3}
        />
        <circle cx="160" cy="22" r="2.4" fill="var(--cyan)" />
        <circle
          cx="70"
          cy="56"
          r="3"
          fill="var(--healthy)"
          style={{ filter: committed ? "drop-shadow(0 0 6px rgba(142,232,135,0.7))" : undefined }}
        />
        <circle
          cx="250"
          cy="56"
          r="3"
          fill="var(--violet)"
          style={{ filter: committed ? "drop-shadow(0 0 6px rgba(197,156,255,0.7))" : undefined }}
        />
        {/* moving dot during flow */}
        {flowing && (
          <circle r="3" fill="var(--cyan)">
            <animateMotion dur="1.4s" repeatCount="indefinite">
              <mpath xlinkHref="#fork-path-left" />
            </animateMotion>
          </circle>
        )}
        <path
          id="fork-path-left"
          d="M160 22 Q 160 46, 70 56"
          fill="none"
          stroke="none"
        />
      </svg>

      {/* Bottom: two destination tiles */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <SplitTile
          label="OWNER · 80%"
          amount={committed ? 0.08 : 0}
          tone="healthy"
          highlight={flowing || committed}
        />
        <SplitTile
          label="TREASURY · 20%"
          amount={committed ? 0.02 : 0}
          tone="violet"
          highlight={flowing || committed}
        />
      </div>
    </div>
  );
}

interface SplitTileProps {
  label: string;
  amount: number;
  tone: "healthy" | "violet";
  highlight: boolean;
}

function SplitTile({ label, amount, tone, highlight }: SplitTileProps) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 8,
        border: `1px solid var(--${tone})`,
        background:
          tone === "violet"
            ? "rgba(197,156,255,0.08)"
            : "rgba(142,232,135,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        boxShadow: highlight ? `0 0 14px var(--${tone}-glow)` : undefined,
        transition: "box-shadow 240ms",
      }}
    >
      <Mono
        style={{
          fontSize: 9,
          letterSpacing: "0.16em",
          color: `var(--${tone})`,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Mono>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 22,
          fontWeight: 500,
          color: "var(--text)",
          letterSpacing: "-0.02em",
        }}
      >
        <CountUp value={amount} decimals={2} suffix=" OG" durationMs={500} />
      </span>
    </div>
  );
}

interface CounterStatProps {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
}

function CounterStat({ label, value, decimals = 0, suffix = "" }: CounterStatProps) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--base-deeper)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <Mono color="text-tertiary" style={{ fontSize: 9, letterSpacing: "0.18em" }}>
        {label}
      </Mono>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 22,
          fontWeight: 500,
          color: "var(--cyan)",
          letterSpacing: "-0.02em",
        }}
      >
        <CountUp value={value} decimals={decimals} suffix={suffix} flashOnChange />
      </span>
    </div>
  );
}
