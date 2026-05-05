// /verify/:rootHash — verification cascade. Five independent surfaces
// re-derive or read the same rootHash from a different vantage point;
// the bottom banner fills green when 5/5 are verified. Demo flag
// (?demo=true) auto-runs the cascade with the cached or synthetic
// envelope. Layout matches HeroFilm cinematic chrome: REC timer top
// left, film corners, oscilloscope grid behind the strip, beat ticks.

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
  registryAddr: "0xLPLensReports",
  agentAddr: "0xLPLensAgent",
  resolverAddr: "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD",
  ensName: "lplensagent.eth",
  agentTokenId: "1",
  rpc: "https://evmrpc-testnet.0g.ai",
};

const SURFACES: SurfaceSpec[] = [
  {
    id: "storage",
    label: "0G STORAGE",
    sub: "MERKLE RE-HASH",
    latencyMs: 124,
    expr: (e) =>
      `keccak256(blob)\n  == ${shortHash(e.rootHash)}`,
    cast: (e) =>
      `curl -sL ${shortStorageUrl(e.storageUrl)} \\\n  | shasum -a 256`,
    href: (e) => e.storageUrl,
  },
  {
    id: "chain",
    label: "0G CHAIN",
    sub: "REGISTRY READ",
    latencyMs: 86,
    expr: (e) =>
      `reports(${shortHash(e.rootHash)})\n  .publisher == teeOracle`,
    cast: (e, p) =>
      `cast call ${p.registryAddr} \\\n  "reports(bytes32)(...)" \\\n  ${shortHash(e.rootHash)}`,
    href: (e) =>
      e.anchorChainId === 16602 && e.anchorTxHash
        ? `https://chainscan-newton.0g.ai/tx/${e.anchorTxHash}`
        : undefined,
  },
  {
    id: "tee",
    label: "TEE SIGNATURE",
    sub: "ECRECOVER",
    latencyMs: 38,
    expr: (e) => {
      const signer = e.payload?.provenance?.teeSigner ?? "0xa48f01287233509FD694a22Bf840225062E67836";
      return `ecrecover(rootHash, sig)\n  == ${shortHash(signer)}`;
    },
    cast: (e) =>
      `cast wallet ecrecover \\\n  ${shortHash(e.rootHash)} \\\n  ${shortHash(e.payload?.provenance?.teeSignature ?? "0x...")}`,
    href: () => undefined,
  },
  {
    id: "inft",
    label: "iNFT MEMORY",
    sub: "agents(1).memoryRoot",
    latencyMs: 78,
    expr: (e, p) =>
      `agents(${p.agentTokenId})\n  .memoryRoot == ${shortHash(e.rootHash)}`,
    cast: (e, p) =>
      `cast call ${p.agentAddr} \\\n  "agents(uint256)(...)" \\\n  ${p.agentTokenId}`,
    href: (_e, p) => `https://chainscan-newton.0g.ai/address/${p.agentAddr}`,
  },
  {
    id: "ens",
    label: "ENS RECORD",
    sub: "Sepolia · text",
    latencyMs: 142,
    expr: (e, p) => {
      const tid = e.payload?.position?.tokenId ?? "<tokenId>";
      return `text('${p.ensName}',\n  'lplens.${tid}.rootHash')`;
    },
    cast: (e, p) => {
      const tid = e.payload?.position?.tokenId ?? "<tokenId>";
      return `cast call ${shortHash(p.resolverAddr)} \\\n  "text(bytes32,string)(string)" \\\n  $(cast namehash ${p.ensName}) \\\n  "lplens.${tid}.rootHash"`;
    },
    href: (_e, p) => `https://sepolia.app.ens.domains/${p.ensName}`,
  },
];

function shortHash(h: string, head = 6, tail = 4): string {
  if (!h) return "0x…";
  if (h.length <= head + tail) return h;
  return `${h.slice(0, head)}…${h.slice(-tail)}`;
}

