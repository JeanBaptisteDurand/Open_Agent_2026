// Wrap an emit() function so every DiagnosticEvent gets logged to a
// JSONL file with a `t_ms_relative` offset from the first event. The
// returned tap is drop-in for the existing SSEStream.emit signature.
// On finalize, the buffered lines are flushed to disk in one append.

import { appendFileSync } from "node:fs";
import path from "node:path";
import type { DiagnosticEvent } from "@lplens/core";
import { recordingsDir } from "./paths.js";

export interface RecordedRun {
  tokenId: string;
  events: number;
  durationMs: number;
  filePath: string;
}

interface Line {
  t: number;
  ev: DiagnosticEvent;
}

export function recordDiagnose(
  tokenId: string,
  underlying: (ev: DiagnosticEvent) => void,
): {
  tap: (ev: DiagnosticEvent) => void;
  finalize: () => RecordedRun;
} {
  const lines: Line[] = [];
  const t0 = Date.now();
  let firstAt: number | null = null;

  const tap = (ev: DiagnosticEvent): void => {
    if (firstAt === null) firstAt = Date.now();
    lines.push({ t: Date.now() - (firstAt ?? t0), ev });
    underlying(ev);
  };

  const finalize = (): RecordedRun => {
    const filePath = path.join(recordingsDir, `${tokenId}.jsonl`);
    const buf = lines
      .map((l) => JSON.stringify({ t_ms_relative: l.t, payload: l.ev }))
      .join("\n");
    appendFileSync(filePath, buf + "\n", "utf8");
    return {
      tokenId,
      events: lines.length,
      durationMs: lines.length > 0 ? lines[lines.length - 1]!.t : 0,
      filePath,
    };
  };

  return { tap, finalize };
}
