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

// 0G Chain anchor — preferred path is to call LPLensReports.publishReport
// when LPLENS_REPORTS_CONTRACT is configured. That gives us a real
// content-addressed registry on 0G Chain (anyone can read by rootHash).
// Fallback path is a self-tx with the rootHash as calldata, which still
// puts the hash on chain but without the registry indexing. Last fallback
// is a deterministic stub — used when no signing key is set.

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
  contract?: string;
  stub: boolean;
}

const EXPLORER_BASE = "https://chainscan-newton.0g.ai/tx";

const LPLENS_REPORTS_ABI = [
  {
    name: "publishReport",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "rootHash", type: "bytes32" },
      { name: "attestation", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

export class OgChainClient {
  isReady(): boolean {
    return Boolean(config.OG_ANCHOR_PRIVATE_KEY);
  }

  hasContract(): boolean {
    return Boolean(config.LPLENS_REPORTS_CONTRACT);
  }

  async anchor(rootHash: string, tokenId?: string): Promise<AnchorReceipt> {
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

      let txHash: Hex;

      if (config.LPLENS_REPORTS_CONTRACT) {
        // Preferred: call the registry contract.
        txHash = await wallet.writeContract({
          address: config.LPLENS_REPORTS_CONTRACT as Hex,
          abi: LPLENS_REPORTS_ABI,
          functionName: "publishReport",
          args: [
            BigInt(tokenId ?? "0"),
            normalizeHex(rootHash),
            "0x" as Hex,
          ],
        });
      } else {
        // Fallback: self-tx with rootHash as calldata.
        txHash = await wallet.sendTransaction({
          to: account.address,
          value: 0n,
          data: normalizeHex(rootHash),
        });
      }

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 30_000,
      });

      logger.info(
        `0g-chain anchored rootHash=${rootHash} tx=${txHash} block=${receipt.blockNumber} contract=${config.LPLENS_REPORTS_CONTRACT ?? "self-tx"}`,
      );

      return {
        txHash,
        blockNumber: Number(receipt.blockNumber),
        chainId: config.OG_CHAIN_ID,
        explorerUrl: `${EXPLORER_BASE}/${txHash}`,
        contract: config.LPLENS_REPORTS_CONTRACT,
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
