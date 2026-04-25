import type { DiagnosticEvent } from "@lplens/core";

// Yields a scripted sequence of DiagnosticEvents while the real 9-phase
// agent is being implemented. Mirrors the timing the real agent will
// produce so the frontend can be wired and demoed end to end.

export async function* fakePhaseSequence(
  tokenId: string,
): AsyncIterable<DiagnosticEvent> {
  yield { type: "phase.start", phase: 1, label: "position resolution" };
  await sleep(400);
  yield { type: "tool.call", tool: "getPosition", input: { tokenId } };
  await sleep(600);
  yield {
    type: "tool.result",
    tool: "getPosition",
    output: { tokenId, status: "stub" },
    latencyMs: 600,
  };
  yield { type: "phase.end", phase: 1, durationMs: 1000 };

  yield { type: "phase.start", phase: 3, label: "IL reconstruction" };
  await sleep(800);
  yield { type: "narrative", text: "Reconstructing impermanent loss..." };
  await sleep(800);
  yield { type: "phase.end", phase: 3, durationMs: 1600 };

  yield {
    type: "verdict.partial",
    markdown: "## Position health\n\nStub — wiring real agent next.",
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
