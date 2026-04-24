import { useEffect, useState } from "react";

interface HealthResponse {
  status: string;
  service: string;
  env: string;
}

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/health")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setHealth)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-semibold tracking-tight">LPLens</h1>
      <p className="mt-2 text-sm text-slate-400">
        Diagnostic agent for Uniswap V3/V4 LP positions.
      </p>

      <section className="mt-10 p-6 rounded-lg border border-slate-700 bg-slate-900/50 min-w-[320px]">
        <h2 className="text-xs uppercase tracking-wider text-slate-500">Backend health</h2>
        {error ? (
          <p className="mt-2 text-rose-400 font-mono text-sm">error: {error}</p>
        ) : health ? (
          <pre className="mt-2 text-emerald-300 font-mono text-sm">
            {JSON.stringify(health, null, 2)}
          </pre>
        ) : (
          <p className="mt-2 text-slate-400 text-sm">loading...</p>
        )}
      </section>
    </div>
  );
}
