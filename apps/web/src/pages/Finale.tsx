// /finale — single-URL kiosk for the live demo. 7 snap-scroll
// sections: Hero → Atlas pick → Diagnose live → Verdict + AT-4 →
// Migration → Composability → Verification cascade. Activate
// presenter mode with ?presenter=true (chrono + keyboard nav).
//
// The full hero + section layout lands in the next commit. This file
// scaffolds the SnapScroll container and presenter wiring so the
// route renders.

import { useRef } from "react";
import { useDemoFlag, usePresenterFlag } from "../finale/demoFlags.js";
import { usePresenter } from "../finale/presenter.js";
import { BeatSection, SnapScroll } from "../finale/SnapScroll.js";
import { FINALE_BEATS } from "../finale/tokens.js";

export function Finale() {
  const presenterMode = usePresenterFlag();
  const demoMode = useDemoFlag();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const presenter = usePresenter(FINALE_BEATS.length, presenterMode, scrollRef);

  return (
    <SnapScroll
      presenter={presenter}
      active={presenterMode}
      scrollRef={scrollRef}
    >
      {FINALE_BEATS.map((b, i) => (
        <BeatSection key={b.id} index={i} id={b.id}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              padding: 24,
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              gap: 8,
            }}
          >
            <span style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--text)" }}>
              {b.label}
            </span>
            <span>{b.hint}</span>
            <span
              style={{
                marginTop: 12,
                fontSize: 11,
                color: "var(--text-tertiary)",
              }}
            >
              section scaffold · demoMode={String(demoMode)}
            </span>
          </div>
        </BeatSection>
      ))}
    </SnapScroll>
  );
}
