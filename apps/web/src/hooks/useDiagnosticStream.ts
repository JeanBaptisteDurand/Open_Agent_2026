import { useEffect, useState } from "react";
import type { DiagnosticEvent } from "@lplens/core";

export type StreamStatus = "idle" | "open" | "closed" | "error";

interface State {
  events: DiagnosticEvent[];
  status: StreamStatus;
  error?: string;
}

// sessionStorage cache so navigating to /report and coming back to the
// diagnose page (notably via the finale slide 4 iframe) doesn't replay
// the 11-phase stream. The cache lives for the tab's lifetime; closing
// the tab clears it. Keyed per tokenId.
// Bump the version suffix whenever the event payload schema changes
// OR when the server-side report cache is wiped (container rebuild),
// so stale browser sessionStorage entries don't surface dead rootHashes
// that the server no longer has cached.
const CACHE_PREFIX = "lplens.diagnoseStream.v2.";

function cacheKey(tokenId: string): string {
  return `${CACHE_PREFIX}${tokenId}`;
}

function readCache(tokenId: string): DiagnosticEvent[] | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(tokenId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DiagnosticEvent[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(tokenId: string, events: DiagnosticEvent[]): void {
  try {
    sessionStorage.setItem(cacheKey(tokenId), JSON.stringify(events));
  } catch {
    // Quota exceeded or storage disabled — degrade silently.
  }
}

// A run is "complete" once we see the final ENS phase end (phase 11).
// Anything earlier means the stream was cut short — replay it instead
// of presenting a partial run as the truth.
function isCompleteRun(events: DiagnosticEvent[]): boolean {
  return events.some(
    (e) => e.type === "phase.end" && e.phase === 11,
  );
}

// Subscribes to /api/diagnose/:tokenId via EventSource and accumulates the
// typed DiagnosticEvent stream. The hook auto-closes on unmount. If a
// complete run is already cached for this tokenId in this tab, it
// hydrates from cache and skips the network round-trip — keeping the
// finale slide 4 iframe steady when the user navigates to /report and
// back.
export function useDiagnosticStream(tokenId: string | null): State {
  const [state, setState] = useState<State>(() => {
    if (!tokenId) return { events: [], status: "idle" };
    const cached = readCache(tokenId);
    if (cached && isCompleteRun(cached)) {
      return { events: cached, status: "closed" };
    }
    return { events: [], status: "idle" };
  });

  useEffect(() => {
    if (!tokenId) {
      setState({ events: [], status: "idle" });
      return;
    }

    const cached = readCache(tokenId);
    if (cached && isCompleteRun(cached)) {
      setState({ events: cached, status: "closed" });
      return;
    }

    const url = `/api/diagnose/${tokenId}`;
    const es = new EventSource(url);
    setState({ events: [], status: "open" });

    es.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as DiagnosticEvent;
        setState((s) => {
          const next = [...s.events, event];
          writeCache(tokenId, next);
          return { ...s, events: next };
        });
      } catch {
        // ignore malformed frames
      }
    };

    es.onerror = () => {
      setState((s) => ({ ...s, status: "error", error: "stream error" }));
      es.close();
    };

    return () => {
      es.close();
      setState((s) => ({ ...s, status: "closed" }));
    };
  }, [tokenId]);

  return state;
}
