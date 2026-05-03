import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo.js";
import { Chip } from "../design/atoms.js";
import { ConnectButton } from "./ConnectButton.js";

interface NavItem {
  to: string;
  label: string;
  matches?: (path: string) => boolean;
}

const NAV: NavItem[] = [
  {
    to: "/atlas",
    label: "Atlas",
    matches: (p) =>
      p.startsWith("/atlas") ||
      p.startsWith("/diagnose") ||
      p.startsWith("/report"),
  },
  { to: "/agent", label: "Agent", matches: (p) => p.startsWith("/agent") },
  {
    to: "/developers",
    label: "Developers",
    matches: (p) => p.startsWith("/developers"),
  },
  {
    to: "https://github.com/JeanBaptisteDurand/Open_Agent_2026/blob/main/FEEDBACK.md",
    label: "Feedback",
  },
];

interface Props {
  /** Optional slot for page-specific items rendered to the left of
   *  the Connect wallet button (e.g. a status pill on a live page). */
  right?: ReactNode;
  /** When true the header is rendered as overlay (transparent, no
   *  border) for the Landing hero. Default sticky + opaque for app
   *  pages. */
  variant?: "app" | "overlay";
}

export function AppHeader({ right, variant = "app" }: Props) {
  const { pathname } = useLocation();
  const isOverlay = variant === "overlay";
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 36px",
        borderBottom: isOverlay ? "none" : "1px solid var(--border)",
        background: isOverlay ? "transparent" : "rgba(11, 11, 14, 0.82)",
        backdropFilter: isOverlay ? undefined : "blur(12px)",
        position: isOverlay ? "relative" : "sticky",
        top: isOverlay ? undefined : 0,
        zIndex: isOverlay ? 2 : 40,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: "var(--text)",
            textDecoration: "none",
          }}
        >
          <Logo />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            LPLens
          </span>
          <Chip tone="cyan" style={{ marginLeft: 4 }}>
            v0.9 · ALPHA
          </Chip>
        </Link>
        <span
          style={{
            width: 1,
            height: 18,
            background: "var(--border-strong)",
          }}
        />
        <nav style={{ display: "flex", gap: 4 }}>
          {NAV.map((n) => {
            const active = n.matches ? n.matches(pathname) : pathname === n.to;
            const isExternal = n.to.startsWith("http");
            const sx = {
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 13,
              color: active ? "var(--text)" : "var(--text-secondary)",
              background: active ? "var(--surface-raised)" : "transparent",
              textDecoration: "none",
              transition: "color 160ms, background 160ms",
            } as const;
            return isExternal ? (
              <a
                key={n.to}
                href={n.to}
                target="_blank"
                rel="noreferrer"
                style={sx}
              >
                {n.label}
              </a>
            ) : (
              <Link key={n.to} to={n.to} style={sx}>
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {right}
        <ConnectButton />
      </div>
    </header>
  );
}
