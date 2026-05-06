// Presenter-mode keyboard navigation + chrono. Active only when the
// user opens /finale?presenter=true. Keys: space/arrow-right = next
// beat, arrow-left = prev beat, f = fullscreen toggle, r = reset
// chrono. The chrono ticks 5:00 down to 0:00 visible only in
// presenter mode so the audience never sees it.

import { useEffect, useRef, useState, type RefObject } from "react";

const TOTAL_MS = 5 * 60 * 1000;

interface PresenterState {
  beat: number;
  setBeat: (n: number) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  toggleFullscreen: () => void;
  elapsedMs: number;
  remainingMs: number;
  running: boolean;
  start: () => void;
  pause: () => void;
}

export function usePresenter(
  beatCount: number,
  active: boolean,
  scrollRef?: RefObject<HTMLElement | null>,
): PresenterState {
  const [beat, setBeatState] = useState(0);
  const [running, setRunning] = useState(false);
  const [now, setNow] = useState(Date.now());
  const startRef = useRef<number | null>(null);
  const accumRef = useRef(0);

  const setBeat = (n: number): void => {
    const clamped = Math.max(0, Math.min(beatCount - 1, n));
    setBeatState(clamped);
    if (scrollRef?.current) {
      const sections = scrollRef.current.querySelectorAll<HTMLElement>(
        "[data-finale-beat]",
      );
      const target = sections[clamped];
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const next = (): void => setBeat(beat + 1);
  const prev = (): void => setBeat(beat - 1);

  const start = (): void => {
    if (running) return;
    startRef.current = Date.now();
    setRunning(true);
  };
  const pause = (): void => {
    if (!running) return;
    if (startRef.current !== null) {
      accumRef.current += Date.now() - startRef.current;
      startRef.current = null;
    }
    setRunning(false);
  };
  const reset = (): void => {
    accumRef.current = 0;
    startRef.current = running ? Date.now() : null;
    setNow(Date.now());
  };

  const toggleFullscreen = (): void => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent): void => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.key === " " || e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        if (!running) start();
        next();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        reset();
      } else if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        running ? pause() : start();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, beat, running]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [running]);

  const elapsedMs =
    accumRef.current + (running && startRef.current ? now - startRef.current : 0);
  const remainingMs = Math.max(0, TOTAL_MS - elapsedMs);

  return {
    beat,
    setBeat,
    next,
    prev,
    reset,
    toggleFullscreen,
    elapsedMs,
    remainingMs,
    running,
    start,
    pause,
  };
}

export function fmtChrono(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
