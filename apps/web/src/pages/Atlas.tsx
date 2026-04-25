import { useState } from "react";
import { PositionCard } from "../components/PositionCard.js";
import type { V3PositionRaw } from "../lib/api.js";

const SAMPLE: V3PositionRaw[] = [];

export function Atlas() {
  const [address, setAddress] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  return (
    <div className="min-h-screen p-8">
      <header className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-semibold tracking-tight">LPLens</h1>
        <p className="mt-2 text-sm text-slate-400">
          Diagnostic agent for Uniswap V3/V4 LP positions.
        </p>
      </header>

      <section className="max-w-4xl mx-auto mt-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(address.trim());
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x... wallet address"
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded font-mono text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium rounded disabled:opacity-50"
            disabled={!address.trim()}
          >
            Load
          </button>
        </form>

        {submitted ? (
          SAMPLE.length === 0 ? (
            <p className="mt-6 text-slate-500 text-sm font-mono">
              no positions yet — fetch wiring lands in next commit
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SAMPLE.map((p) => (
                <PositionCard key={p.id} position={p} />
              ))}
            </div>
          )
        ) : (
          <p className="mt-6 text-slate-500 text-sm">
            Paste a wallet address above to list LP positions.
          </p>
        )}
      </section>
    </div>
  );
}