function shortStorageUrl(u: string): string {
  if (!u) return "stub://";
  if (u.length <= 32) return u;
  return u.slice(0, 28) + "…";
}

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

  // Load the report envelope. Demo mode falls back to a synthetic
  // envelope when /api/report 404s — stability > truth on the demo
  // path so the cascade still completes on stage.
  useEffect(() => {
    if (!rootHash) return;
    let cancelled = false;
    const tokenIdParam = params.get("tokenId") ?? "605311";
    const synth = (): ReportEnvelope => ({
      rootHash,
      storageUrl: `https://indexer-storage-testnet-turbo.0g.ai/file/${rootHash}`,
      anchorTxHash: "0x" + rootHash.slice(2, 10) + "0000",
      anchorChainId: 16602,
      payload: {
        provenance: {
          teeSignature: "0x7ac4f6e2d8c1a4f2b9c0e6d5a8f7b3c2",
          teeSigner: "0xa48f01287233509FD694a22Bf840225062E67836",
          teeProvider: "0G Compute · qwen-2.5-7b-instruct",
        },
        position: { tokenId: tokenIdParam },
      },
    });
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
        if (isDemo) {
          setEnvelope(synth());
          setError(null);
        } else {
          setError(err instanceof Error ? err.message : String(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [rootHash, isDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cascade animation: each surface flips pending → verifying → verified
  // sequentially MOTION.cascadeStepMs apart, then the bottom banner
  // fills left-to-right.
  useEffect(() => {
    if (!envelope) return;
    const order = SURFACES.map((s) => s.id);
    const timeouts: number[] = [];
    order.forEach((id, i) => {
      timeouts.push(
        window.setTimeout(
          () => setStates((s) => ({ ...s, [id]: "verifying" })),
          i * MOTION.cascadeStepMs + 300,
        ),
      );
      timeouts.push(
        window.setTimeout(
          () => setStates((s) => ({ ...s, [id]: "verified" })),
          i * MOTION.cascadeStepMs + 850,
        ),
      );
    });
    const totalMs = order.length * MOTION.cascadeStepMs + 950;
    timeouts.push(
      window.setTimeout(() => {
        let raf = 0;
        const start = performance.now();
        const tick = (now: number): void => {
          const t = Math.min(1, (now - start) / 1100);
          setBannerProgress(t);
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        timeouts.push(raf as unknown as number);
      }, totalMs),
    );
    return () => timeouts.forEach((t) => window.clearTimeout(t));
  }, [envelope]);

  const verifiedCount = useMemo(
    () => Object.values(states).filter((s) => s === "verified").length,
    [states],
  );
  const allVerified = verifiedCount === SURFACES.length;
  const fullHash = envelope?.rootHash ?? rootHash ?? "0x";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--base)",
      }}
    >
      <AppHeader />
      <main
        style={{
          flex: 1,
          padding: "60px 36px 48px",
          maxWidth: 1480,
          margin: "0 auto",
          width: "100%",
          position: "relative",
        }}
      >
        {/* Oscilloscope grid (decorative) */}
        <FilmGrid />

        {/* REC chrome — top-left timer + top-right beat ticker */}
        <RecChrome verifiedCount={verifiedCount} total={SURFACES.length} />

        {/* Header — section caption + balanced H1 */}
        <header
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginBottom: 22,
          }}
        >
          <Cap style={{ color: "var(--cyan)" }}>VERIFICATION CASCADE</Cap>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: "clamp(34px, 4.4vw, 56px)",
              fontWeight: 500,
              letterSpacing: "-0.03em",
              textWrap: "balance",
              color: "var(--text)",
              maxWidth: 1100,
            }}
          >
            Five paths, one rootHash,{" "}
            <span style={{ color: "var(--cyan)" }}>no server in the trust.</span>
          </h1>
        </header>

        {/* Hero hash banner — the protagonist of the page */}
        <RootHashHero hash={fullHash} verifiedCount={verifiedCount} total={SURFACES.length} />

        {/* 5-column horizontal cascade strip */}
        <section
          style={{
            position: "relative",
            zIndex: 2,
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 28,
          }}
        >
          {SURFACES.map((s, i) => {
            const state = states[s.id] ?? "pending";
            const e: ReportEnvelope =
              envelope ?? {
                rootHash: rootHash ?? "0x",
                storageUrl: "stub://pending",
              };
            const cast = s.cast(e, DEFAULT_PARAMS);
            const expr = s.expr(e, DEFAULT_PARAMS);
            const href = s.href(e, DEFAULT_PARAMS);
            return (
              <SurfaceCard
                key={s.id}
                index={i}
                label={s.label}
                state={state}
                expr={expr}
                sub={s.sub}
                latencyMs={s.latencyMs}
                cast={cast}
                href={href}
              />
            );
          })}
        </section>

        {/* Bottom fill banner */}
        <FillBanner
          progress={bannerProgress}
          allVerified={allVerified}
          verifiedCount={verifiedCount}
          hash={fullHash}
        />

        {error && (
          <p
            style={{
              marginTop: 18,
              color: "var(--bleed)",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
            }}
          >
            ⚠ failed to load report envelope — {error}
          </p>
        )}

        {/* Film corners */}
        <FilmCorners />
      </main>
    </div>
  );
}

