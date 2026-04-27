import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo.js";
import { HeroFilm } from "../components/HeroFilm.js";
import { Cap, Chip, Dot, Kbd, Mono, SectionHeader } from "../design/atoms.js";

export function Landing() {
  const nav = useNavigate();
  return (
    <div>
      <section
        style={{
          position: "relative",
          minHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          paddingTop: 24,
        }}
      >
        <HeroFilm />

        <header
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 36px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              LPLens
            </span>
            <Chip tone="cyan" style={{ marginLeft: 4 }}>
              v0.9 · ALPHA
            </Chip>
          </div>
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            <button onClick={() => nav("/atlas")} style={{ color: "inherit" }}>
              Dashboard
            </button>
            <button onClick={() => nav("/atlas")} className="btn btn-primary">
              Connect wallet
            </button>
          </nav>
        </header>

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
                NODE-04 / us-west / SGX attested
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
              LPLens is an autonomous agent on 0G that reads your Uniswap V3 position,
              reconstructs your impermanent loss live, simulates every V4 hook against
              the last 10,000 swaps, and migrates you in a single Permit2 signature.
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
                onClick={() => nav("/atlas")}
                style={{ padding: "14px 22px", fontSize: 14 }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M5.5 4.5L9.5 7L5.5 9.5V4.5Z" fill="currentColor" />
                </svg>
                Watch the diagnosis
                <Mono color="text-tertiary" style={{ fontSize: 11, marginLeft: 4 }}>
                  2:48
                </Mono>
              </button>
              <div
                style={{
                  marginLeft: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--text-tertiary)",
                  fontSize: 12,
                }}
              >
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
                <span>to search</span>
              </div>
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
            <div style={{ width: 40, height: 1, background: "var(--border-strong)" }} />
            <Cap>Scroll · how it works</Cap>
            <div style={{ width: 40, height: 1, background: "var(--border-strong)" }} />
          </div>
        </div>
      </section>

      <section style={{ padding: "80px 36px", maxWidth: 1400, margin: "0 auto" }}>
        <SectionHeader
          label="METHOD · 3 PHASES"
          title="A lens, not a dashboard."
          aside={
            <div style={{ maxWidth: 380, color: "var(--text-secondary)", fontSize: 13 }}>
              Every position ships with a signed, reproducible diagnosis. You keep
              the verdict; your keys never leave your wallet.
            </div>
          }
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20,
            marginTop: 32,
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
            title="Replay every V4 hook, in a sealed enclave."
            desc="Candidate hooks are executed against the exact swap stream your pool experienced. Counterfactual P&L, fee capture, and LVR are measured."
          />
          <HowCard
            n="03"
            label="MIGRATE"
            title="One signature. Three on-chain moves."
            desc="Close V3 → swap → mint V4, bundled through Permit2. Report signed inside the TEE, pinned to 0G Storage, anchored to 0G Chain for audit."
          />
        </div>
      </section>

      <section
        style={{
          padding: "40px 36px",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          background: "rgba(15, 22, 40, 0.5)",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 40,
            flexWrap: "wrap",
          }}
        >
          <Cap style={{ color: "var(--text-tertiary)" }}>INSTRUMENT STACK</Cap>
          <TrustItem name="0G Compute TEE" sub="SGX · attested" />
          <TrustItem name="Uniswap V3 / V4" sub="mainnet · arbitrum" />
          <TrustItem name="Permit2" sub="bundled signatures" />
          <TrustItem name="MCP" sub="agent-callable" />
          <TrustItem name="ERC-7857" sub="iNFT agent profile" />
          <TrustItem name="x402" sub="USDC billing" />
        </div>
      </section>

      <footer
        style={{
          padding: "80px 36px 40px",
          borderTop: "1px solid var(--border)",
          marginTop: 80,
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            color: "var(--text-tertiary)",
            fontSize: 11,
            paddingTop: 24,
            borderTop: "1px solid var(--border-faint)",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Mono>
            rootHash 0x7ac4f6…b812 · signed · {new Date().toISOString().slice(0, 10)}
          </Mono>
          <span>© 2026 LPLens Labs</span>
        </div>
      </footer>
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
          background: "linear-gradient(90deg, transparent, var(--cyan), transparent)",
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
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
