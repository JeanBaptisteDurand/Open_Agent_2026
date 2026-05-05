// Motion + layout tokens shared across finale surfaces. Mirrors the
// HeroFilm cinematic grammar: eased reveals, beat-segmented progress,
// hard cap 1s. Stagger 80–150ms. Numeric count-up 800ms. Hash type 400ms.
// Page transitions 300ms crossfade.

export const MOTION = {
  stagger: 110,
  countUpMs: 800,
  hashTypeMs: 400,
  panelSlideMs: 240,
  badgeFlashMs: 600,
  cascadeStepMs: 800,
  pageFadeMs: 300,
  hardCapMs: 1000,
} as const;

export const EASE = {
  signal: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  precise: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

// Plain-English tooltips per phase, used by PhaseStrip on /diagnose.
export const PHASE_TOOLTIP: Record<number, string> = {
  0: "Subgraph readiness check",
  1: "Resolving your tokenId on-chain",
  2: "Retrieving prior diagnoses (RAG)",
  3: "Decomposing impermanent loss from tick range",
  4: "Classifying market regime (vol, Hurst, MEV proxies)",
  5: "Discovering candidate V4 hooks for this pool",
  6: "Replaying 1000 mainnet swaps through each candidate",
  7: "Building the close-V3 / swap / mint-V4 migration plan",
  8: "Pinning report to 0G Storage",
  9: "Anchoring rootHash on 0G Chain + bumping iNFT",
  10: "Synthesizing verdict inside a 0G Compute TEE",
  11: "Publishing 5 ENS text records on Sepolia",
};

export const PHASE_SHORT_NAME: Record<number, string> = {
  0: "Boot",
  1: "Resolve",
  2: "RAG",
  3: "IL",
  4: "Regime",
  5: "Hooks",
  6: "Score",
  7: "Migrate",
  8: "Upload",
  9: "Anchor",
  10: "Verdict",
  11: "ENS",
};

export const FINALE_BEATS: ReadonlyArray<{
  id: string;
  label: string;
  hint: string;
}> = [
  { id: "hero", label: "Hook", hint: "49.5% lose money. LPLens diagnoses why." },
  { id: "atlas", label: "Pick", hint: "Bleeding wallet, top position." },
  { id: "diagnose", label: "Live pipeline", hint: "11 phases, 7 panels, 0 bps drift." },
  { id: "verdict", label: "Honesty", hint: "AT-4 mask catches a fake number live." },
  { id: "migrate", label: "Custody", hint: "One Permit2 signature." },
  { id: "compose", label: "Composability", hint: "Other agents pay 0.1 OG to call." },
  { id: "verify", label: "Trust", hint: "5 surfaces verify the same hash." },
];
