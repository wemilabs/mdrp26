import { AlertTriangle, FileText, Save } from "lucide-react";
import { useState } from "react";
import { getRecommendations, riskTier } from "../../engine/advice-engine";
import { buildPatientReportHTML } from "../../engine/report-builder";
import { sensitivityBand } from "../../engine/sensitivity";
import type { PatientFormValues, PredictionResult } from "../../types";
import { FactorBars } from "./factor-bars";
import { WaterfallChart } from "./waterfall-chart";

interface ResultPanelProps {
  result: PredictionResult | null;
  form: PatientFormValues;
  onShowReport: (html: string) => void;
  onSave: (label: string) => void;
}

type FactorViewMode = "bars" | "waterfall";

export function ResultPanel({
  result,
  form,
  onShowReport,
  onSave,
}: ResultPanelProps) {
  const [viewMode, setViewMode] = useState<FactorViewMode>("bars");
  const [labelDraft, setLabelDraft] = useState<string | null>(null);

  if (!result) {
    return (
      <div className="rounded-2xl border border-prism-border bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-prism-muted">
          Enter patient data and select{" "}
          <strong className="text-prism-text">Calculate Risk</strong> to
          generate a prediction and explanation.
        </p>
      </div>
    );
  }

  const tier = riskTier(result.probability);
  const top = result.ranked.slice(0, 6);
  const recs = getRecommendations(result.probability, result.ranked);
  const band = sensitivityBand(form);
  const scaleMax = Math.min(1, Math.max(band.high * 1.4, 0.05));

  return (
    <div className="rounded-2xl border border-prism-border bg-white p-6 shadow-sm">
      <div className="text-xs font-semibold tracking-wide text-prism-muted">
        PREDICTED MORTALITY RISK
      </div>
      <div className="mt-1.5 flex items-baseline gap-3">
        <span
          className="font-display text-[42px] font-bold"
          style={{ color: tier.colorVar }}
        >
          {(result.probability * 100).toFixed(1)}%
        </span>
        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{
            backgroundColor: `color-mix(in srgb, ${tier.colorVar} 15%, white)`,
            color: tier.colorVar,
          }}
        >
          {tier.label} risk
        </span>
      </div>

      <div className="mt-3">
        <div className="relative h-2 rounded-full bg-prism-card">
          <div
            className="absolute h-2 rounded-full"
            style={{
              left: `${(band.low / scaleMax) * 100}%`,
              width: `${Math.max(((band.high - band.low) / scaleMax) * 100, 1)}%`,
              backgroundColor: `color-mix(in srgb, ${tier.colorVar} 35%, white)`,
            }}
          />
          <div
            className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full"
            style={{
              left: `${(result.probability / scaleMax) * 100}%`,
              backgroundColor: tier.colorVar,
            }}
          />
        </div>
        <p className="mt-1.5 text-[10.5px] leading-snug text-prism-muted-2">
          Sensitivity: {(band.low * 100).toFixed(1)}%&ndash;
          {(band.high * 100).toFixed(1)}% under &plusmn;5% input variation
          &mdash; not a confidence interval.
        </p>
      </div>

      <div className="my-4 h-px bg-prism-border" />

      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-bold text-prism-text">
          Top contributing factors
        </span>
        <div className="flex rounded-lg bg-prism-card p-0.5">
          {(["bars", "waterfall"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`rounded-md px-2.5 py-1 text-[10.5px] font-semibold transition-colors ${
                viewMode === mode
                  ? "bg-white text-prism-teal shadow-sm"
                  : "text-prism-muted hover:text-prism-text"
              }`}
            >
              {mode === "bars" ? "Bars" : "Waterfall"}
            </button>
          ))}
        </div>
      </div>
      {viewMode === "bars" ? (
        <FactorBars factors={top} />
      ) : (
        <WaterfallChart result={result} />
      )}
      <p className="mt-2 text-[10.5px] leading-snug text-prism-muted-2">
        Contributions are estimated via tree path-decomposition, aggregated
        across each clinical variable's recorded range.
      </p>

      <div className="my-4 h-px bg-prism-border" />

      <div className="mb-2 text-xs font-bold text-prism-text">
        Suggested next steps
      </div>
      <div className="mb-2.5 rounded-lg bg-prism-card px-3 py-2.5 text-[13px] leading-snug text-prism-text">
        {recs.summary}
      </div>
      {recs.items.length > 0 && (
        <ul className="mb-1 space-y-2 pl-4">
          {recs.items.map((it) => (
            <li
              key={it.factor}
              className="list-disc text-xs leading-snug text-prism-muted marker:text-prism-teal"
            >
              <strong className="text-prism-text">{it.factor}:</strong>{" "}
              {it.advice}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex items-start gap-1.5 text-[10.5px] font-semibold leading-snug text-prism-red">
        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
        Educational output only — not clinical advice. Care decisions must be
        made by qualified clinicians.
      </div>

      <button
        onClick={() =>
          onShowReport(buildPatientReportHTML(form, result, recs, band))
        }
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-prism-teal py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-prism-dark"
      >
        <FileText className="h-4 w-4" />
        View / Print Patient Report
      </button>

      {labelDraft === null ? (
        <button
          onClick={() => setLabelDraft("")}
          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-prism-teal/40 py-2.5 text-sm font-semibold text-prism-teal transition-colors hover:bg-prism-card"
        >
          <Save className="h-4 w-4" />
          Save assessment
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(
              labelDraft.trim() || `Assessment ${new Date().toLocaleString()}`,
            );
            setLabelDraft(null);
          }}
          className="mt-2.5 flex gap-2"
        >
          <input
            autoFocus
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            placeholder="Label (e.g. Bed 12, day 2)"
            className="w-full flex-1 rounded-lg border border-prism-border bg-white px-3 py-2 text-sm text-prism-text outline-none focus:border-prism-teal focus:ring-2 focus:ring-prism-teal/20"
          />
          <button
            type="submit"
            className="rounded-lg bg-prism-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-prism-dark"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setLabelDraft(null)}
            className="rounded-lg border border-prism-muted-2/40 px-3 py-2 text-sm font-semibold text-prism-muted transition-colors hover:bg-prism-card"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
