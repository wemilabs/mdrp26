import { AlertTriangle, ArrowDown, ArrowUp, FileText } from "lucide-react";
import type { PatientFormValues, PredictionResult } from "../../types";
import { riskTier, getRecommendations } from "../../engine/advice-engine";
import { buildPatientReportHTML } from "../../engine/report-builder";

interface ResultPanelProps {
  result: PredictionResult | null;
  form: PatientFormValues;
  onShowReport: (html: string) => void;
}

export function ResultPanel({ result, form, onShowReport }: ResultPanelProps) {
  if (!result) {
    return (
      <div className="rounded-2xl border border-prism-border bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-prism-muted">
          Enter patient data and select <strong className="text-prism-text">Calculate Risk</strong> to generate a
          prediction and explanation.
        </p>
      </div>
    );
  }

  const tier = riskTier(result.probability);
  const top = result.ranked.slice(0, 6);
  const maxAbs = Math.max(...top.map((t) => Math.abs(t.value)), 0.0001);
  const recs = getRecommendations(result.probability, result.ranked);

  return (
    <div className="rounded-2xl border border-prism-border bg-white p-6 shadow-sm">
      <div className="text-xs font-semibold tracking-wide text-prism-muted">PREDICTED MORTALITY RISK</div>
      <div className="mt-1.5 flex items-baseline gap-3">
        <span className="font-display text-[42px] font-bold" style={{ color: tier.colorVar }}>
          {(result.probability * 100).toFixed(1)}%
        </span>
        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{ backgroundColor: `color-mix(in srgb, ${tier.colorVar} 15%, white)`, color: tier.colorVar }}
        >
          {tier.label} risk
        </span>
      </div>

      <div className="my-4 h-px bg-prism-border" />

      <div className="mb-2.5 text-xs font-bold text-prism-text">Top contributing factors</div>
      <div className="space-y-2.5">
        {top.map((t) => {
          const pct = (Math.abs(t.value) / maxAbs) * 100;
          const isRisk = t.value > 0;
          return (
            <div key={t.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-prism-text">{t.name}</span>
                <span
                  className={`flex items-center gap-0.5 font-semibold ${isRisk ? "text-prism-red" : "text-prism-seafoam"}`}
                >
                  {isRisk ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
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
      <p className="mt-2 text-[10.5px] leading-snug text-prism-muted-2">
        Contributions are estimated via tree path-decomposition, aggregated across each clinical variable's
        recorded range.
      </p>

      <div className="my-4 h-px bg-prism-border" />

      <div className="mb-2 text-xs font-bold text-prism-text">Suggested next steps</div>
      <div className="mb-2.5 rounded-lg bg-prism-card px-3 py-2.5 text-[13px] leading-snug text-prism-text">
        {recs.summary}
      </div>
      {recs.items.length > 0 && (
        <ul className="mb-1 space-y-2 pl-4">
          {recs.items.map((it) => (
            <li key={it.factor} className="list-disc text-xs leading-snug text-prism-muted marker:text-prism-teal">
              <strong className="text-prism-text">{it.factor}:</strong> {it.advice}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex items-start gap-1.5 text-[10.5px] font-semibold leading-snug text-prism-red">
        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
        Educational output only — not clinical advice. Care decisions must be made by qualified clinicians.
      </div>

      <button
        onClick={() => onShowReport(buildPatientReportHTML(form, result, recs))}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-prism-teal py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-prism-dark"
      >
        <FileText className="h-4 w-4" />
        View / Print Patient Report
      </button>
    </div>
  );
}
