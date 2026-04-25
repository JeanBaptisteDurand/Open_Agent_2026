import { useParams } from "react-router-dom";

export function Diagnose() {
  const { tokenId } = useParams<{ tokenId: string }>();

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Diagnose</h1>
      <p className="mt-2 text-slate-400 font-mono text-sm">
        tokenId: {tokenId ?? "(missing)"}
      </p>
      <p className="mt-6 text-slate-500 text-sm">
        SSE stream wires in the next commit.
      </p>
    </div>
  );
}
