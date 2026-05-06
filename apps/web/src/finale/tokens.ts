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
// Aligned with the actual emitted phase numbers from
// packages/agent/src/orchestrator.ts — phase 2 is intentionally absent
// (RAG is folded into phase 1 prompt assembly, not its own SSE phase).
export const PHASE_TOOLTIP: Record<number, string> = {
  0: "Subgraph readiness check",
  1: "Resolving your tokenId on-chain",
  3: "Decomposing impermanent loss from tick range",
  4: "Classifying market regime (vol, Hurst, MEV proxies)",
  5: "Discovering candidate V4 hooks for this pool",
  6: "Scoring candidate hooks against your pool",
  7: "Building the close-V3 / swap / mint-V4 migration plan",
  8: "Pinning report to 0G Storage",
  9: "Anchoring rootHash on 0G Chain + bumping iNFT",
  10: "Synthesizing verdict inside a 0G Compute TEE",
  11: "Publishing 5 ENS text records on Sepolia",
};

export const PHASE_SHORT_NAME: Record<number, string> = {
  0: "Boot",
  1: "Resolve",
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

// Order of segments rendered in PhaseStrip — actual emitted phases only.
export const PHASE_ORDER: ReadonlyArray<number> = [
  0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11,
];

export const FINALE_BEATS: ReadonlyArray<{
  id: string;
  label: string;
  hint: string;
}> = [
  { id: "hero", label: "Hook", hint: "49.5% lose money. LPLens diagnoses why." },
  { id: "atlas", label: "Pick", hint: "All your positions, scanned in one view." },
  { id: "diagnose", label: "Live pipeline", hint: "11 phases, 7 panels, 0 bps drift." },
  { id: "verdict", label: "Verdict + sign", hint: "AT-4 mask + one Permit2 signature." },
  { id: "guards", label: "Honesty layer", hint: "11 phases, 10 acceptance tests, every number traceable." },
  { id: "tee", label: "TEE proof", hint: "Sealed enclave · broker-attested signer." },
  { id: "agent", label: "iNFT", hint: "ERC-7857 identity, on-chain memory + reputation." },
  { id: "mcp", label: "MCP playground", hint: "Other agents call LPLens via MCP." },
  { id: "compose", label: "Agent economy", hint: "0.1 OG · mintLicense · 80/20 split." },
  { id: "verify", label: "Trust", hint: "5 surfaces verify the same hash." },
  { id: "close", label: "Try it", hint: "lplens.xyz · open repo · the Lens series." },
];
