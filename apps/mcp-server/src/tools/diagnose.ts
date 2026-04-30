// lplens.diagnose — runs the full diagnostic pipeline on a
// Uniswap LP position. Wraps the server's SSE stream and accumulates
// every event into a structured summary the calling agent can reason
// over: position, IL breakdown, regime, candidate hooks, migration
// preview, report rootHash, anchor txHash, ENS subname, and verdict
// markdown.

import { z } from "zod";

const DEFAULT_BASE_URL =
  process.env.LPLENS_API_URL ?? "http://localhost:3001";

export const diagnoseInputSchema = z.object({
  tokenId: z.string().min(1),
  apiUrl: z.string().url().optional(),
  timeoutMs: z.number().int().positive().max(120_000).optional(),
});

export type DiagnoseInput = z.infer<typeof diagnoseInputSchema>;

export interface DiagnoseSummary {
  tokenId: string;
  position?: { pair: string; tickLower: number; tickUpper: number; liquidity: string };
  il?: {
    hodlValueT1: number;
    lpValueT1: number;
    feesValueT1: number;
    ilT1: number;
    ilPct: number;
  };
  regime?: { topLabel: string; confidence: number };
  hooks?: { topFamily: string; count: number };
  migration?: {
    targetHookAddress?: string;
    priceImpactPct?: number;
    warnings: string[];
  };
  provenance?: { rootHash: string; storageUrl: string; stub: boolean };
  anchor?: { txHash: string; chainId: number; stub: boolean };
  verdict?: { markdown: string; model: string; stub: boolean };
  ens?: { fullName: string; resolverUrl: string; recordCount: number; stub: boolean };
  errors: string[];
  durationMs: number;
}

interface Event {
  type: string;
  [k: string]: unknown;
}

export async function diagnose(input: DiagnoseInput): Promise<DiagnoseSummary> {
  const baseUrl = input.apiUrl ?? DEFAULT_BASE_URL;
  const timeoutMs = input.timeoutMs ?? 90_000;
  const t0 = Date.now();

  const summary: DiagnoseSummary = {
    tokenId: input.tokenId,
    errors: [],
    durationMs: 0,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}/api/diagnose/${input.tokenId}`, {
      headers: { Accept: "text/event-stream" },
      signal: controller.signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(`HTTP ${res.status} from ${baseUrl}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by blank lines.
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));
        if (!dataLine) continue;
        const json = dataLine.slice(5).trim();
        if (!json) continue;
        try {
          const ev = JSON.parse(json) as Event;
          applyEvent(summary, ev);
        } catch {
          // skip malformed frame
        }
      }
    }
  } catch (err) {
    summary.errors.push(err instanceof Error ? err.message : String(err));
  } finally {
    clearTimeout(timeout);
  }

  summary.durationMs = Date.now() - t0;
  return summary;
}

function applyEvent(s: DiagnoseSummary, ev: Event): void {
  if (ev.type === "tool.result") {
    const tool = ev["tool"] as string;
    const out = ev["output"] as Record<string, unknown>;
    if (tool === "getV3Position" && out) {
      s.position = {
        pair: String(out["pair"] ?? ""),
        tickLower: Number(out["tickLower"] ?? 0),
        tickUpper: Number(out["tickUpper"] ?? 0),
        liquidity: String(out["liquidity"] ?? ""),
      };
    } else if (tool === "computeIL" && out) {
      s.il = {
        hodlValueT1: Number(out["hodlValueT1"] ?? 0),
        lpValueT1: Number(out["lpValueT1"] ?? 0),
        feesValueT1: Number(out["feesValueT1"] ?? 0),
        ilT1: Number(out["ilT1"] ?? 0),
        ilPct: Number(out["ilPct"] ?? 0),
      };
    } else if (tool === "classifyRegime" && out) {
      s.regime = {
        topLabel: String(out["topLabel"] ?? ""),
        confidence: Number(out["confidence"] ?? 0),
      };
    } else if (tool === "discoverV4Hooks" && out) {
      s.hooks = {
        topFamily: String(out["topFamily"] ?? "UNKNOWN"),
        count: Number(out["count"] ?? 0),
      };
    } else if (tool === "buildMigrationPreview" && out) {
      const targetHook = out["targetHook"] as Record<string, unknown> | undefined;
      const swapQuote = out["swapQuote"] as Record<string, unknown> | undefined;
      s.migration = {
        targetHookAddress: targetHook ? String(targetHook["address"]) : undefined,
        priceImpactPct: swapQuote
          ? Number(swapQuote["priceImpact"] ?? 0) * 100
          : undefined,
        warnings: (out["warnings"] as string[]) ?? [],
      };
    } else if (tool === "publishEnsRecords" && out) {
      const records = (out["records"] as unknown[]) ?? [];
      s.ens = {
        fullName: String(out["fullName"] ?? ""),
        resolverUrl: String(out["resolverUrl"] ?? ""),
        recordCount: records.length,
        stub: Boolean(out["stub"]),
      };
    }
  } else if (ev.type === "report.uploaded") {
    const rootHash = String(ev["rootHash"] ?? "");
    const storageUrl = String(ev["storageUrl"] ?? "");
    s.provenance = {
      rootHash,
      storageUrl,
      stub: rootHash.startsWith("0xstub") || storageUrl.startsWith("stub://"),
    };
  } else if (ev.type === "report.anchored") {
    const txHash = String(ev["txHash"] ?? "");
    s.anchor = {
      txHash,
      chainId: Number(ev["chainId"] ?? 0),
      stub: txHash.startsWith("0xstub"),
    };
  } else if (ev.type === "verdict.final") {
    const labels = (ev["labels"] as Record<string, string>) ?? {};
    s.verdict = {
      markdown: String(ev["markdown"] ?? ""),
      model: String(labels["model"] ?? ""),
      stub: labels["label"] === "EMULATED",
    };
  } else if (ev.type === "error") {
    s.errors.push(String(ev["message"] ?? "unknown error"));
  }
}

export const diagnoseToolDefinition = {
  name: "lplens.diagnose",
  description:
    "Run the full LPLens diagnostic on a Uniswap V3 LP position. Streams SSE from the server, returns a structured summary of position, IL, regime, hooks, migration plan, signed report, on-chain anchor, ENS publish, and TEE verdict.",
  inputSchema: {
    type: "object",
    properties: {
      tokenId: {
        type: "string",
        description: "Uniswap V3 NFT tokenId of the LP position.",
      },
      apiUrl: {
        type: "string",
        description:
          "LPLens API URL. Defaults to LPLENS_API_URL env or http://localhost:3001.",
      },
      timeoutMs: {
        type: "number",
        description: "Stream timeout in milliseconds (max 120 000).",
      },
    },
    required: ["tokenId"],
    additionalProperties: false,
  },
} as const;