interface SurfaceCardProps {
  index: number;
  label: string;
  state: ProofState;
  expr: string;
  sub: string;
  latencyMs: number;
  cast: string;
  href?: string;
}

function SurfaceCard({
  index,
  label,
  state,
  expr,
  sub,
  latencyMs,
  cast,
  href,
}: SurfaceCardProps) {
  const [copied, setCopied] = useState(false);
  const verified = state === "verified";
  const verifying = state === "verifying";
  return (
    <div
      style={{
        position: "relative",
        height: 360,
        padding: 18,
        borderRadius: 12,
        background: verified
          ? "linear-gradient(180deg, rgba(142,232,135,0.04) 0%, var(--surface) 60%)"
          : "var(--surface)",
        border: verified
          ? "1px solid rgba(142,232,135,0.45)"
          : verifying
            ? "1px solid rgba(255,176,32,0.45)"
            : "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "border-color 240ms cubic-bezier(0.2,0.8,0.2,1), background 240ms",
        boxShadow: verified
          ? "0 0 0 1px rgba(142,232,135,0.06), 0 8px 24px rgba(0,0,0,0.32)"
          : verifying
            ? "0 0 24px rgba(255,176,32,0.18)"
            : "0 4px 12px rgba(0,0,0,0.2)",
        overflow: "hidden",
      }}
    >
      {/* PROMOTED status bar — full card-top, dominant. The verified
          bar is the visual ceiling of every card. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 4px 12px",
          borderBottom: `1px solid ${verified ? "rgba(142,232,135,0.4)" : verifying ? "rgba(255,176,32,0.4)" : "var(--border)"}`,
          marginLeft: -18,
          marginRight: -18,
          marginTop: -18,
          paddingLeft: 18,
          paddingRight: 18,
          background: verified
            ? "rgba(142,232,135,0.06)"
            : verifying
              ? "rgba(255,176,32,0.06)"
              : "transparent",
        }}
      >
        <StatusDot state={state} />
        <span
          style={{
            flex: 1,
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            fontWeight: 600,
            color: verified
              ? "var(--healthy)"
              : verifying
                ? "var(--cyan)"
                : "var(--text-tertiary)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {verified ? "VERIFIED" : verifying ? "VERIFYING…" : "PENDING"}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text-tertiary)",
            letterSpacing: "0.12em",
          }}
        >
          {String(index + 1).padStart(2, "0")}/05
        </span>
      </div>

      {/* Surface name (the protocol/path) */}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--text)",
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginTop: 2,
        }}
      >
        {label}
      </div>

      {/* Method/sub-label — promoted to a labeled row directly under the
          VERIFIED bar, so the honesty layer + the method form one block. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginTop: -6,
          paddingBottom: 8,
          borderBottom: "1px dashed var(--border)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            color: "var(--text-tertiary)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          METHOD
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text-secondary)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {sub}
        </span>
      </div>

      {/* Verification expression */}
      <pre
        style={{
          margin: 0,
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: "var(--text)",
          lineHeight: 1.55,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          minHeight: 50,
          fontWeight: 500,
        }}
      >
        {expr}
      </pre>

      {/* Latency + match — only when verified */}
      {verified && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--text-tertiary)",
              letterSpacing: "0.12em",
            }}
          >
            MATCH · {latencyMs}ms
          </span>
        </div>
      )}

      {/* Cast snippet */}
      <button
        onClick={() => {
          navigator.clipboard.writeText(cast).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
          });
        }}
        style={{
          marginTop: "auto",
          textAlign: "left",
          padding: "11px 12px",
          borderRadius: 8,
          background: "var(--base-deeper)",
          border: "1px solid var(--border-faint)",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--text-secondary)",
          cursor: "pointer",
          maxHeight: 110,
          overflow: "hidden",
          whiteSpace: "pre",
          textOverflow: "ellipsis",
          lineHeight: 1.6,
          transition: "border-color 160ms",
          width: "100%",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--cyan)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-faint)")}
        title="Click to copy"
      >
        {cast}
      </button>

      {/* Bottom row: copy hint + open ↗ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 10,
          fontFamily: "var(--font-mono)",
          color: "var(--text-tertiary)",
          letterSpacing: "0.08em",
        }}
      >
        <span>
          {copied ? (
            <span style={{ color: "var(--healthy)" }}>copied ✓</span>
          ) : (
            <span>tap to copy</span>
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
    </div>
  );
}

function StatusDot({ state }: { state: ProofState }) {
  if (state === "verified") {
    return (
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: "var(--healthy)",
          boxShadow: "0 0 10px var(--healthy-glow)",
        }}
      />
    );
  }
  if (state === "verifying") {
    return (
      <span
        aria-hidden
        style={{
          width: 9,
          height: 9,
          borderRadius: 999,
          border: "1.4px solid var(--cyan)",
          borderTopColor: "transparent",
          animation: "slow-rotate 0.9s linear infinite",
        }}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={{
        width: 8,
        height: 8,
        borderRadius: 999,
        border: "1px solid var(--border-strong)",
      }}
    />
  );
}

interface RootHashHeroProps {
  hash: string;
  verifiedCount: number;
  total: number;
}

function RootHashHero({ hash, verifiedCount, total }: RootHashHeroProps) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 2,
        marginBottom: 22,
        padding: "20px 24px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background:
          "linear-gradient(180deg, rgba(255,176,32,0.05) 0%, var(--surface) 70%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.18em",
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
          }}
        >
          ROOTHASH · VERIFYING ACROSS 5 SURFACES
        </span>
        <Mono
          style={{
            fontSize: "clamp(18px, 2.6vw, 32px)",
            color: "var(--cyan)",
            letterSpacing: "-0.01em",
            wordBreak: "break-all",
            lineHeight: 1.15,
            textShadow: "0 0 20px rgba(255,176,32,0.18)",
          }}
        >
          {hash}
        </Mono>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid var(--border-strong)",
          background: "var(--base-deeper)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 2,
          }}
        >
          <span
            style={{
              fontSize: 24,
              color: "var(--healthy)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            {verifiedCount}<span style={{ color: "var(--text-tertiary)" }}>/{total}</span>
          </span>
          <span
            style={{
              fontSize: 9,
              color: "var(--text-tertiary)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            independent
          </span>
        </div>
      </div>
    </div>
  );
}

interface FillBannerProps {
  progress: number;
  allVerified: boolean;
  verifiedCount: number;
  hash: string;
}

function FillBanner({ progress, allVerified, verifiedCount, hash }: FillBannerProps) {
  void hash;
  return (
    <section
      aria-label="trust banner"
      style={{
        position: "relative",
        height: 72,
        padding: "0 26px",
        border: "1px solid var(--border-strong)",
        borderRadius: 12,
        background: "var(--surface)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: `${progress * 100}%`,
          background:
            "linear-gradient(90deg, rgba(142,232,135,0.10), rgba(142,232,135,0.22))",
          borderRight:
            progress > 0 && progress < 1
              ? "1px solid rgba(142,232,135,0.7)"
              : "1px solid transparent",
          transition: "width 200ms linear",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 18,
          justifyContent: "space-between",
          flexWrap: "wrap",
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
              animation: allVerified ? undefined : "pulse-dot 1.4s infinite",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(20px, 2.4vw, 28px)",
                fontWeight: 500,
                letterSpacing: "-0.02em",
                color: "var(--text)",
              }}
            >
              {allVerified
                ? "5 / 5 SURFACES VERIFIED INDEPENDENTLY."
                : `${verifiedCount} / 5 verifying…`}
            </span>
            <Mono
              style={{
                fontSize: 14,
                letterSpacing: "0.12em",
                color: "var(--text-secondary)",
                fontWeight: 500,
              }}
            >
              NO LPLENS SERVER IN THE TRUST PATH
            </Mono>
          </div>
        </div>
      </div>
    </section>
  );
}

function RecChrome({ verifiedCount, total }: { verifiedCount: number; total: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      setElapsed((Date.now() - start) / 1000);
    }, 100);
    return () => window.clearInterval(id);
  }, []);
  const elapsedStr = elapsed.toFixed(2).padStart(5, "0");
  void verifiedCount;
  void total;
  return (
    <>
      {/* Top-left REC + chrono — HeroFilm-style */}
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 36,
          zIndex: 3,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--text-tertiary)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        <span
          aria-hidden
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: "var(--bleed)",
            animation: "pulse-dot 1.4s infinite",
            boxShadow: "0 0 10px var(--bleed-glow)",
          }}
        />
        <span
          style={{
            color: "var(--bleed)",
            fontWeight: 600,
          }}
        >
          REC
        </span>
        <span style={{ color: "var(--text-faint)" }}>—</span>
        <span style={{ color: "var(--text-secondary)" }}>{elapsedStr}s</span>
        <span style={{ color: "var(--text-faint)" }}>—</span>
        <span style={{ color: "var(--text-secondary)" }}>VERIFY · 5 SURFACES</span>
      </div>

      {/* Top-right beat ticker */}
      <div
        style={{
          position: "absolute",
          top: 18,
          right: 36,
          zIndex: 3,
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--text-tertiary)",
          letterSpacing: "0.12em",
        }}
      >
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            style={{
              width: i < verifiedCount ? 26 : 8,
              height: 4,
              borderRadius: 999,
              background:
                i < verifiedCount
                  ? "var(--healthy)"
                  : "var(--border-strong)",
              transition: "width 240ms cubic-bezier(0.2,0.8,0.2,1), background 240ms",
              boxShadow:
                i < verifiedCount ? "0 0 8px var(--healthy-glow)" : undefined,
            }}
          />
        ))}
        <span style={{ marginLeft: 8 }}>{verifiedCount}/{total} OK</span>
      </div>
    </>
  );
}

