import { Link, useParams } from "react-router-dom";
import { LabelBadge } from "../components/LabelBadge.js";
import { useReport } from "../hooks/useReport.js";

export function Report() {
  const { rootHash } = useParams<{ rootHash: string }>();
  const { status, report, error } = useReport(rootHash ?? null);

  if (!rootHash) {
    return (
      <div className="min-h-screen p-8">
        <p className="text-rose-400">Missing rootHash in URL.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <header className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← back to atlas
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Report</h1>
        <p className="mt-1 text-slate-400 font-mono text-xs break-all">
          rootHash {rootHash}
        </p>
      </header>

      <main className="max-w-4xl mx-auto mt-8">
        {status === "loading" && (
          <p className="text-slate-500 text-sm">loading report…</p>
        )}
        {status === "error" && (
          <p className="text-rose-400 text-sm">{error}</p>
        )}
        {status === "ready" && report && (
          <section className="p-6 rounded-lg border border-slate-700 bg-slate-900/50 space-y-4">
            <header className="flex items-center justify-between">
              <h2 className="text-sm uppercase tracking-wider text-slate-500">
                payload
              </h2>
              <LabelBadge label="VERIFIED" />
            </header>
            <pre className="text-[11px] font-mono text-slate-300 overflow-auto">
              {JSON.stringify(report.payload, null, 2)}
            </pre>
          </section>
        )}
      </main>
    </div>
  );
}
