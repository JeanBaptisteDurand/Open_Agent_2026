import { type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Logo } from "./Logo.js";
import { Chip } from "../design/atoms.js";
import { ConnectButton } from "./ConnectButton.js";

// Single header used on every page. Modeled on the original Landing
// inline header — relative position, no border, no backdrop blur,
// no sticky behavior. Brand on the left, lightweight nav inline,
// Connect wallet at the far right of the nav. Active route is
// highlighted with text color only — no pill background — so the
// marketing chrome reads identically on /atlas as on /.

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
    to: "/roadmap",
    label: "Roadmap",
    matches: (p) => p.startsWith("/roadmap"),
  },
  { to: "/deck", label: "Deck", matches: (p) => p.startsWith("/deck") },
  {
    to: "https://github.com/JeanBaptisteDurand/Open_Agent_2026/blob/main/FEEDBACK.md",
    label: "Feedback",
  },
];

interface FinaleVariant {
  to: string;
  label: string;
  hint: string;
}

// Two ways to land on /finale: clean (no overlays — best for screen
// recording) or overlay mode (presenter chrome + demo replay flag —
// best for live walk-throughs and judges driving the keyboard).
const FINALE_VARIANTS: ReadonlyArray<FinaleVariant> = [
  {
    to: "/finale",
    label: "Classic finale",
    hint: "no overlays — clean for video capture",
  },
  {
    to: "/finale?presenter=true&demo=1",
    label: "Overlay finale",
    hint: "slide manager + chrono · keyboard nav · demo replay",
  },
];

const GIT_TAG =
  (import.meta.env.VITE_GIT_TAG as string | undefined) ?? "v1.0.2";

interface Props {
  /** Optional slot rendered to the left of the Connect wallet button. */
  right?: ReactNode;
}

export function AppHeader({ right }: Props) {
  const { pathname } = useLocation();
  return (
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
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          LPLens
        </span>
        <Chip tone="cyan" style={{ marginLeft: 4 }}>
          {GIT_TAG}
        </Chip>
      </Link>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
          fontSize: 13,
          color: "var(--text-secondary)",
        }}
      >
        {NAV.map((n) => {
          const active = n.matches ? n.matches(pathname) : pathname === n.to;
          const isExternal = n.to.startsWith("http");
          const sx = {
            color: active ? "var(--text)" : "var(--text-secondary)",
            textDecoration: "none",
            transition: "color 160ms",
            background: "transparent",
            border: "none",
            padding: 0,
            font: "inherit",
            cursor: "pointer",
          } as const;
          // Inject the Finale dropdown right before the Feedback link
          // so the nav order reads: Atlas · Agent · Devs · Roadmap ·
          // Deck · Finale ▾ · Feedback.
          const dropdownSlot =
            n.label === "Feedback" ? (
              <FinaleDropdown
                key="finale-dropdown"
                active={pathname.startsWith("/finale")}
              />
            ) : null;
          const link = isExternal ? (
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
          return dropdownSlot ? (
            <span key={n.to + "-wrap"} style={{ display: "contents" }}>
              {dropdownSlot}
              {link}
            </span>
          ) : (
            link
          );
        })}
        {right}
        {/* 0G Compute provider attestation — real signal that verdicts
            run inside a TEE on the 0G compute network. We do NOT claim a
            specific attestation type (TDX vs SGX) because we never queried
            the provider for its `teeType` field — only the broker-level
            "attestation present" guarantee is empirically verified. */}
        <span
          title="Verdicts run on a 0G Compute provider with a broker-verifiable attestation report. See /agent for the live signer address."
          style={{ display: "inline-flex", marginLeft: 4 }}
        >
          <Chip tone="cyan">0G Compute · TEE attested</Chip>
        </span>
        <ConnectButton />
      </nav>
    </header>
  );
}

interface FinaleDropdownProps {
  active: boolean;
}

function FinaleDropdown({ active }: FinaleDropdownProps) {
  const navigate = useNavigate();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          style={{
            color: active ? "var(--text)" : "var(--text-secondary)",
            background: "transparent",
            border: "none",
            padding: 0,
            font: "inherit",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            transition: "color 160ms",
          }}
        >
          Finale
          <span
            aria-hidden
            style={{
              display: "inline-block",
              fontSize: 9,
              color: "var(--text-tertiary)",
            }}
          >
            ▾
          </span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          style={{
            zIndex: 50,
            minWidth: 280,
            padding: 6,
            background: "var(--surface)",
            border: "1px solid var(--border-strong)",
            borderRadius: 10,
            boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {FINALE_VARIANTS.map((v) => (
            <DropdownMenu.Item
              key={v.to}
              onSelect={(e) => {
                e.preventDefault();
                navigate(v.to);
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                textAlign: "left",
                gap: 2,
                padding: "10px 12px",
                borderRadius: 8,
                color: "var(--text)",
                background: "transparent",
                cursor: "pointer",
                font: "inherit",
                outline: "none",
                transition: "background 120ms",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--base-deeper)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              onFocus={(e) =>
                (e.currentTarget.style.background = "var(--base-deeper)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                }}
              >
                {v.label}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--text-tertiary)",
                  letterSpacing: "0.04em",
                }}
              >
                {v.hint}
              </span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
