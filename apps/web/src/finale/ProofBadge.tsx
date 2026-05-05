// Single source of truth for hash + explorer-link UX. Three states:
// pending (dim), verifying (cyan ring pulse), verified (solid amber +
// green check, clickable). Used across /diagnose, /verify, /finale.

import type { CSSProperties } from "react";
import { Mono } from "../design/atoms.js";
import { EASE, MOTION } from "./tokens.js";

export type ProofState = "pending" | "verifying" | "verified" | "failed";

interface Props {
  label: string;
  /** Truncated or full hash/string the badge anchors to. */
  hash?: string;
  /** Optional explorer URL — when set, the verified badge becomes a link. */
  href?: string;
  state: ProofState;
  /** Size variant. Default 'md'. */
  size?: "sm" | "md" | "lg";
  /** Optional latency in ms (rendered as `123 ms`). */
  latencyMs?: number;
  style?: CSSProperties;
  /** Optional sub-label below the hash (e.g. "MATCH"). */
  sub?: string;
}

const PADDING = { sm: "6px 10px", md: "10px 14px", lg: "14px 18px" } as const;
const HASH_FS = { sm: 11, md: 12, lg: 13 } as const;
const LABEL_FS = { sm: 9, md: 10, lg: 10 } as const;

export function ProofBadge({
  label,
  hash,
  href,
  state,
  size = "md",
  latencyMs,
  style,
  sub,
}: Props) {
  const verified = state === "verified";
  const verifying = state === "verifying";
  const failed = state === "failed";
  const stripe =
    state === "verified"
      ? "var(--healthy)"
      : state === "verifying"
        ? "var(--cyan)"
        : state === "failed"
          ? "var(--bleed)"
          : "var(--border-strong)";
  const body = (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        flexDirection: "column",
        gap: 4,
        padding: PADDING[size],
        borderRadius: 8,
        border: `1px solid ${verified ? "rgba(142,232,135,0.35)" : verifying ? "rgba(255,176,32,0.35)" : failed ? "rgba(255,94,79,0.35)" : "var(--border)"}`,
        background: verified
          ? "rgba(142,232,135,0.06)"
          : verifying
            ? "rgba(255,176,32,0.06)"
            : "var(--surface)",
        transition: `border-color 240ms ${EASE.signal}, background 240ms ${EASE.signal}`,
        cursor: href && verified ? "pointer" : "default",
        textDecoration: "none",
        color: "inherit",
        animation:
          state === "verified"
            ? `pulse-soft ${MOTION.badgeFlashMs}ms ${EASE.signal} 1`
            : undefined,
        ...style,
      }}
    >
      {/* status stripe */}
      <span
        style={{
          position: "absolute",
          top: -1,
          left: -1,
          width: 3,
          bottom: -1,
          background: stripe,
          borderRadius: "8px 0 0 8px",
          opacity: verified ? 0.95 : verifying ? 0.7 : 0.35,
          boxShadow: verifying
            ? "0 0 12px var(--cyan-glow)"
            : verified
              ? "0 0 10px var(--healthy-glow)"
              : undefined,
        }}
      />
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: LABEL_FS[size],
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: verified ? "var(--healthy)" : verifying ? "var(--cyan)" : failed ? "var(--bleed)" : "var(--text-tertiary)",
          fontWeight: 500,
        }}
      >
        <ProofIcon state={state} />
        <span>{label}</span>
        {typeof latencyMs === "number" && verified && (
          <Mono color="text-tertiary" style={{ fontSize: LABEL_FS[size], textTransform: "none", letterSpacing: 0 }}>
            {latencyMs} ms
          </Mono>
        )}
      </div>
      {hash && (
        <Mono
          style={{
            fontSize: HASH_FS[size],
            color: verified ? "var(--text)" : "var(--text-secondary)",
          }}
        >
          {hash}
        </Mono>
      )}
      {sub && (
        <span
          style={{
            fontSize: 10,
            color: verified ? "var(--healthy)" : "var(--text-tertiary)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
  if (href && verified) {
    return (
      <a href={href} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
        {body}
      </a>
    );
  }
  return body;
}

function ProofIcon({ state }: { state: ProofState }) {
  if (state === "verified") {
    return (
      <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden>
        <circle cx="5.5" cy="5.5" r="5" fill="var(--healthy)" opacity="0.18" />
        <path d="M3 5.6 L4.7 7.2 L8 4" stroke="var(--healthy)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (state === "verifying") {
    return (
      <span
        style={{
          width: 11,
          height: 11,
          display: "inline-block",
          borderRadius: 999,
          border: "1.4px solid var(--cyan)",
          borderTopColor: "transparent",
          animation: "slow-rotate 0.9s linear infinite",
          boxShadow: "0 0 8px var(--cyan-glow)",
        }}
      />
    );
  }
  if (state === "failed") {
    return (
      <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden>
        <circle cx="5.5" cy="5.5" r="5" fill="var(--bleed)" opacity="0.18" />
        <path d="M3.4 3.4 L7.6 7.6 M7.6 3.4 L3.4 7.6" stroke="var(--bleed)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <span
      aria-hidden
      style={{
        width: 9,
        height: 9,
        borderRadius: 999,
        border: "1px solid var(--border-strong)",
        background: "transparent",
      }}
    />
  );
}
