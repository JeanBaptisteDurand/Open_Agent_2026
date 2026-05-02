import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo.js";
import { Chip, Dot, Kbd } from "../design/atoms.js";
import { ConnectButton } from "./ConnectButton.js";

interface NavItem {
  to: string;
  label: string;
  matches?: (path: string) => boolean;
}

const NAV: NavItem[] = [
  { to: "/atlas", label: "Atlas", matches: (p) => p.startsWith("/atlas") || p.startsWith("/diagnose") || p.startsWith("/report") },
  { to: "/agent", label: "Agent", matches: (p) => p.startsWith("/agent") },
  { to: "/developers", label: "Developers", matches: (p) => p.startsWith("/developers") },
  { to: "https://github.com/JeanBaptisteDurand/Open_Agent_2026/blob/main/FEEDBACK.md", label: "Feedback" },
];

interface Props {
  right?: ReactNode;
}

export function AppHeader({ right }: Props) {
  const { pathname } = useLocation();
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 36px",
        borderBottom: "1px solid var(--border)",
        background: "rgba(11, 11, 14, 0.82)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
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
              <a key={n.to} href={n.to} target="_blank" rel="noreferrer" style={sx}>
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-tertiary)",
            fontSize: 11,
          }}
        >
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </div>
        <Chip tone="cyan">
          <Dot color="cyan" pulse /> TEE · SGX attested
        </Chip>
        <ConnectButton />
      </div>
    </header>
  );
}
