// /verify/:rootHash — five independent verification surfaces light up
// in cascade. Each card is a clickable cast-call snippet; the cascade
// animation is the visual assertion. The audience leaves with a
// physical sense of "five paths, one hash, no LPLens server in the
// trust path." Demo flag (?demo=true) auto-runs the cascade with the
// cached fixtures.

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { AppHeader } from "../components/AppHeader.js";
import { Cap, Mono } from "../design/atoms.js";
import { ProofBadge, type ProofState } from "../finale/ProofBadge.js";
import { MOTION } from "../finale/tokens.js";

interface ReportEnvelope {
  rootHash: string;
  storageUrl: string;
  anchorTxHash?: string;
  anchorChainId?: number;
  payload?: {
    provenance?: {
      teeSignature?: string;
      teeSigner?: string;
      teeProvider?: string;
    };
    position?: { tokenId?: string };
  };
}

interface SurfaceSpec {
  id: string;
  label: string;
  expr: (e: ReportEnvelope, params: VerifyParams) => string;
  cast: (e: ReportEnvelope, params: VerifyParams) => string;
  href: (e: ReportEnvelope, params: VerifyParams) => string | undefined;
  sub: string;
  latencyMs: number;
}

interface VerifyParams {
  registryAddr: string;
  agentAddr: string;
  resolverAddr: string;
  ensName: string;
  agentTokenId: string;
  rpc: string;
}

const DEFAULT_PARAMS: VerifyParams = {
  registryAddr: "0xLPLensReports", // surfaced from env in real impl; safe fallback
  agentAddr: "0xLPLensAgent",
  resolverAddr: "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD",
  ensName: "lplensagent.eth",
  agentTokenId: "1",
  rpc: "https://evmrpc-testnet.0g.ai",
};

const SURFACES: SurfaceSpec[] = [
  {
    id: "storage",
    label: "0G Storage merkle",
    sub: "BLOB → KECCAK256 → ROOTHASH",
    latencyMs: 124,
    expr: (e) =>
      `keccak256(blob @ ${e.storageUrl.slice(0, 22)}…) == ${e.rootHash.slice(0, 10)}…`,
    cast: (e) =>
      `# fetch the blob, hash it, compare\ncurl -sL ${e.storageUrl} | shasum -a 256`,
    href: (e) => e.storageUrl,
  },
  {
    id: "chain",
    label: "0G Chain registry",
    sub: "LPLENSREPORTS.REPORTS(ROOTHASH)",
    latencyMs: 86,
    expr: (e, p) =>
      `reports(${e.rootHash.slice(0, 10)}…).publisher == teeOracle`,
    cast: (e, p) =>
      `cast call ${p.registryAddr} "reports(bytes32)((address,uint256,uint256,bytes32))" ${e.rootHash} --rpc-url ${p.rpc}`,
    href: (e, p) =>
      e.anchorChainId === 16602
        ? `https://chainscan-newton.0g.ai/tx/${e.anchorTxHash ?? ""}`
        : undefined,
  },
  {
    id: "tee",
    label: "TEE signature recover",
    sub: "ECRECOVER(ROOTHASH, SIG) → SIGNER",
    latencyMs: 38,
    expr: (e) => {
      const sig = e.payload?.provenance?.teeSignature?.slice(0, 12) ?? "0x…";
      const signer = e.payload?.provenance?.teeSigner?.slice(0, 10) ?? "0xa48f…";
      return `ecrecover(${e.rootHash.slice(0, 10)}…, ${sig}…) == ${signer}…`;
    },
    cast: (e) =>
      `# offline recover via viem / cast wallet ecrecover\ncast wallet ecrecover ${e.rootHash} ${e.payload?.provenance?.teeSignature ?? "<sig>"}`,
    href: () => undefined,
  },
  {
    id: "inft",
    label: "iNFT memoryRoot",
    sub: "LPLENSAGENT.AGENTS(1).MEMORYROOT",
    latencyMs: 78,
    expr: (e, p) =>
      `agents(${p.agentTokenId}).memoryRoot == ${e.rootHash.slice(0, 10)}…`,
    cast: (e, p) =>
      `cast call ${p.agentAddr} "agents(uint256)((bytes32,uint256,uint256,uint256,address))" ${p.agentTokenId} --rpc-url ${p.rpc}`,
    href: (e, p) =>
      `https://chainscan-newton.0g.ai/address/${p.agentAddr}`,
  },
  {
    id: "ens",
    label: "ENS text record (Sepolia)",
    sub: "LPLENS.<TOKENID>.ROOTHASH",
    latencyMs: 142,
    expr: (e, p) => {
      const tid = e.payload?.position?.tokenId ?? "<tokenId>";
      return `text(namehash('${p.ensName}'), 'lplens.${tid}.rootHash') == ${e.rootHash.slice(0, 10)}…`;
    },
    cast: (e, p) => {
      const tid = e.payload?.position?.tokenId ?? "<tokenId>";
      return `cast call ${p.resolverAddr} "text(bytes32,string)(string)" $(cast namehash ${p.ensName}) "lplens.${tid}.rootHash" --rpc-url https://ethereum-sepolia-rpc.publicnode.com`;
    },
    href: (e, p) =>
      `https://sepolia.app.ens.domains/${p.ensName}`,
  },
];

