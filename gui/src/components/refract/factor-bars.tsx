import { ArrowDown, ArrowUp } from "lucide-react";
import type { RankedFactor } from "../../types";

export function FactorBars({ factors }: { factors: RankedFactor[] }) {
  const maxAbs = Math.max(...factors.map((t) => Math.abs(t.value)), 0.0001);

  return (
    <div className="space-y-2.5">
      {factors.map((t) => {
        const pct = (Math.abs(t.value) / maxAbs) * 100;
        const isRisk = t.value > 0;
        return (
          <div key={t.name}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-prism-text">{t.name}</span>
              <span
                className={`flex items-center gap-0.5 font-semibold ${isRisk ? "text-prism-red" : "text-prism-seafoam"}`}
              >
                {isRisk ? (
                  <ArrowUp className="size-3" />
                ) : (
                  <ArrowDown className="size-3" />
                )}
                {isRisk ? "Increases risk" : "Decreases risk"}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-prism-card">
              <div
                className={`h-1.5 rounded-full ${isRisk ? "bg-prism-red" : "bg-prism-seafoam"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
