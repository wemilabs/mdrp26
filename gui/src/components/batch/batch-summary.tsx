import type { BatchRow } from "./batch-view";

interface BatchSummaryProps {
  rows: BatchRow[];
}

export function BatchSummary({ rows }: BatchSummaryProps) {
  const count = rows.length;
  const avgRisk = rows.reduce((sum, r) => sum + r.probability, 0) / count;
  const tierCounts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.tier.label] = (acc[r.tier.label] ?? 0) + 1;
    return acc;
  }, {});
  const flaggedCount = rows.filter((r) => r.issues.length > 0).length;

  const tierBreakdown = ["Low", "Moderate", "Elevated", "High"]
    .filter((t) => tierCounts[t])
    .map((t) => `${tierCounts[t]} ${t.toLowerCase()}`)
    .join(" · ");

  const stats = [
    { value: String(count), label: "Patients scored" },
    { value: `${(avgRisk * 100).toFixed(1)}%`, label: "Average risk" },
    { value: tierBreakdown || "—", label: "Risk tiers" },
    { value: String(flaggedCount), label: "Rows with implausible values" },
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
