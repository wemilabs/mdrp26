import {
  ChevronDown,
  ChevronUp,
  Download,
  FileUp,
  History,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { riskTier } from "../../engine/advice-engine";
import { exportHistory, importHistory } from "../../engine/history-store";
import type { SavedAssessment } from "../../types";
import { ComparisonView } from "./comparison-view";

interface HistoryPanelProps {
  history: SavedAssessment[];
  onLoad: (entry: SavedAssessment) => void;
  onDelete: (id: string) => void;
  onReplaceHistory: (history: SavedAssessment[]) => void;
}

function relativeTime(ts: number): string {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(ts).toLocaleDateString();
}

export function HistoryPanel({
  history,
  onLoad,
  onDelete,
  onReplaceHistory,
}: HistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selected = history.filter((e) => selectedIds.includes(e.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id].slice(-2),
    );
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const merged = importHistory(String(reader.result));
        onReplaceHistory(merged);
        setImportError(null);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "Import failed.");
      }
    };
    reader.onerror = () => setImportError("Could not read the file.");
    reader.readAsText(file);
  };

  return (
    <div className="mt-6 rounded-2xl border border-prism-border bg-white p-5 shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 text-xs font-bold text-prism-text">
          <History className="size-3.5 text-prism-teal" />
          Saved assessments
          <span className="rounded-full bg-prism-card px-2 py-0.5 text-[10.5px] font-semibold text-prism-muted">
            {history.length}
          </span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-prism-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-prism-muted" />
        )}
      </button>

      {open && (
        <>
          {history.length === 0 ? (
            <p className="mt-3 text-xs text-prism-muted">
              No saved assessments yet. Use{" "}
              <strong className="text-prism-text">Save assessment</strong> to
              keep one here for later comparison.
            </p>
          ) : (
            <>
              <p className="mt-2 text-[10.5px] leading-snug text-prism-muted-2">
                Stored only in this browser. Select two entries to compare them
                side by side.
              </p>
              <div className="mt-3 space-y-1.5">
                {history.map((entry) => {
                  const tier = riskTier(entry.probability);
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 rounded-lg border border-prism-border px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(entry.id)}
                        onChange={() => toggleSelect(entry.id)}
                        className="accent-prism-teal"
                        aria-label={`Select ${entry.patientId || entry.label} for comparison`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-prism-text">
                          {entry.patientId || entry.label}
                        </div>
                        <div className="truncate text-[10.5px] text-prism-muted-2">
                          {entry.patientId ? `${entry.label} · ` : ""}
                          {relativeTime(entry.savedAt)}
                        </div>
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${tier.colorVar} 15%, white)`,
                          color: tier.colorVar,
                        }}
                      >
                        {(entry.probability * 100).toFixed(1)}%
                      </span>
                      <button
                        onClick={() => onLoad(entry)}
                        title="Load into form"
                        aria-label={`Load ${entry.patientId || entry.label} into form`}
                        className="rounded-md p-1.5 text-prism-teal transition-colors hover:bg-prism-card"
                      >
                        <Upload className="size-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(entry.id)}
                        title="Delete"
                        aria-label={`Delete ${entry.patientId || entry.label}`}
                        className="rounded-md p-1.5 text-prism-muted transition-colors hover:bg-prism-card hover:text-prism-red"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
              {selected.length === 2 && (
                <ComparisonView entries={[selected[0], selected[1]]} />
              )}
            </>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={exportHistory}
              disabled={history.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-prism-teal/40 px-3 py-1.5 text-xs font-semibold text-prism-teal transition-colors hover:bg-prism-teal hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="size-3" />
              Export
            </button>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-prism-muted-2/40 px-3 py-1.5 text-xs font-semibold text-prism-muted transition-colors hover:bg-prism-card">
              <FileUp className="size-3" />
              Import
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportFile(file);
                  e.target.value = "";
                }}
              />
            </label>
            {importError && (
              <span className="text-[10.5px] font-semibold text-prism-red">
                {importError}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
