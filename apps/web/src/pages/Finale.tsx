// /finale — single-URL kiosk for the live demo. Snap-scrolls between
// 10 beats: hero → atlas pick → diagnose live → verdict + sign →
// TEE proof → /agent iNFT → MCP playground → composability →
// verification cascade → close. Activate presenter mode with
// ?presenter=true (chrono + keyboard nav).
//
// The Verdict beat embeds the diagnose iframe with `?showGuard=true`
// and scrolled to `#migrate` so the audience sees both the AT-4 mask
// fire AND the Permit2 sign affordance in one view.

import { useEffect, useRef } from "react";
import { useDemoFlag, usePresenterFlag } from "../finale/demoFlags.js";
import { usePresenter } from "../finale/presenter.js";
import { BeatSection, SnapScroll } from "../finale/SnapScroll.js";
import { HeroSection } from "../finale/sections/HeroSection.js";
import { AtlasSection } from "../finale/sections/AtlasSection.js";
import { AtGuardsSection } from "../finale/sections/AtGuardsSection.js";
import { CloseSection } from "../finale/sections/CloseSection.js";
import { TeeProofSection } from "../finale/sections/TeeProofSection.js";
import { McpChatSection } from "../finale/sections/McpChatSection.js";
import { FINALE_BEATS } from "../finale/tokens.js";

const BLEEDING_TOKENID = "605311";

