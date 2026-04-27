// Phase 8 — Report Assembly + 0G Storage Upload.
// Combines all upstream phase outputs into a single Report JSON, uploads
// it to 0G Storage, returns the merkle rootHash that anchors provenance.

import type { Labeled } from "@lplens/core";

export interface ReportProvenance {
  rootHash: string;
  txHash?: string;
  storageUrl: string;
  size: number;
  stub: boolean;
  uploadedAt: string;
}

export interface AssembledReport {
  schemaVersion: 1;
  generatedAt: string;
  agent: {
    name: "lplens";
    version: string;
  };
  position: {
    tokenId: string;
    version: 3 | 4;
    pair: string;
    owner: string;
  };
  il?: {
    hodlValueT1: number;
    lpValueT1: number;
    feesValueT1: number;
    ilT1: number;
    ilPct: number;
  };
  regime?: {
    topLabel: string;
    confidence: number;
    narrative: string;
  };
  hooks?: {
    pair: string;
    topFamily: string;
    candidateCount: number;
  };
  migration?: {
    targetHookAddress?: string;
    targetFamily?: string;
    priceImpactPct?: number;
    warnings: string[];
  };
}

export interface Phase8Output {
  report: Labeled<AssembledReport>;
  provenance: Labeled<ReportProvenance>;
}
