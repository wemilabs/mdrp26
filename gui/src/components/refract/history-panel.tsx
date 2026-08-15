import { ChevronDown, ChevronUp, History, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { riskTier } from "../../engine/advice-engine";
import type { PatientFormValues, SavedAssessment } from "../../types";
import { ComparisonView } from "./comparison-view";

interface HistoryPanelProps {
  history: SavedAssessment[];
  onLoad: (form: PatientFormValues) => void;
  onDelete: (id: string) => void;
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

export function HistoryPanel({ history, onLoad, onDelete }: HistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selected = history.filter((e) => selectedIds.includes(e.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id].slice(-2),
    );
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
          <ChevronUp className="size-4 text-prism-muted" />
        ) : (
          <ChevronDown className="size-4 text-prism-muted" />
        )}
      </button>

      {open && (
        <>
          {history.length === 0 ? (
            <p className="mt-3 text-xs text-prism-muted">
              No saved assessments yet. Calculate a risk estimate, then use{" "}
              <strong className="text-prism-text">Save assessment</strong> to
              keep it here for later comparison.
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
                        aria-label={`Select ${entry.label} for comparison`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-prism-text">
                          {entry.label}
                        </div>
                        <div className="text-[10.5px] text-prism-muted-2">
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
                        onClick={() => onLoad(entry.form)}
                        title="Load into form"
                        className="rounded-md p-1.5 text-prism-teal transition-colors hover:bg-prism-card"
                      >
                        <Upload className="size-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(entry.id)}
                        title="Delete"
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
        </>
      )}
    </div>
  );
}