export function Finale() {
  const presenterMode = usePresenterFlag();
  const demoMode = useDemoFlag();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const presenter = usePresenter(FINALE_BEATS.length, presenterMode, scrollRef);

  // Lock the document so the SnapScroller is the only scroll surface.
  // Otherwise the body keeps a vertical scrollbar gutter on the right
  // edge and SnapScroll's `position: fixed; right: 0` lands ~10–17px
  // inside it, which reads as "scrollbar moved to the left" on screen.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlHeight: html.style.height,
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
      bodyMinHeight: body.style.minHeight,
    };
    html.style.overflow = "hidden";
    html.style.height = "100%";
    body.style.overflow = "hidden";
    body.style.height = "100%";
    body.style.minHeight = "100%";
    return () => {
      html.style.overflow = prev.htmlOverflow;
      html.style.height = prev.htmlHeight;
      body.style.overflow = prev.bodyOverflow;
      body.style.height = prev.bodyHeight;
      body.style.minHeight = prev.bodyMinHeight;
    };
  }, []);

  const goToBeat = (i: number): void => presenter.setBeat(i);

  return (
    <SnapScroll
      presenter={presenter}
      active={presenterMode}
      scrollRef={scrollRef}
    >
      {/* 1. Hero */}
      <BeatSection index={0} id="hero">
        <HeroSection
          presenter={presenterMode}
          onWatchDiagnose={() => goToBeat(2)}
        />
      </BeatSection>

      {/* 2. Atlas — bleeding wallet pinned */}
      <BeatSection index={1} id="atlas">
        <AtlasSection onDiagnose={() => goToBeat(2)} />
      </BeatSection>

      {/* 3. Atlas live — embed the wallet-pinned atlas so the audience
            sees every position before drilling in. Clicking a position
            inside the iframe navigates to /diagnose, setting up the
            verdict beat with the same SSE stream. */}
      <BeatSection index={2} id="diagnose">
        <SectionFrame
          eyebrow="WALLET PINNED · 10 POSITIONS · LIVE READ"
          eyebrowTone="cyan"
          title={
            <>
              Every position, one view.{" "}
              <span style={{ color: "var(--cyan)" }}>Pick the bleeder.</span>
            </>
          }
        >
          <iframe
            title="atlas-live"
            src="/atlas?wallet=bleeding"
            style={{
              flex: 1,
              width: "100%",
              minHeight: "60vh",
              border: "1px solid var(--border-strong)",
              borderRadius: 12,
              background: "var(--surface)",
            }}
          />
        </SectionFrame>
      </BeatSection>

      {/* 4. Verdict + AT-4 mask + Permit2 sign — same iframe with
            ?showGuard=true. The MigrationPanel + Sign button live on
            the same page; scroll within the iframe to reach them. */}
      <BeatSection index={3} id="verdict">
        <SectionFrame
          eyebrow="HONESTY MOMENT · AT-4 GUARD · PERMIT2 SIGN"
          eyebrowTone="bleed"
          title={
            <>
              The agent <span style={{ color: "var(--bleed)" }}>cannot lie</span>.
              <br />
              And the user keeps custody — one Permit2 signature.
            </>
          }
        >
          <iframe
            title="diagnose-verdict-sign"
            src={`/diagnose/${BLEEDING_TOKENID}${demoMode ? "?demo=1&showGuard=true" : "?showGuard=true"}`}
            style={{
              flex: 1,
              width: "100%",
              minHeight: "60vh",
              border: "1px solid var(--border-strong)",
              borderRadius: 12,
              background: "var(--surface)",
            }}
          />
        </SectionFrame>
      </BeatSection>

      {/* 5. Honesty layer — 11-phase pipeline + 6 acceptance tests
            (AT-N) that gate them. Explains "AT" inline so the audience
            never has to ask. Sits before TEE so AT-5 (signature
            round-trip) primes the next slide. */}
      <BeatSection index={4} id="guards">
        <AtGuardsSection />
      </BeatSection>

      {/* 6. TEE proof — provider attestation, code image hash,
            broker signature. Sets up the trust frame before agent
            economy lands. */}
      <BeatSection index={5} id="tee">
        <TeeProofSection />
      </BeatSection>

      {/* 7. /agent iNFT — Mission Control card. ERC-7857, on-chain
            counters, ENS-named, codeImageHash. Visible to anyone via
            cast call — no LPLens API trust required. */}
      <BeatSection index={6} id="agent">
        <SectionFrame
          eyebrow="iNFT · ERC-7857 · 0G NEWTON"
          eyebrowTone="cyan"
          title={
            <>
              The agent itself is{" "}
              <span style={{ color: "var(--cyan)" }}>an on-chain asset</span>.
            </>
          }
        >
          <iframe
            title="agent-mission-control"
            src="/agent"
            style={{
              flex: 1,
              width: "100%",
              minHeight: "62vh",
              border: "1px solid var(--border-strong)",
              borderRadius: 12,
              background: "var(--surface)",
            }}
          />
        </SectionFrame>
      </BeatSection>

      {/* 8. MCP playground — Claude-Desktop-style chat with two
            scripted prompt buttons. Demonstrates the 6-tool surface
            (3 free verifiers, 3 gated by mintLicense). */}
      <BeatSection index={7} id="mcp">
        <McpChatSection />
      </BeatSection>

      {/* 9. Composability — split-screen scripted MCP loop showing
            mintLicense + 80/20 royalty split + isLicensed flip. */}
      <BeatSection index={8} id="compose">
        <SectionFrame
          eyebrow="AGENT ECONOMY · MINTLICENSE 80/20"
          eyebrowTone="violet"
          title={
            <>
              Other agents pay <span style={{ color: "var(--cyan)" }}>0.1 OG</span>{" "}
              to call LPLens. Atomic split. On-chain.
            </>
          }
        >
          <iframe
            title="composability"
            src="/composability"
            style={{
              flex: 1,
              width: "100%",
              minHeight: "60vh",
              border: "1px solid var(--border-strong)",
              borderRadius: 12,
              background: "var(--surface)",
            }}
          />
        </SectionFrame>
      </BeatSection>

      {/* 10. Verification cascade — 5 surfaces light up sequentially. */}
      <BeatSection index={9} id="verify">
        <SectionFrame
          eyebrow="TRUST CLOSE · 5 SURFACES"
          eyebrowTone="cyan"
          title={
            <>
              Five paths, one rootHash,{" "}
              <span style={{ color: "var(--cyan)" }}>no server in the trust.</span>
            </>
          }
        >
          <iframe
            title="verify"
            src={`/verify/0xd0da92507e2e16e11315d587c64c60547beaa3c5f9bceb7f67356952deb87b11?demo=true`}
            style={{
              flex: 1,
              width: "100%",
              minHeight: "60vh",
              border: "1px solid var(--border-strong)",
              borderRadius: 12,
              background: "var(--surface)",
            }}
          />
        </SectionFrame>
      </BeatSection>

      {/* 11. Close — three partners, Lens series, lplens.xyz CTA. */}
      <BeatSection index={10} id="close">
        <CloseSection />
      </BeatSection>
    </SnapScroll>
  );
}

interface SectionFrameProps {
  eyebrow: string;
  eyebrowTone: "cyan" | "violet" | "bleed" | "healthy" | "toxic";
  title: React.ReactNode;
  children: React.ReactNode;
}

function SectionFrame({ eyebrow, eyebrowTone, title, children }: SectionFrameProps) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "28px 64px 40px",
        maxWidth: 1480,
        margin: "0 auto",
        width: "100%",
        minHeight: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 24, height: 1, background: `var(--${eyebrowTone})` }} />
        <span
          style={{
            color: `var(--${eyebrowTone})`,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </span>
      </div>
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: "clamp(20px, 2.4vw, 30px)",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
          color: "var(--text)",
          maxWidth: 1080,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
