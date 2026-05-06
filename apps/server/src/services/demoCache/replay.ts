// Replay a recorded JSONL run back through an SSEStream. Cadence is
// preserved by default but can be compressed via SCALE so the demo
// fits the storyboard's 1:40 diagnose window. If the recording is
// missing, hasRecording() returns false and the caller falls back to
// the live pipeline (or, in finale mode, surfaces an EMULATED label).

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { DiagnosticEvent } from "@lplens/core";
import type { SSEStream } from "../../lib/sse.js";
import { recordingsDir } from "./paths.js";

const SCALE = Number(process.env.DEMO_REPLAY_SCALE ?? "0.5"); // 0.5 = 2x faster

interface Line {
  t_ms_relative: number;
  payload: DiagnosticEvent;
}

function fileFor(tokenId: string): string {
  return path.join(recordingsDir, `${tokenId}.jsonl`);
}

export function hasRecording(tokenId: string): boolean {
  return existsSync(fileFor(tokenId));
}

export function listRecordings(): string[] {
  if (!existsSync(recordingsDir)) return [];
  return readdirSync(recordingsDir)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => f.replace(/\.jsonl$/, ""));
}

function loadLines(tokenId: string): Line[] {
  const raw = readFileSync(fileFor(tokenId), "utf8");
  const out: Line[] = [];
  for (const ln of raw.split(/\n/)) {
    if (!ln.trim()) continue;
    try {
      out.push(JSON.parse(ln) as Line);
    } catch {
      // skip malformed lines
    }
  }
  return out;
}

export async function replayDiagnose(
  tokenId: string,
  sse: SSEStream,
  signal: AbortSignal,
): Promise<void> {
  const lines = loadLines(tokenId);
  if (lines.length === 0) return;

  const t0 = Date.now();
  for (const ln of lines) {
    if (signal.aborted) return;
    const targetMs = ln.t_ms_relative * SCALE;
    const now = Date.now() - t0;
    const wait = Math.max(0, targetMs - now);
    if (wait > 0) {
      await new Promise<void>((resolve) => {
        const id = setTimeout(resolve, wait);
        signal.addEventListener("abort", () => {
          clearTimeout(id);
          resolve();
        });
      });
    }
    if (signal.aborted) return;
    sse.emit(ln.payload);
  }
}
