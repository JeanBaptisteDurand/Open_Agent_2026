import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  keccak256,
  toHex,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "../config.js";
import { logger } from "../logger.js";

// 0G Chain anchor — submits a tx whose calldata is the report's merkle
// rootHash, so the rootHash is permanently anchored on the 0G Newton
// testnet (or Galileo mainnet). No registry contract required for the
// hackathon demo — `tx.input` is the canonical anchor field. The server
// falls back to a deterministic stub txHash when no signing key is set
// so the agent's `report.anchored` event remains shape-stable offline.

const zeroGNewton = defineChain({
  id: config.OG_CHAIN_ID,
  name: "0G Newton Testnet",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: { default: { http: [config.OG_NEWTON_RPC] } },
});

export interface AnchorReceipt {
  txHash: string;
  blockNumber?: number;
  chainId: number;
  explorerUrl: string;
  stub: boolean;
}

const EXPLORER_BASE = "https://chainscan-newton.0g.ai/tx";

export class OgChainClient {
  isReady(): boolean {
    return Boolean(config.OG_ANCHOR_PRIVATE_KEY);
  }

  async anchor(rootHash: string): Promise<AnchorReceipt> {
    const data = normalizeHex(rootHash);

    if (!config.OG_ANCHOR_PRIVATE_KEY) {
      const stubTx = stubTxHash(rootHash);
      logger.info(
        `0g-chain stub anchor (no signer key) rootHash=${rootHash} stubTx=${stubTx}`,
      );
      return {
        txHash: stubTx,
        chainId: config.OG_CHAIN_ID,
        explorerUrl: `stub://og-chain/${stubTx}`,
        stub: true,
      };
    }

    try {
      const account = privateKeyToAccount(
        normalizeHex(config.OG_ANCHOR_PRIVATE_KEY),
      );
      const wallet = createWalletClient({
        account,
        chain: zeroGNewton,
        transport: http(),
      });
      const publicClient = createPublicClient({
        chain: zeroGNewton,
        transport: http(),
      });

      const txHash = await wallet.sendTransaction({
        to: account.address,
        value: 0n,
        data,
      });

      // Wait for one confirmation so the explorer link resolves.
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 30_000,
      });

      logger.info(
        `0g-chain anchored rootHash=${rootHash} tx=${txHash} block=${receipt.blockNumber}`,
      );

      return {
        txHash,
        blockNumber: Number(receipt.blockNumber),
        chainId: config.OG_CHAIN_ID,
        explorerUrl: `${EXPLORER_BASE}/${txHash}`,
        stub: false,
      };
    } catch (err) {
      const stubTx = stubTxHash(rootHash);
      logger.error(
        `0g-chain anchor failed, returning stub: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return {
        txHash: stubTx,
        chainId: config.OG_CHAIN_ID,
        explorerUrl: `stub://og-chain/${stubTx}`,
        stub: true,
      };
    }
  }
}

function normalizeHex(value: string): Hex {
  return (value.startsWith("0x") ? value : `0x${value}`) as Hex;
}

function stubTxHash(rootHash: string): string {
  // Deterministic stub — keccak the rootHash to a fixed-shape, identifiable
  // value. Prefix `0xstub` so the frontend can detect and label it.
  const fingerprint = keccak256(toHex(rootHash));
  return `0xstub${fingerprint.slice(2, 14)}${fingerprint.slice(-12)}`;
}

export const ogChain = new OgChainClient();
