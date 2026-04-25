import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PositionCard } from "../components/PositionCard.js";
import { fetchPositions } from "../lib/api.js";

export function Atlas() {
  const [address, setAddress] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["positions", submitted],
    queryFn: () => fetchPositions(submitted!),
    enabled: !!submitted,
  });

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

        {!submitted ? (
          <p className="mt-6 text-slate-500 text-sm">
            Paste a wallet address above to list LP positions.
          </p>
        ) : isLoading ? (
          <p className="mt-6 text-slate-500 text-sm">loading...</p>
        ) : error ? (
          <p className="mt-6 text-rose-400 text-sm font-mono">
            error: {(error as Error).message}
          </p>
        ) : data && data.positions.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.positions.map((p) => (
              <PositionCard key={p.id} position={p} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-slate-500 text-sm font-mono">
            no positions found for {submitted}
          </p>
        )}
      </section>
    </div>
  );
}