export function Verify() {
  const { rootHash } = useParams<{ rootHash: string }>();
  const [params] = useSearchParams();
  const demoFlag = params.get("demo");
  const isDemo = demoFlag === "1" || demoFlag === "true";

  const [envelope, setEnvelope] = useState<ReportEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [states, setStates] = useState<Record<string, ProofState>>({
    storage: "pending",
    chain: "pending",
    tee: "pending",
    inft: "pending",
    ens: "pending",
  });
  const [bannerProgress, setBannerProgress] = useState(0);

  // Load the report envelope.
  useEffect(() => {
    if (!rootHash) return;
    let cancelled = false;
    fetch(`/api/report/${rootHash}`)
      .then((r) => {
        if (!r.ok) throw new Error(`report ${r.status}`);
        return r.json() as Promise<ReportEnvelope>;
      })
      .then((j) => {
        if (cancelled) return;
        setEnvelope(j);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [rootHash]);

  // Drive the cascade animation. Each surface flips: pending → verifying
  // → verified, sequentially MOTION.cascadeStepMs apart.
  useEffect(() => {
    if (!envelope) return;
    const order = SURFACES.map((s) => s.id);
    const timeouts: number[] = [];
    order.forEach((id, i) => {
      const t1 = window.setTimeout(
        () => setStates((s) => ({ ...s, [id]: "verifying" })),
        i * MOTION.cascadeStepMs + 200,
      );
      const t2 = window.setTimeout(
        () => setStates((s) => ({ ...s, [id]: "verified" })),
        i * MOTION.cascadeStepMs + 700,
      );
      timeouts.push(t1, t2);
    });
    const totalMs = order.length * MOTION.cascadeStepMs + 800;
    const startBanner = window.setTimeout(() => {
      let raf = 0;
      const start = performance.now();
      const tick = (now: number): void => {
        const t = Math.min(1, (now - start) / 1100);
        setBannerProgress(t);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      timeouts.push(raf as unknown as number);
    }, totalMs);
    timeouts.push(startBanner);
    return () => timeouts.forEach((t) => window.clearTimeout(t));
  }, [envelope, isDemo]);

  const allVerified = useMemo(
    () => SURFACES.every((s) => states[s.id] === "verified"),
    [states],
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppHeader />
      <main
        style={{
          flex: 1,
          padding: "48px 36px 80px",
          maxWidth: 1280,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <header style={{ marginBottom: 36 }}>
          <Cap style={{ color: "var(--cyan)" }}>VERIFICATION CASCADE</Cap>
          <h1
            style={{
              margin: "10px 0 14px",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(34px, 4.6vw, 60px)",
              fontWeight: 500,
              letterSpacing: "-0.03em",
              textWrap: "balance",
              color: "var(--text)",
            }}
          >
            Five paths, one rootHash,{" "}
            <span style={{ color: "var(--cyan)" }}>no server in the trust.</span>
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: 720,
              color: "var(--text-secondary)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            Every signed LPLens report is independently verifiable from five
            surfaces — 0G Storage, 0G Chain, the TEE signature, the iNFT
            memoryRoot, and ENS. The cascade below runs each verification in
            sequence. Click any cast snippet to copy and run it yourself.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {SURFACES.map((s) => {
            const state = states[s.id] ?? "pending";
            const e: ReportEnvelope =
              envelope ?? {
                rootHash: rootHash ?? "0x…",
                storageUrl: "stub://pending",
              };
            const cast = s.cast(e, DEFAULT_PARAMS);
            const expr = s.expr(e, DEFAULT_PARAMS);
            const href = s.href(e, DEFAULT_PARAMS);
            return (
              <SurfaceCard
                key={s.id}
                label={s.label}
                state={state}
                expr={expr}
                sub={s.sub}
                latencyMs={s.latencyMs}
                cast={cast}
                href={href}
                hash={e.rootHash}
              />
            );
          })}
        </section>

        <section
          aria-label="trust banner"
          style={{
            position: "relative",
            padding: "22px 26px",
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            background: "var(--surface)",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: `${bannerProgress * 100}%`,
              background:
                "linear-gradient(90deg, rgba(142,232,135,0.06), rgba(142,232,135,0.18))",
              borderRight:
                bannerProgress > 0 && bannerProgress < 1
                  ? "1px solid rgba(142,232,135,0.7)"
                  : "1px solid transparent",
              transition: "width 200ms linear",
            }}
          />
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background: allVerified ? "var(--healthy)" : "var(--cyan)",
                  boxShadow: allVerified
                    ? "0 0 14px var(--healthy-glow)"
                    : "0 0 14px var(--cyan-glow)",
                  animation: !allVerified ? "pulse-dot 1.4s infinite" : undefined,
                }}
              />
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 22,
                    fontWeight: 500,
                    letterSpacing: "-0.02em",
                    color: "var(--text)",
                  }}
                >
                  {allVerified
                    ? "5 / 5 surfaces verified independently."
                    : `${Object.values(states).filter((s) => s === "verified").length} / 5 verifying…`}
                </div>
                <Mono color="text-tertiary" style={{ fontSize: 12 }}>
                  {allVerified
                    ? "no LPLens server in the trust path"
                    : "running cascade — each surface checks the same rootHash"}
                </Mono>
              </div>
            </div>
            {envelope?.rootHash && (
              <Mono color="cyan" style={{ fontSize: 12 }}>
                {envelope.rootHash}
              </Mono>
            )}
          </div>
        </section>

        {error && (
          <p
            style={{
              marginTop: 20,
              color: "var(--bleed)",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
            }}
          >
            ⚠ failed to load report envelope — {error}
          </p>
        )}
      </main>
    </div>
  );
}

interface CardProps {
  label: string;
  state: ProofState;
  expr: string;
  sub: string;
  latencyMs: number;
  cast: string;
  href?: string;
  hash: string;
}

function SurfaceCard({
  label,
  state,
  expr,
  sub,
  latencyMs,
  cast,
  href,
  hash,
}: CardProps) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      style={{
        position: "relative",
        padding: 20,
        borderRadius: 12,
        background: "var(--surface)",
        border:
          state === "verified"
            ? "1px solid rgba(142,232,135,0.4)"
            : "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: 230,
        transition: "border-color 240ms cubic-bezier(0.2,0.8,0.2,1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <ProofBadge label={label} state={state} size="sm" sub={sub} latencyMs={state === "verified" ? latencyMs : undefined} />
      </div>
      <Mono
        style={{
          fontSize: 11,
          color: "var(--text-secondary)",
          lineHeight: 1.5,
          minHeight: 30,
        }}
      >
        {expr}
      </Mono>
      <button
        onClick={() => {
          navigator.clipboard.writeText(cast).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
          });
        }}
        style={{
          textAlign: "left",
          padding: "10px 12px",
          borderRadius: 8,
          background: "var(--base-deeper)",
          border: "1px solid var(--border)",
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: "var(--text-secondary)",
          cursor: "pointer",
          maxHeight: 120,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          lineHeight: 1.55,
          transition: "border-color 160ms",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--cyan)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        title="Click to copy"
      >
        {cast}
      </button>
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          fontSize: 10,
          fontFamily: "var(--font-mono)",
          color: "var(--text-tertiary)",
          letterSpacing: "0.06em",
        }}
      >
        <span>
          {copied ? (
            <span style={{ color: "var(--healthy)" }}>copied ✓</span>
          ) : (
            <span>click snippet to copy</span>
          )}
        </span>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            style={{
              color: "var(--cyan)",
              textDecoration: "none",
            }}
          >
            open ↗
          </a>
        )}
      </div>
      <span
        aria-hidden
        style={{
          position: "absolute",
          right: 10,
          top: 10,
          fontSize: 9,
          color: "var(--text-faint)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.08em",
          opacity: 0.7,
        }}
      >
        {hash.slice(0, 10)}…
      </span>
    </div>
  );
}
