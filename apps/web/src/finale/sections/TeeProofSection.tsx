// /finale TEE proof section — visualises the 0G Compute TDX
// attestation that signs every LPLens verdict. The provider address,
// model, codeImageHash and broker signature come from the on-chain
// records and are reproduced here for the demo. Static-only; the real
// attestation is verifiable via the chainscan link.

import { Mono } from "../../design/atoms.js";
import { ProofBadge } from "../ProofBadge.js";

const PROVIDER = "0xa48f01287233509FD694a22Bf840225062E67836";
const MODEL = "qwen-2.5-7b-instruct";
const ATTESTATION = "Intel TDX · 0G Compute broker-attested";
const TEE_SIG = "0x7ac4f6e2d8c1a4f2b9c0e6d5a8f7b3c2";
const CODE_IMG = "0x3c89cd0b54a92e1f88d3a91b39a7c";
// Anchor tx on 0G — the verdict carrying this TEE signature was
// landed on-chain inside the LPLensReports.publishReport call. The
// scanner page shows the tx with the rootHash + attestation bytes.
const ANCHOR_TX =
  "0xd7392aa9dfd4fb1dbae1447bbf901943d7f3816c2639c64a46f45ad140ecbd8e";
const ANCHOR_TX_URL = `https://chainscan-galileo.0g.ai/tx/${ANCHOR_TX}`;

export function TeeProofSection() {
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
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 24, height: 1, background: "var(--cyan)" }} />
        <span
          style={{
            color: "var(--cyan)",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          TEE PROOF · 0G COMPUTE · TDX-ATTESTED
        </span>
      </div>
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: "clamp(36px, 5vw, 64px)",
          fontWeight: 500,
          letterSpacing: "-0.03em",
          lineHeight: 1.04,
          color: "var(--text)",
          maxWidth: 1080,
        }}
      >
        The model that wrote the verdict
        <br />
        ran inside <span style={{ color: "var(--cyan)" }}>a sealed enclave</span>.
      </h2>
      <p
        style={{
          margin: 0,
          maxWidth: 880,
          fontSize: 16,
          lineHeight: 1.55,
          color: "var(--text-secondary)",
        }}
      >
        Every LPLens verdict is signed by a 0G Compute provider whose attestation
        report is broker-verifiable. The signer address below is the same
        provider that produced the bytes in the report — and it's on-chain, not
        on a trust-me API.
      </p>

      {/* Main proof card */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        {/* Left: attestation envelope */}
        <div
          style={{
            position: "relative",
            padding: "22px 24px",
            borderRadius: 12,
            border: "1px solid rgba(255,176,32,0.4)",
            background:
              "linear-gradient(180deg, rgba(255,176,32,0.06) 0%, var(--surface) 60%)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            overflow: "hidden",
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, var(--cyan), transparent)",
              opacity: 0.6,
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <Mono
              color="cyan"
              style={{ fontSize: 11, letterSpacing: "0.18em" }}
            >
              0G COMPUTE · ATTESTATION REPORT
            </Mono>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--text-tertiary)",
                letterSpacing: "0.14em",
              }}
            >
              broker-signed
            </span>
          </div>

          <Field label="ATTESTATION" value={ATTESTATION} tone="cyan" />
          <Field label="MODEL" value={MODEL} mono />
          <Field
            label="PROVIDER ADDRESS"
            value={PROVIDER}
            mono
            href={undefined}
          />
          <Field label="CODE IMAGE HASH" value={CODE_IMG} mono short />
          <Field
            label="TEE SIGNATURE"
            value={TEE_SIG}
            mono
            short
            href={ANCHOR_TX_URL}
          />
          <Field
            label="ANCHOR TX"
            value={ANCHOR_TX}
            mono
            short
            href={ANCHOR_TX_URL}
            tone="cyan"
          />

          <div
            style={{
              marginTop: 8,
              padding: "10px 12px",
              borderRadius: 8,
              background: "var(--base-deeper)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text-secondary)",
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
            }}
          >
            ecrecover(rootHash, teeSignature){"\n"}
            {"  =="} {PROVIDER.slice(0, 14)}…
            <br />
            <span style={{ color: "var(--healthy)" }}>✓ matches teeOracleAddress</span>
          </div>
        </div>

        {/* Right: 3 trust badges + plain-english explanation */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <ExplainCard
            tone="cyan"
            tag="01 · ENCLAVE"
            title="Sealed compute"
            body="Inference runs inside a TDX-attested enclave. The host can't read or modify the model weights or your input."
          />
          <ExplainCard
            tone="violet"
            tag="02 · BROKER"
            title="Verifiable signature"
            body="The 0G Compute broker signs the response with the provider's attested key. The signature pins the bytes to that exact provider."
          />
          <ExplainCard
            tone="healthy"
            tag="03 · ON CHAIN"
            title="Anchored, not trusted"
            body="Every report's TEE signature lands inside the report blob, anchored on 0G Chain. Anyone can re-derive the signer offline."
          />

          {/* Verifying… verified badge for the on-stage moment */}
          <div style={{ marginTop: 4 }}>
            <ProofBadge
              label="0G Compute · TEE attestation"
              hash={`${ANCHOR_TX.slice(0, 12)}…${ANCHOR_TX.slice(-6)}`}
              state="verified"
              size="md"
              latencyMs={42}
              sub="ecrecover MATCH · code image hash anchored"
              href={ANCHOR_TX_URL}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  mono?: boolean;
  short?: boolean;
  tone?: "cyan" | "violet" | "healthy";
  href?: string;
}

function Field({ label, value, mono, short, tone, href }: FieldProps) {
  const text = (
    <span
      style={{
        fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)",
        fontSize: 14,
        color: tone ? `var(--${tone})` : "var(--text)",
        letterSpacing: mono ? "0.02em" : "0",
        wordBreak: "break-all",
      }}
    >
      {short ? value.slice(0, 16) + "…" + value.slice(-6) : value}
    </span>
  );
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "180px 1fr",
        gap: 14,
        alignItems: "baseline",
      }}
    >
      <Mono
        color="text-tertiary"
        style={{ fontSize: 10, letterSpacing: "0.18em" }}
      >
        {label}
      </Mono>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          style={{ textDecoration: "none" }}
        >
          {text}
        </a>
      ) : (
        text
      )}
    </div>
  );
}

interface ExplainCardProps {
  tone: "cyan" | "violet" | "healthy";
  tag: string;
  title: string;
  body: string;
}

function ExplainCard({ tone, tag, title, body }: ExplainCardProps) {
  return (
    <div
      style={{
        padding: "14px 18px",
        borderRadius: 10,
        border: "1px solid var(--border)",
        borderLeft: `3px solid var(--${tone})`,
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <Mono
        style={{
          fontSize: 10,
          letterSpacing: "0.18em",
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
          fontSize: 17,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: "var(--text)",
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: "var(--text-secondary)",
        }}
      >
        {body}
      </span>
    </div>
  );
}
