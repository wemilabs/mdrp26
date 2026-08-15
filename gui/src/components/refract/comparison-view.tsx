import { riskTier } from "../../engine/advice-engine";
import type { SavedAssessment } from "../../types";
import { FactorBars } from "./factor-bars";

function factorValue(entry: SavedAssessment, name: string): number {
  return entry.ranked.find((r) => r.name === name)?.value ?? 0;
}

export function ComparisonView({
  entries,
}: {
  entries: [SavedAssessment, SavedAssessment];
}) {
  const [a, b] = [...entries].sort((x, y) => x.savedAt - y.savedAt);
  const deltaPts = (b.probability - a.probability) * 100;
  const factorNames = [
    ...new Set(
      [...a.ranked.slice(0, 6), ...b.ranked.slice(0, 6)].map((r) => r.name),
    ),
  ];

  return (
    <div className="mt-4 rounded-xl border border-prism-border bg-prism-bg p-4">
      <div className="mb-3 flex items-baseline gap-2 text-sm">
        <span className="font-bold text-prism-text">Comparison</span>
        <span
          className={`text-xs font-semibold ${deltaPts > 0 ? "text-prism-red" : "text-prism-seafoam"}`}
        >
          {deltaPts >= 0 ? "+" : ""}
          {deltaPts.toFixed(1)} pts from earlier to later assessment
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[a, b].map((entry) => {
          const tier = riskTier(entry.probability);
          return (
            <div
              key={entry.id}
              className="rounded-lg border border-prism-border bg-white p-3.5"
            >
              <div className="truncate text-xs font-semibold text-prism-text">
                {entry.patientId || entry.label}
              </div>
              <div className="mb-2 truncate text-[10.5px] text-prism-muted-2">
                {entry.patientId ? `${entry.label} · ` : ""}
                {new Date(entry.savedAt).toLocaleString()}
              </div>
              <div className="mb-3 flex items-baseline gap-2">
                <span
                  className="font-display text-2xl font-bold"
                  style={{ color: tier.colorVar }}
                >
                  {(entry.probability * 100).toFixed(1)}%
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${tier.colorVar} 15%, white)`,
                    color: tier.colorVar,
                  }}
                >
                  {entry.tierLabel}
                </span>
              </div>
              <FactorBars factors={entry.ranked.slice(0, 6)} />
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <div className="mb-1.5 text-xs font-bold text-prism-text">
          Per-factor change (later &minus; earlier)
        </div>
        <div className="space-y-1">
          {factorNames.map((name) => {
            const delta = factorValue(b, name) - factorValue(a, name);
            return (
              <div
                key={name}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-prism-muted">{name}</span>
                <span
                  className={`font-semibold ${delta > 0 ? "text-prism-red" : delta < 0 ? "text-prism-seafoam" : "text-prism-muted-2"}`}
                >
                  {delta >= 0 ? "+" : ""}
                  {delta.toFixed(3)} log-odds
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
