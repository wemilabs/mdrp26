import { ChevronDown, ChevronUp, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { FIELD_GROUPS } from "../../data/fields";
import { riskTier } from "../../engine/advice-engine";
import { LABEL_TO_FIELD, predict } from "../../engine/predict-engine";
import type { FieldDefinition, PatientFormValues, PredictionResult } from "../../types";

interface WhatIfPanelProps {
  baselineForm: PatientFormValues;
  baselineResult: PredictionResult;
}

const ALL_FIELDS = FIELD_GROUPS.flatMap((g) => g.fields);
const MODIFIABLE_FIELDS = ALL_FIELDS.filter((f) => f.modifiable && f.type === "number");
const FIELD_BY_KEY: Record<string, FieldDefinition> = Object.fromEntries(MODIFIABLE_FIELDS.map((f) => [f.key, f]));

function defaultKeys(result: PredictionResult): string[] {
  return result.ranked
    .slice(0, 6)
    .map((r) => LABEL_TO_FIELD[r.name])
    .filter((key): key is string => Boolean(key && FIELD_BY_KEY[key]));
}

export function WhatIfPanel({ baselineForm, baselineResult }: WhatIfPanelProps) {
  const [open, setOpen] = useState(true);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [extraKeys, setExtraKeys] = useState<string[]>([]);

  const shownKeys = [...new Set([...defaultKeys(baselineResult), ...extraKeys])];
  const remaining = MODIFIABLE_FIELDS.filter((f) => !shownKeys.includes(f.key));
  const hasOverrides = Object.keys(overrides).length > 0;
  const whatIfResult = hasOverrides ? predict({ ...baselineForm, ...overrides }) : baselineResult;

  const basePct = baselineResult.probability * 100;
  const whatIfPct = whatIfResult.probability * 100;
  const deltaPts = whatIfPct - basePct;
  const whatIfTier = riskTier(whatIfResult.probability);

  return (
    <div className="mt-4 rounded-2xl border border-prism-border bg-white p-5 shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 text-xs font-bold text-prism-text">
          <SlidersHorizontal className="h-3.5 w-3.5 text-prism-teal" />
          What-if explorer
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-prism-muted" /> : <ChevronDown className="h-4 w-4 text-prism-muted" />}
      </button>

      {open && (
        <>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-sm font-semibold text-prism-muted">{basePct.toFixed(1)}%</span>
            <span className="text-xs text-prism-muted-2">&rarr;</span>
            <span className="font-display text-2xl font-bold" style={{ color: whatIfTier.colorVar }}>
              {whatIfPct.toFixed(1)}%
            </span>
            {hasOverrides && (
              <span className={`text-xs font-semibold ${deltaPts > 0 ? "text-prism-red" : "text-prism-seafoam"}`}>
                {deltaPts >= 0 ? "+" : ""}
                {deltaPts.toFixed(1)} pts
              </span>
            )}
          </div>
          <p className="mt-1 text-[10.5px] leading-snug text-prism-muted-2">
            Adjust inputs to explore how the predicted risk would change. The baseline prediction stays untouched.
          </p>

          <div className="mt-4 space-y-3.5">
            {shownKeys.map((key) => {
              const field = FIELD_BY_KEY[key];
              const value = overrides[key] ?? Number(baselineForm[key]);
              return (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-prism-text">
                      {field.label} {field.unit ? <span className="text-prism-muted-2">({field.unit})</span> : null}
                    </span>
                    <span className={`font-semibold ${key in overrides ? "text-prism-teal" : "text-prism-muted"}`}>
                      {value}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={value}
                    onChange={(e) => setOverrides((o) => ({ ...o, [key]: Number(e.target.value) }))}
                    className="w-full accent-prism-teal"
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2">
            {remaining.length > 0 && (
              <select
                value=""
                onChange={(e) => e.target.value && setExtraKeys((k) => [...k, e.target.value])}
                className="rounded-lg border border-prism-border bg-white px-2.5 py-1.5 text-xs text-prism-muted outline-none focus:border-prism-teal"
              >
                <option value="">Add factor&hellip;</option>
                {remaining.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            )}
            {hasOverrides && (
              <button
                onClick={() => setOverrides({})}
                className="flex items-center gap-1.5 rounded-lg border border-prism-muted-2/40 px-3 py-1.5 text-xs font-semibold text-prism-muted transition-colors hover:bg-prism-card"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
