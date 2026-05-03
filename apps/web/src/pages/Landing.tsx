import { useNavigate } from "react-router-dom";
import { AppHeader } from "../components/AppHeader.js";
import { HeroFilm } from "../components/HeroFilm.js";
import { Cap, Dot, Mono } from "../design/atoms.js";

export function Landing() {
  const nav = useNavigate();
  return (
    <div>
      {/* Hero — centered SaaS-style with the prism film as background */}
      <section
        style={{
          position: "relative",
          minHeight: "92vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <HeroFilm />
        <AppHeader />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            display: "flex",
            alignItems: "center",
            padding: "0 36px",
          }}
        >
          <div style={{ maxWidth: 1200, width: "100%", margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 28,
                opacity: 0.9,
              }}
            >
              <Dot color="cyan" pulse />
              <Cap style={{ color: "var(--cyan)" }}>
                ENCLAVE · LIVE · 0G COMPUTE TEE
              </Cap>
              <Mono color="text-tertiary" style={{ fontSize: 11 }}>
                NODE-04 · TDX attested
              </Mono>
            </div>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "clamp(40px, 6.2vw, 86px)",
                lineHeight: 1.02,
                fontWeight: 500,
                letterSpacing: "-0.035em",
                maxWidth: 1000,
                color: "var(--text)",
                textWrap: "balance",
              }}
            >
              See why your LP position is{" "}
              <span style={{ color: "var(--bleed)" }}>bleeding</span>.
              <br />
              <span style={{ color: "var(--text-secondary)" }}>In</span>{" "}
              <Mono color="cyan" style={{ fontSize: "0.82em" }}>
                30
              </Mono>{" "}
              <span style={{ color: "var(--text-secondary)" }}>seconds.</span>
            </h1>
            <p
              style={{
                marginTop: 28,
                maxWidth: 640,
                fontSize: 17,
                lineHeight: 1.55,
                color: "var(--text-secondary)",
                textWrap: "pretty",
              }}
            >
              LPLens is an autonomous agent on 0G that reads your Uniswap V3
              position, reconstructs your impermanent loss live, replays every
              V4 hook against the last 1 000 swaps swap-by-swap, and migrates
              you in a single Permit2 signature.
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 36,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                className="btn btn-primary"
                onClick={() => nav("/atlas")}
                style={{ padding: "14px 22px", fontSize: 14 }}
              >
                Connect wallet
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 7h8M7 3l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => nav("/diagnose/605311")}
                style={{ padding: "14px 22px", fontSize: 14 }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle
                    cx="7"
                    cy="7"
                    r="6"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M5.5 4.5L9.5 7L5.5 9.5V4.5Z"
                    fill="currentColor"
                  />
                </svg>
                Watch the diagnosis
                <Mono color="text-tertiary" style={{ fontSize: 11, marginLeft: 4 }}>
                  2:48
                </Mono>
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            justifyContent: "center",
            padding: "0 36px 28px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "var(--text-tertiary)",
              fontSize: 11,
            }}
          >
            <div
              style={{
                width: 40,
                height: 1,
                background: "var(--border-strong)",
              }}
            />
            <Cap>Scroll · how it works</Cap>
            <div
              style={{
                width: 40,
                height: 1,
                background: "var(--border-strong)",
              }}
            />
          </div>
        </div>
      </section>

      {/* Stats row — three metrics that anchor the thesis */}
      <section
        style={{
          padding: "56px 36px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: 920,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 32,
          }}
        >
          <Stat
            value="1 000"
            label="swaps replayed"
            sub="0 bps drift vs mainnet"
          />
          <Stat
            value="5"
            label="verification paths"
            sub="no LPLens server in trust"
          />
          <Stat
            value="0"
            label="keys in custody"
            sub="user signs, agent never executes"
          />
        </div>
      </section>

      {/* Features — 3 phases of the agent loop */}
      <section
        style={{
          padding: "100px 36px",
          maxWidth: 1200,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <Cap style={{ color: "var(--cyan)" }}>METHOD · 3 PHASES</Cap>
        <h2
          style={{
            margin: "12px 0 16px",
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 4vw, 48px)",
            fontWeight: 500,
            letterSpacing: "-0.025em",
            textWrap: "balance",
          }}
        >
          A lens, not a dashboard.
        </h2>
        <p
          style={{
            margin: "0 auto 56px",
            maxWidth: 640,
            color: "var(--text-secondary)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          Every position ships with a signed, reproducible diagnosis. You keep
          the verdict; your keys never leave your wallet.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
            textAlign: "left",
          }}
        >
          <HowCard
            n="01"
            label="DIAGNOSE"
            title="Read the position with a microscope."
            desc="The agent pulls your tokenId, decodes the tick range, and reconstructs IL swap-by-swap against a HODL baseline. Output: a decomposed loss attribution."
          />
          <HowCard
            n="02"
            label="SIMULATE"
            title="Score every V4 hook, in a sealed enclave."
            desc="Candidate hooks are replayed against the exact swap stream your pool experienced. Counterfactual P&L, fee capture, and LVR are measured."
          />
          <HowCard
            n="03"
            label="MIGRATE"
            title="One signature. Three on-chain moves."
            desc="Close V3 → swap → mint V4, bundled through Permit2. Report signed inside the TEE, pinned to 0G Storage, anchored on 0G Chain for audit."
          />
        </div>
      </section>

      {/* Instrument stack — what's load-bearing under the hood */}
      <section
        style={{
          padding: "60px 36px",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          background: "rgba(15, 22, 40, 0.5)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Cap style={{ color: "var(--text-tertiary)" }}>INSTRUMENT STACK</Cap>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 24,
              width: "100%",
            }}
          >
            <TrustItem name="0G Compute" sub="TDX · provider-attested" />
            <TrustItem name="0G Storage" sub="merkle rootHash anchored" />
            <TrustItem name="0G Chain" sub="LPLensReports + iNFT registry" />
            <TrustItem name="Uniswap V3 / V4" sub="mainnet · sepolia" />
            <TrustItem name="Permit2" sub="EIP-712 signed bundle" />
            <TrustItem name="ENS" sub="lplensagent.eth — Sepolia" />
            <TrustItem name="ERC-7857" sub="iNFT agent identity" />
            <TrustItem name="MCP" sub="6 tools · agent-callable" />
          </div>
        </div>
      </section>

      {/* Closing CTA — final push to /atlas */}
      <section
        style={{
          padding: "100px 36px",
          maxWidth: 920,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 3.5vw, 40px)",
            fontWeight: 500,
            letterSpacing: "-0.025em",
            textWrap: "balance",
          }}
        >
          Three demo wallets. One live agent. One signed report per click.
        </h2>
        <p
          style={{
            margin: "20px auto 32px",
            maxWidth: 560,
            color: "var(--text-secondary)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          Bring your own wallet, or pick a curated demo. The pipeline runs
          end-to-end on real chain data — no mocks, no canned responses.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => nav("/atlas")}
          style={{ padding: "14px 28px", fontSize: 14 }}
        >
          Open the Atlas
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 7h8M7 3l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </section>

      <footer
        style={{
          padding: "32px 36px 32px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            color: "var(--text-tertiary)",
            fontSize: 11,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Mono>built for ETHGlobal Open Agents — Apr 24 → May 6 2026</Mono>
          <span>© 2026 LPLens · 42 Blockchain</span>
        </div>
      </footer>
    </div>
  );
}

interface StatProps {
  value: string;
  label: string;
  sub: string;
}

function Stat({ value, label, sub }: StatProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 32,
          fontWeight: 500,
          color: "var(--cyan)",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "var(--text-secondary)",
        }}
      >
        {label}
      </span>
      <Mono color="text-tertiary" style={{ fontSize: 10 }}>
        {sub}
      </Mono>
    </div>
  );
}

interface HowCardProps {
  n: string;
  label: string;
  title: string;
  desc: string;
}

function HowCard({ n, label, title, desc }: HowCardProps) {
  return (
    <div
      style={{
        position: "relative",
        padding: 28,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, var(--cyan), transparent)",
          opacity: 0.3,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 40,
        }}
      >
        <Mono color="text-tertiary" style={{ fontSize: 12 }}>
          {n}
        </Mono>
        <Cap style={{ color: "var(--cyan)" }}>{label}</Cap>
      </div>
      <h3
        style={{
          margin: "0 0 12px 0",
          fontFamily: "var(--font-display)",
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: 0,
          color: "var(--text-secondary)",
          fontSize: 13,
          lineHeight: 1.55,
          textWrap: "pretty",
        }}
      >
        {desc}
      </p>
    </div>
  );
}

interface TrustItemProps {
  name: string;
  sub: string;
}

function TrustItem({ name, sub }: TrustItemProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 14,
          color: "var(--text)",
          letterSpacing: "-0.01em",
        }}
      >
        {name}
      </span>
      <Mono color="text-tertiary" style={{ fontSize: 10 }}>
        {sub}
      </Mono>
    </div>
  );
}
