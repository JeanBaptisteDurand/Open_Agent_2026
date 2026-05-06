// Motion atoms shared across finale surfaces. CountUp animates a
// numeric value from 0 → target over MOTION.countUpMs. Sparkline
// renders two overlapping series for the AT-2 simulated-vs-actual
// merge. TickerStrip is the hero-top live ticker. HashType reuses
// the existing TypewriterText cadence shape but for hex hashes with
// a blinking caret.

import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import { EASE, MOTION } from "./tokens.js";

interface CountUpProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  className?: string;
  style?: CSSProperties;
  /** When true, flash a small color tick on every prop change. */
  flashOnChange?: boolean;
  /** Locale string for thousand separators. */
  locale?: string;
}

export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  durationMs = MOTION.countUpMs,
  className,
  style,
  flashOnChange = false,
  locale = "en-US",
}: CountUpProps) {
  const [shown, setShown] = useState(0);
  const [flash, setFlash] = useState(false);
  const fromRef = useRef(0);
  const targetRef = useRef(value);
  const startRef = useRef<number | null>(null);
  const reducedRef = useRef(
    typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (reducedRef.current) {
      setShown(value);
      return;
    }
    fromRef.current = shown;
    targetRef.current = value;
    startRef.current = performance.now();
    if (flashOnChange) {
      setFlash(true);
      const t = window.setTimeout(() => setFlash(false), 220);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (reducedRef.current) return;
    let raf = 0;
    const tick = (now: number): void => {
      if (startRef.current === null) startRef.current = now;
      const t = Math.min(1, (now - startRef.current) / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = fromRef.current + (targetRef.current - fromRef.current) * eased;
      setShown(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, value]);

  const formatted = shown.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <span
      className={className}
      style={{
        ...style,
        color: flash ? "var(--cyan)" : style?.color,
        transition: `color 220ms ${EASE.signal}`,
      }}
    >
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

interface SparklineProps {
  /** Two series, normalized 0..1. They visually merge as AT-2's "0 bps drift". */
  a: number[];
  b: number[];
  width?: number;
  height?: number;
  /** When true, animate the b series sweeping in from left to right. */
  sweep?: boolean;
}

function pathFrom(values: number[], width: number, height: number): string {
  if (values.length === 0) return "";
  const step = width / Math.max(1, values.length - 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = height - v * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function Sparkline({
  a,
  b,
  width = 320,
  height = 56,
  sweep = false,
}: SparklineProps) {
  const dA = pathFrom(a, width, height);
  const dB = pathFrom(b, width, height);
  const [progress, setProgress] = useState(sweep ? 0 : 1);
  useEffect(() => {
    if (!sweep) return;
    setProgress(0);
    let raf = 0;
    const start = performance.now();
    const dur = 2400;
    const step = (now: number): void => {
      const t = Math.min(1, (now - start) / dur);
      setProgress(t);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [sweep, b]);
  const clipW = width * progress;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: "visible" }}
    >
      <defs>
        <clipPath id="sparkline-clip">
          <rect x="0" y="0" width={clipW} height={height} />
        </clipPath>
        <linearGradient id="sparkline-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${dA} L${width} ${height} L0 ${height} Z`}
        fill="url(#sparkline-area)"
        opacity="0.9"
      />
      <path d={dA} fill="none" stroke="var(--text-tertiary)" strokeWidth="1" />
      <path
        d={dB}
        fill="none"
        stroke="var(--cyan)"
        strokeWidth="1.4"
        clipPath="url(#sparkline-clip)"
        filter="drop-shadow(0 0 4px rgba(255,176,32,0.35))"
      />
    </svg>
  );
}

interface TickerItem {
  label: string;
  value: string;
  tone?: "cyan" | "violet" | "bleed" | "healthy" | "toxic";
}

export function TickerStrip({ items }: { items: TickerItem[] }) {
  // Duplicate the items so the marquee animation appears continuous.
  const doubled = [...items, ...items];
  return (
    <div
      style={{
        position: "relative",
        height: 26,
        overflow: "hidden",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        background: "rgba(8,8,12,0.6)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          gap: 36,
          padding: "0 24px",
          whiteSpace: "nowrap",
          alignItems: "center",
          height: "100%",
          animation: "ticker 60s linear infinite",
          willChange: "transform",
        }}
      >
        {doubled.map((it, i) => (
          <Fragment key={i}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.04em",
                color: "var(--text-tertiary)",
              }}
            >
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 999,
                  background: `var(--${it.tone ?? "cyan"})`,
                }}
              />
              <span style={{ color: "var(--text-secondary)" }}>{it.label}</span>
              <span
                style={{
                  color: `var(--${it.tone ?? "cyan"})`,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                }}
              >
                {it.value}
              </span>
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

interface HashTypeProps {
  text: string;
  durationMs?: number;
  className?: string;
  style?: CSSProperties;
}

export function HashType({
  text,
  durationMs = MOTION.hashTypeMs,
  className,
  style,
}: HashTypeProps) {
  const [shown, setShown] = useState("");
  const reducedRef = useRef(
    typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    if (reducedRef.current) {
      setShown(text);
      return;
    }
    setShown("");
    let raf = 0;
    const start = performance.now();
    const step = (now: number): void => {
      const t = Math.min(1, (now - start) / durationMs);
      const len = Math.floor(t * text.length);
      setShown(text.slice(0, len));
      if (t < 1) raf = requestAnimationFrame(step);
      else setShown(text);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, durationMs]);
  return (
    <span
      className={className}
      style={{
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.02em",
        ...style,
      }}
    >
      {shown}
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: 6,
          height: "0.95em",
          marginLeft: 2,
          background: "var(--cyan)",
          verticalAlign: "-0.12em",
          animation: "caret 1s steps(1) infinite",
          opacity: shown.length === text.length ? 0 : 1,
        }}
      />
    </span>
  );
}
