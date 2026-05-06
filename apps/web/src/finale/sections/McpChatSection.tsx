// /finale MCP chat playground — a Claude-Desktop-style transcript with
// two clickable buttons that send pre-scripted prompts. Demonstrates
// the MCP tools without requiring a live broker call. The responses
// are scripted (typewriter) for stability under live demo conditions.
//
// Button 1 lists the 6 tools (3 free, 3 gated by mintLicense).
// Button 2 simulates a public verifier call (lookupReportOnChain) so
// the audience sees a real-feeling tool invocation + response.

import { useEffect, useMemo, useRef, useState } from "react";
import { Mono } from "../../design/atoms.js";

interface ChatMsg {
  id: string;
  role: "user" | "agent" | "tool";
  content: string;
  // For typewriter rendering
  reveal?: boolean;
}

const TOOLS_RESPONSE = `LPLens MCP server exposes 6 tools.

Verifier (free):
  • lookupReport(rootHash)            ← REST envelope + payload
  • lookupReportOnChain(rootHash)     ← LPLensReports.reports() read
  • resolveEnsRecord(tokenId, key)    ← Sepolia ENS text record

Action (gated by mintLicense, 0.1 OG / 24h window):
  • diagnose(tokenId)                 ← runs the 11-phase pipeline
  • preflight(tokenId)                ← quick health check, no anchor
  • migrate(tokenId, signedDigest)    ← records Permit2 sign on iNFT

The 3 verifiers are public goods — anyone can audit a report without
trusting the LPLens API.`;

const LOOKUP_REQUEST = `lplens.lookupReportOnChain(
  rootHash: "0xd0da92507e2e16e11315d587c64c60547beaa3c5f9bceb7f67356952deb87b11"
)`;

const LOOKUP_RESPONSE = `→ LPLensReports.reports(rootHash) on 0G Newton
→ chainId 16602
→ rpc https://evmrpc-testnet.0g.ai

{
  "publisher":   "0xa48f01287233509FD694a22Bf840225062E67836",
  "timestamp":   1714842137,
  "tokenId":     605311,
  "storageUrl":  "https://indexer-storage-testnet-turbo.0g.ai/file/0xd0da…7b11",
  "block":       4128902,
  "tx":          "0xd7392aa9dfd4fb1dbae1447bbf901943d7f3816c2639c64a46f45ad140ecbd8e"
}

✓ direct on-chain read · no LPLens API in the trust path
✓ publisher matches the TEE provider that signed the verdict`;

interface PromptButton {
  id: "tools" | "lookup";
  label: string;
  prompt: string;
  response: string;
  tool: string | null;
  toneTag: string;
}

const BUTTONS: PromptButton[] = [
  {
    id: "tools",
    label: "What tools does LPLens expose?",
    prompt: "What MCP tools does LPLens expose? Free vs gated.",
    response: TOOLS_RESPONSE,
    tool: null,
    toneTag: "cyan",
  },
  {
    id: "lookup",
    label: "Verify a report on-chain",
    prompt:
      'Call lookupReportOnChain on rootHash 0xd0da9250…d5c4 and show me the result.',
    response: LOOKUP_RESPONSE,
    tool: LOOKUP_REQUEST,
    toneTag: "healthy",
  },
];

const TYPE_SPEED_MS = 4; // ms per character

