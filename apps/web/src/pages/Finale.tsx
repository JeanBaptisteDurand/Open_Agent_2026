// /finale — single-URL kiosk for the live demo. Snap-scrolls between
// 7 beats: hero → atlas pick → diagnose live → verdict + AT-4 →
// migration → composability → verification cascade. Activate
// presenter mode with ?presenter=true (chrono + keyboard nav).

import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDemoFlag, usePresenterFlag } from "../finale/demoFlags.js";
import { usePresenter } from "../finale/presenter.js";
import { BeatSection, SnapScroll } from "../finale/SnapScroll.js";
import { HeroSection } from "../finale/sections/HeroSection.js";
import { AtlasSection } from "../finale/sections/AtlasSection.js";
import { CloseSection } from "../finale/sections/CloseSection.js";
import { FINALE_BEATS } from "../finale/tokens.js";

const BLEEDING_TOKENID = "605311";

export function Finale() {
  const presenterMode = usePresenterFlag();
  const demoMode = useDemoFlag();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const presenter = usePresenter(FINALE_BEATS.length, presenterMode, scrollRef);
  void useNavigate;

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

      {/* 2. Atlas */}
      <BeatSection index={1} id="atlas">
        <AtlasSection onDiagnose={() => goToBeat(2)} />
      </BeatSection>

      {/* 3. Diagnose — embed the live page in an iframe so the SSE
            stream shows up unmodified. The diagnose flow is the meat
            of the demo and reuses the existing /diagnose surface. */}
      <BeatSection index={2} id="diagnose">
        <SectionFrame
          eyebrow="LIVE PIPELINE · 11 PHASES · STREAMED"
          eyebrowTone="cyan"
          title={
            <>
              The agent runs in front of the audience.{" "}
              <span style={{ color: "var(--cyan)" }}>Honesty labels included.</span>
            </>
          }
        >
          <iframe
            title="diagnose-live"
            src={`/diagnose/${BLEEDING_TOKENID}${demoMode ? "?demo=1" : ""}`}
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

      {/* 4. Verdict — same iframe, anchored at #verdict, plus an
            overlay caption. The AT-4 mask demo runs when ?showGuard=1
            is set on the underlying URL. */}
      <BeatSection index={3} id="verdict">
        <SectionFrame
          eyebrow="HONESTY MOMENT · AT-4 GUARD"
          eyebrowTone="bleed"
          title={
            <>
              The agent <span style={{ color: "var(--bleed)" }}>cannot lie</span>{" "}
              about its numbers.
            </>
          }
        >
          <iframe
            title="diagnose-verdict"
            src={`/diagnose/${BLEEDING_TOKENID}${demoMode ? "?demo=1&showGuard=true" : "?showGuard=true"}#verdict`}
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

      {/* 5. Migration */}
      <BeatSection index={4} id="migrate">
        <SectionFrame
          eyebrow="CUSTODY · ONE PERMIT2 SIGNATURE"
          eyebrowTone="cyan"
          title={
            <>
              Three on-chain moves.{" "}
              <span style={{ color: "var(--cyan)" }}>One signature.</span>
              <br />
              The agent never executes.
            </>
          }
        >
          <iframe
            title="diagnose-migrate"
            src={`/diagnose/${BLEEDING_TOKENID}${demoMode ? "?demo=1" : ""}#migrate`}
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

      {/* 6. Composability */}
      <BeatSection index={5} id="compose">
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

      {/* 7. Verification cascade */}
      <BeatSection index={6} id="verify">
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
            src={`/verify/0xd0da9250a8b71c87c1f9e7a4d5e3f2c8b9a0e6d4c2b1f8e7d5c3b9a8f7e6d5c4?demo=true`}
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

      {/* 8. Close — three partners, lens series, lplens.xyz CTA */}
      <BeatSection index={7} id="close">
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
        gap: 20,
        padding: "56px 64px 36px",
        maxWidth: 1480,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 24, height: 1, background: `var(--${eyebrowTone})` }} />
        <span
          style={{
            color: `var(--${eyebrowTone})`,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
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
          fontSize: "clamp(32px, 4.4vw, 56px)",
          fontWeight: 500,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
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
