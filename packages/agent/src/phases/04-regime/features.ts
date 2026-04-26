import type { PoolHourPoint, RegimeFeatures } from "./types.js";

// Computes a small set of statistical features from a pool's hourly history.
// All inputs are already-decoded (numbers, not BigDecimal strings). The math
// is intentionally vanilla — no external stat library — so it stays auditable.

export function computeFeatures(points: PoolHourPoint[]): RegimeFeatures {
  if (points.length < 4) {
    return zeroFeatures(points.length);
  }

  const closes = points.map((p) => p.close).filter((c) => c > 0);
  const logCloses = closes.map((c) => Math.log(c));

  // hourly log returns
  const returns: number[] = [];
  for (let i = 1; i < logCloses.length; i++) {
    returns.push(logCloses[i] - logCloses[i - 1]);
  }

  const meanReturn = mean(returns);
  const variance =
    returns.length > 1
      ? returns.reduce((acc, r) => acc + (r - meanReturn) ** 2, 0) /
        (returns.length - 1)
      : 0;
  const stdHourly = Math.sqrt(variance);
  const volRealized = stdHourly * Math.sqrt(24 * 365);

  // Hurst exponent via rescaled-range — coarse, n<100, but indicative.
  const hurst = hurstExponent(returns);

  // Linear regression on log close vs index.
  const { slope, rSquared } = linreg(logCloses);

  // Toxicity proxy : volume / mean liquidity. Crude — refined later.
  const totalVolumeUSD = points.reduce((acc, p) => acc + p.volumeUSD, 0);
  const meanLiquidity =
    mean(points.map((p) => parseFloat(p.liquidity) || 0)) || 1;
  const toxicityProxy = totalVolumeUSD / meanLiquidity;

  // JIT proxy : 0 until we wire mint/burn correlation. Surfaces in scores
  // as a low value so the regime never spuriously flags JIT.
  const jitProxy = 0;

  return {
    volRealized,
    hurst,
    slope,
    rSquared,
    toxicityProxy,
    jitProxy,
    hoursAnalyzed: points.length,
  };
}

function zeroFeatures(hours: number): RegimeFeatures {
  return {
    volRealized: 0,
    hurst: 0.5,
    slope: 0,
    rSquared: 0,
    toxicityProxy: 0,
    jitProxy: 0,
    hoursAnalyzed: hours,
  };
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function linreg(ys: number[]): { slope: number; rSquared: number } {
  const n = ys.length;
  if (n < 2) return { slope: 0, rSquared: 0 };
  const xs = Array.from({ length: n }, (_, i) => i);
  const xMean = mean(xs);
  const yMean = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yPred = intercept + slope * xs[i];
    ssRes += (ys[i] - yPred) ** 2;
    ssTot += (ys[i] - yMean) ** 2;
  }
  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { slope, rSquared };
}

function hurstExponent(returns: number[]): number {
  // Rescaled-range Hurst, simplified for small samples.
  if (returns.length < 8) return 0.5;
  const m = mean(returns);
  const adjusted = returns.map((r) => r - m);
  const cumulative: number[] = [];
  let acc = 0;
  for (const v of adjusted) {
    acc += v;
    cumulative.push(acc);
  }
  const range = Math.max(...cumulative) - Math.min(...cumulative);
  const variance =
    adjusted.reduce((s, r) => s + r * r, 0) / adjusted.length;
  const sd = Math.sqrt(variance);
  if (sd === 0 || range === 0) return 0.5;
  const rs = range / sd;
  const n = returns.length;
  const h = Math.log(rs) / Math.log(n);
  return Math.max(0, Math.min(1, h));
}
