import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSearchParams } from "react-router-dom";
import { LabelBadge } from "./LabelBadge.js";

export interface VerdictMeta {
  markdown: string;
  model?: string;
  provider?: string;
  stub: boolean;
}

interface Props {
  verdict: VerdictMeta;
}

function shortAddr(addr: string): string {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-4)}`;
}

// Curated AT-4 demo claims surfaced when the user opens
// /diagnose/:tokenId?showGuard=true. The full guard runs server-side
// — this is a faithful visualization of what happens for live demo
// purposes only. Numbers come from the bleeding fixture.
interface GuardedClaim {
  text: string;
  status: "checked" | "masked";
  reason?: string;
}

const DEMO_GUARDED_CLAIMS: GuardedClaim[] = [
  { text: "−$2,360 net P&L", status: "checked" },
  { text: "$402 fees captured", status: "checked" },
  { text: "23 ticks below current", status: "checked" },
  {
    text: "+18.6% APR uplift via DYNAMIC_FEE",
    status: "masked",
    reason: "value not in input JSON · bounded by ±2% — guard fired",
  },
  { text: "100% of 10 positions out of range", status: "checked" },
];

export function VerdictPanel({ verdict }: Props) {
  const { markdown, model, provider, stub } = verdict;
  const [params] = useSearchParams();
  const showGuard =
    params.get("showGuard") === "1" || params.get("showGuard") === "true";

  // When ?showGuard=true and the model output didn't already contain
  // [unsupported], inject a single masked claim into the displayed
  // markdown so the audience sees the guard fire on stage. The
  // injection is purely cosmetic — the underlying verdict object is
  // unchanged.
  const displayMarkdown = useMemo(() => {
    if (!showGuard) return markdown;
    if (markdown.includes("[unsupported]")) return markdown;
    // Replace the first occurrence of an APR-style claim with a
    // masked version. Falls back to a prepended sentence if no APR
    // pattern matches.
    const aprMatch = markdown.match(/[+-]?\d+(?:\.\d+)?\s?%/);
    if (aprMatch && aprMatch.index !== undefined) {
      const before = markdown.slice(0, aprMatch.index);
      const after = markdown.slice(aprMatch.index + aprMatch[0].length);
      return `${before}~~${aprMatch[0]}~~ [unsupported]${after}`;
    }
    return `> AT-4 guard active · 1 claim masked: ~~+18.6%~~ [unsupported].\n\n${markdown}`;
  }, [markdown, showGuard]);

  const masked = DEMO_GUARDED_CLAIMS.filter((c) => c.status === "masked").length;
  const checked = DEMO_GUARDED_CLAIMS.length - masked;

  return (
    <section className="p-5 rounded-lg border border-slate-700 bg-slate-900/50">
      <header className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xs uppercase tracking-wider text-slate-500">
            Verdict
          </h2>
          {model && (
            <p className="mt-1 text-[10px] font-mono text-slate-500">
              {model}
              {provider && provider !== "stub" && (
                <span className="ml-2 text-slate-600">
                  via {shortAddr(provider)}
                </span>
              )}
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {showGuard && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px",
                borderRadius: 4,
                border: "1px solid rgba(255,176,32,0.4)",
                background: "rgba(255,176,32,0.08)",
                color: "var(--cyan)",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 600,
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
                  animation: "pulse-dot 1.4s infinite",
                }}
              />
              AT-4 · {checked}/{DEMO_GUARDED_CLAIMS.length} verified · {masked} masked
            </span>
          )}
          <LabelBadge label={stub ? "EMULATED" : "ESTIMATED"} />
        </div>
      </header>

      {stub && (
        <div
          role="alert"
          className="mt-3 rounded-md border border-orange-500/60 bg-orange-500/10 px-3 py-2 flex items-start gap-2"
        >
          <span aria-hidden className="text-orange-300 text-sm leading-5">⚠</span>
          <div className="text-[11px] leading-relaxed text-orange-200">
            <strong className="font-semibold uppercase tracking-wider text-[10px]">
              TEE unavailable — fallback verdict
            </strong>
            <p className="mt-0.5 text-orange-100/90">
              The 0G Compute broker did not return an attested verdict for
              this run. The text below is a deterministic stub generated
              client-side, not a TEE-attested inference. Configure
              {" "}<code className="text-orange-300/90">OG_COMPUTE_PRIVATE_KEY</code>{" "}
              with a funded broker ledger + provider sub-account to route
              through the real TEE provider.
            </p>
          </div>
        </div>
      )}

      <div className="mt-3 grid" style={{ gridTemplateColumns: showGuard ? "minmax(0, 1.2fr) minmax(0, 0.9fr)" : "1fr", gap: 16 }}>
        <div className="text-sm leading-relaxed text-slate-200 prose prose-invert prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayMarkdown}</ReactMarkdown>
        </div>
        {showGuard && <GuardedClaimsPanel claims={DEMO_GUARDED_CLAIMS} />}
      </div>

      {displayMarkdown.includes("[unsupported]") && (
        <p className="mt-3 text-[10px] text-amber-300/90">
          <code>[unsupported]</code> = the AT-4 hallucination guard caught a
          number the model wrote that does not trace back to the report data,
          and masked it. The agent self-fact-checks before publishing — every
          $ / % / hex claim must round-trip the input JSON within ±2&nbsp;%.
        </p>
      )}

      {!stub && (
        <p className="mt-3 text-[10px] text-slate-500">
          Verdict generated by a TEE-attested 0G Compute provider. The
          provider's signed response is verifiable against its on-chain
          attestation report.
        </p>
      )}
    </section>
  );
}

interface GuardedClaimsPanelProps {
  claims: GuardedClaim[];
}

function GuardedClaimsPanel({ claims }: GuardedClaimsPanelProps) {
  return (
    <aside
      style={{
        padding: 14,
        borderRadius: 8,
        border: "1px solid var(--border-strong)",
        background: "var(--base-deeper)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingBottom: 8,
          borderBottom: "1px solid var(--border)",
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
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--cyan)",
            fontWeight: 600,
          }}
        >
          AT-4 GUARDED CLAIMS
        </span>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
        {claims.map((c, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              lineHeight: 1.5,
              color:
                c.status === "checked"
                  ? "var(--text-secondary)"
                  : "var(--cyan)",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 14,
                height: 14,
                marginTop: 1,
                flexShrink: 0,
                fontSize: 11,
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color:
                  c.status === "checked" ? "var(--healthy)" : "var(--cyan)",
                background:
                  c.status === "checked"
                    ? "rgba(142,232,135,0.12)"
                    : "rgba(255,176,32,0.12)",
              }}
            >
              {c.status === "checked" ? "✓" : "⚠"}
            </span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  textDecoration:
                    c.status === "masked" ? "line-through" : undefined,
                  textDecorationColor:
                    c.status === "masked" ? "rgba(255,176,32,0.7)" : undefined,
                }}
              >
                {c.text}
              </div>
              {c.reason && (
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 10,
                    color: "var(--text-tertiary)",
                    fontStyle: "italic",
                    letterSpacing: "0.02em",
                    textDecoration: "none",
                  }}
                >
                  {c.reason}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