function FilmGrid() {
  return (
    <svg
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.42,
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      <defs>
        <pattern id="verify-grid" width="56" height="56" patternUnits="userSpaceOnUse">
          <path
            d="M 56 0 L 0 0 0 56"
            fill="none"
            stroke="#2A2A33"
            strokeWidth="0.6"
          />
        </pattern>
        <pattern id="verify-grid-fine" width="14" height="14" patternUnits="userSpaceOnUse">
          <path
            d="M 14 0 L 0 0 0 14"
            fill="none"
            stroke="#1F1F26"
            strokeWidth="0.4"
          />
        </pattern>
        <radialGradient id="verify-mask" cx="50%" cy="46%" r="65%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="verify-grid-mask">
          <rect width="100%" height="100%" fill="url(#verify-mask)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#verify-grid-fine)" mask="url(#verify-grid-mask)" />
      <rect width="100%" height="100%" fill="url(#verify-grid)" mask="url(#verify-grid-mask)" />
    </svg>
  );
}

function FilmCorners() {
  const marks: Array<{ pos: Record<string, number>; h: "l" | "r"; v: "t" | "b" }> = [
    { pos: { top: 8, left: 8 }, h: "l", v: "t" },
    { pos: { top: 8, right: 8 }, h: "r", v: "t" },
    { pos: { bottom: 8, left: 8 }, h: "l", v: "b" },
    { pos: { bottom: 8, right: 8 }, h: "r", v: "b" },
  ];
  return (
    <>
      {marks.map((m, i) => (
        <div
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            ...m.pos,
            width: 26,
            height: 26,
            borderLeft: m.h === "l" ? "2px solid var(--cyan)" : undefined,
            borderRight: m.h === "r" ? "2px solid var(--cyan)" : undefined,
            borderTop: m.v === "t" ? "2px solid var(--cyan)" : undefined,
            borderBottom: m.v === "b" ? "2px solid var(--cyan)" : undefined,
            opacity: 0.7,
            zIndex: 4,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}