export function McpChatSection() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "system",
      role: "agent",
      content:
        "Connected to LPLens MCP server (stdio). Ready. Try one of the prompts on the right →",
    },
  ]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new messages.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async (btn: PromptButton): Promise<void> => {
    if (busy) return;
    setBusy(true);
    const baseId = `${btn.id}-${Date.now()}`;
    setMessages((m) => [
      ...m,
      { id: `${baseId}-u`, role: "user", content: btn.prompt },
    ]);
    await sleep(140);
    if (btn.tool) {
      setMessages((m) => [
        ...m,
        { id: `${baseId}-t`, role: "tool", content: btn.tool!, reveal: true },
      ]);
      await sleep(320);
    }
    setMessages((m) => [
      ...m,
      { id: `${baseId}-a`, role: "agent", content: "", reveal: true },
    ]);
    // Typewriter the response.
    for (let i = 1; i <= btn.response.length; i++) {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = {
          ...next[next.length - 1]!,
          content: btn.response.slice(0, i),
        };
        return next;
      });
      await sleep(TYPE_SPEED_MS);
    }
    setBusy(false);
  };

  const reset = (): void => {
    setMessages([
      {
        id: "system",
        role: "agent",
        content:
          "Connected to LPLens MCP server (stdio). Ready. Try one of the prompts on the right →",
      },
    ]);
  };

  return (
    <div
      style={{
        position: "relative",
        // Hard-cap the slide at the viewport so the chat transcript can
        // scroll inside its own box instead of growing the BeatSection.
        // `flex: 1` would let flex-basis 0 + grow 1 override `height`,
        // so we explicitly opt out of flex sizing here.
        flex: "none",
        display: "flex",
        flexDirection: "column",
        gap: 22,
        padding: "32px 64px 48px",
        maxWidth: 1480,
        margin: "0 auto",
        width: "100%",
        height: "100vh",
        maxHeight: "100vh",
        minHeight: 0,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 24, height: 1, background: "var(--violet)" }} />
        <span
          style={{
            color: "var(--violet)",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          MCP PLAYGROUND · CLAUDE DESKTOP · STDIO
        </span>
      </div>
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: "clamp(34px, 4.6vw, 56px)",
          fontWeight: 500,
          letterSpacing: "-0.03em",
          lineHeight: 1.04,
          color: "var(--text)",
          maxWidth: 1080,
        }}
      >
        Any agent can call LPLens.{" "}
        <span style={{ color: "var(--cyan)" }}>Click a prompt.</span>
      </h2>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)",
          gridTemplateRows: "minmax(0, 1fr)",
          gap: 16,
          alignItems: "stretch",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Chat transcript */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "var(--surface)",
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            overflow: "hidden",
            minHeight: 0,
            height: "100%",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              background: "var(--base-deeper)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                aria-hidden
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: "var(--violet)",
                  boxShadow: "0 0 8px var(--violet-glow)",
                  animation: "pulse-dot 1.4s infinite",
                }}
              />
              <Mono
                style={{
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  color: "var(--text-secondary)",
                }}
              >
                claude desktop · mcp · LPLens
              </Mono>
            </div>
            <button
              onClick={reset}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--text-tertiary)",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "4px 10px",
                cursor: "pointer",
              }}
              title="Reset transcript"
            >
              ↻ reset
            </button>
          </div>

          <div
            ref={scrollRef}
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              padding: "14px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              fontFamily: "var(--font-mono)",
              fontSize: 12.5,
              lineHeight: 1.6,
            }}
          >
            {messages.map((m) => (
              <ChatBubble key={m.id} msg={m} />
            ))}
            {busy && (
              <div style={{ color: "var(--text-tertiary)", fontSize: 11 }}>
                <span
                  aria-hidden
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: "var(--cyan)",
                    marginRight: 6,
                    animation: "pulse-dot 1.4s infinite",
                  }}
                />
                LPLens is responding…
              </div>
            )}
          </div>
        </div>

        {/* Right rail: prompt buttons + tool list */}
        <aside
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minWidth: 0,
          }}
        >
          <div
            style={{
              padding: "16px 18px",
              borderRadius: 12,
              border: "1px solid var(--border-strong)",
              background: "var(--surface)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <Mono
              color="text-tertiary"
              style={{ fontSize: 10, letterSpacing: "0.18em" }}
            >
              CANNED PROMPTS
            </Mono>
            {BUTTONS.map((b) => (
              <button
                key={b.id}
                onClick={() => send(b)}
                disabled={busy}
                style={{
                  textAlign: "left",
                  padding: "14px 16px",
                  borderRadius: 10,
                  border: `1px solid var(--${b.toneTag})`,
                  background: `rgba(${b.toneTag === "cyan" ? "255,176,32" : "142,232,135"}, 0.08)`,
                  cursor: busy ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  color: "var(--text)",
                  fontWeight: 500,
                  letterSpacing: "-0.005em",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  opacity: busy ? 0.6 : 1,
                  transition: "transform 160ms",
                }}
                onMouseEnter={(e) =>
                  !busy && (e.currentTarget.style.transform = "translateY(-1px)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                title="Click to send this prompt to the LPLens MCP server"
              >
                <span style={{ flex: 1 }}>{b.label}</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: `var(--${b.toneTag})`,
                    letterSpacing: "0.12em",
                  }}
                >
                  ▶ SEND
                </span>
              </button>
            ))}
          </div>

          {/* Tools quick-reference */}
          <div
            style={{
              padding: "14px 18px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--base-deeper)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text-secondary)",
            }}
          >
            <Mono
              color="text-tertiary"
              style={{ fontSize: 10, letterSpacing: "0.18em" }}
            >
              MCP TOOLS · 3 GATED · 3 FREE
            </Mono>
            <ToolLine name="diagnose" tone="cyan" gated />
            <ToolLine name="preflight" tone="cyan" gated />
            <ToolLine name="migrate" tone="cyan" gated />
            <ToolLine name="lookupReport" tone="healthy" />
            <ToolLine name="lookupReportOnChain" tone="healthy" />
            <ToolLine name="resolveEnsRecord" tone="healthy" />
          </div>
        </aside>
      </section>
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ChatBubble({ msg }: { msg: ChatMsg }) {
  const palette = useMemo(() => {
    if (msg.role === "user") {
      return {
        align: "flex-end" as const,
        bg: "rgba(197,156,255,0.08)",
        border: "rgba(197,156,255,0.4)",
        label: "USER · agent #2",
        labelColor: "var(--violet)",
      };
    }
    if (msg.role === "tool") {
      return {
        align: "flex-start" as const,
        bg: "rgba(255,176,32,0.06)",
        border: "rgba(255,176,32,0.4)",
        label: "TOOL · MCP CALL",
        labelColor: "var(--cyan)",
      };
    }
    return {
      align: "flex-start" as const,
      bg: "var(--base-deeper)",
      border: "var(--border)",
      label: "LPLens · agent #1",
      labelColor: "var(--healthy)",
    };
  }, [msg.role]);

  return (
    <div
      style={{
        alignSelf: palette.align,
        maxWidth: "92%",
        padding: "10px 14px",
        borderRadius: 10,
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      <Mono
        style={{
          fontSize: 9,
          letterSpacing: "0.18em",
          color: palette.labelColor,
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        {palette.label}
      </Mono>
      <span style={{ color: msg.role === "user" ? "var(--text)" : "var(--text-secondary)" }}>
        {msg.content}
      </span>
    </div>
  );
}

function ToolLine({
  name,
  tone,
  gated,
}: {
  name: string;
  tone: "cyan" | "healthy";
  gated?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 0",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 5,
          height: 5,
          borderRadius: 999,
          background: `var(--${tone})`,
        }}
      />
      <span style={{ color: "var(--text)" }}>{name}</span>
      <span style={{ marginLeft: "auto", color: `var(--${tone})`, fontSize: 9, letterSpacing: "0.16em" }}>
        {gated ? "0.1 OG · 24h" : "FREE"}
      </span>
    </div>
  );
}
