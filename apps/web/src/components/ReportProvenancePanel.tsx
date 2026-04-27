import { useState } from "react";
import { LabelBadge } from "./LabelBadge.js";

export interface ReportProvenance {
  rootHash: string;
  storageUrl: string;
}

interface Props {
  provenance: ReportProvenance;
}

function shortHash(hash: string): string {
  if (hash.length <= 18) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

export function ReportProvenancePanel({ provenance }: Props) {
  const { rootHash, storageUrl } = provenance;
  const isStub = rootHash.startsWith("0xstub") || storageUrl.startsWith("stub://");
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(rootHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — clipboard might be denied in some contexts
    }
  };

  return (
    <section className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-xs uppercase tracking-wider text-slate-500">
          Report provenance
        </h2>
        <LabelBadge label={isStub ? "EMULATED" : "VERIFIED"} />
      </header>

      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500 w-20 shrink-0">rootHash</span>
          <span className="text-slate-200 truncate" title={rootHash}>
            {shortHash(rootHash)}
          </span>
          <button
            type="button"
            onClick={onCopy}
            className="ml-auto text-[10px] text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded border border-slate-700 hover:border-slate-500 transition-colors"
          >
            {copied ? "copied" : "copy"}
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500 w-20 shrink-0">storage</span>
          {storageUrl.startsWith("http") ? (
            <a
              href={storageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-300 hover:text-cyan-200 truncate"
            >
              {storageUrl}
            </a>
          ) : (
            <span className="text-slate-400 truncate" title={storageUrl}>
              {storageUrl}
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 text-[10px] text-slate-500">
        {isStub
          ? "Stub upload — the agent emitted a deterministic fingerprint of the report payload. Configure OG_STORAGE_PRIVATE_KEY on the server to publish to 0G Storage."
          : "Report payload uploaded to 0G Storage. The merkle rootHash above is content-addressed — anyone can re-download the report and verify it matches this hash."}
      </p>
    </section>
  );
}
