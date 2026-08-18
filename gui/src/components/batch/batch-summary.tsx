import type { BatchRow } from "./batch-view";

interface BatchSummaryProps {
  rows: BatchRow[];
}

export function BatchSummary({ rows }: BatchSummaryProps) {
  const count = rows.length;
  const avgRisk = rows.reduce((sum, r) => sum + r.probability, 0) / count;
  const avgWidth =
    rows.reduce((sum, r) => sum + r.uncertainty.width, 0) / count;
  const wideCount = rows.filter((r) => r.uncertainty.tier === "wide").length;

  const stats = [
    { value: String(count), label: "Patients scored" },
    { value: `${(avgRisk * 100).toFixed(1)}%`, label: "Average risk" },
    {
      value: `${(avgWidth * 100).toFixed(1)} pp`,
      label: "Mean 95% UI width",
    },
    { value: String(wideCount), label: "Wide-uncertainty rows" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl bg-prism-dark px-4 py-4 shadow-sm"
        >
          <div className="font-display text-[22px] font-bold text-prism-mint">
            {s.value}
          </div>
          <div className="mt-0.5 text-xs text-white/70">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
