// Phase 9 — On-Chain Anchor.
// Submits the report's merkle rootHash to 0G Chain so the report becomes
// tamper-evident: anyone can re-derive the rootHash from the storage blob
// and assert it matches what the agent committed on-chain.

import type { Labeled } from "@lplens/core";

export interface AnchorReceipt {
  rootHash: string;
  txHash: string;
  blockNumber?: number;
  chainId: number;
  explorerUrl: string;
  anchoredAt: string;
  stub: boolean;
}

export interface Phase9Output {
  anchor: Labeled<AnchorReceipt>;
}
