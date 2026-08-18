import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
  Target,
} from "lucide-react";
import { useState } from "react";
import { FIELD_GROUPS } from "../../data/fields";
import { riskTier } from "../../engine/advice-engine";
import { LABEL_TO_FIELD, predict } from "../../engine/predict-engine";
import type {
  FieldDefinition,
  PatientFormValues,
  PredictionResult,
} from "../../types";

interface WhatIfPanelProps {
  baselineForm: PatientFormValues;
  baselineResult: PredictionResult;
}

const ALL_FIELDS = FIELD_GROUPS.flatMap((g) => g.fields);
const MODIFIABLE_FIELDS = ALL_FIELDS.filter(
  (f) => f.modifiable && f.type === "number",
);
const FIELD_BY_KEY: Record<string, FieldDefinition> = Object.fromEntries(
  MODIFIABLE_FIELDS.map((f) => [f.key, f]),
);

function defaultKeys(result: PredictionResult): string[] {
  return result.ranked
    .slice(0, 6)
    .map((r) => LABEL_TO_FIELD[r.name])
    .filter((key): key is string => Boolean(key && FIELD_BY_KEY[key]));
}

interface Lever {
  key: string;
  label: string;
  unit?: string;
  targetValue: number;
  baselineValue: number;
  resultingRisk: number;
  deltaPts: number;
}

function biggestLevers(
  baselineForm: PatientFormValues,
  baselineRisk: number,
): Lever[] {
  return MODIFIABLE_FIELDS.flatMap((f) => {
    if (!f.normalRange) return [];
    const baselineValue = Number(baselineForm[f.key]);
    if (!Number.isFinite(baselineValue)) return [];
    const targetValue = (f.normalRange[0] + f.normalRange[1]) / 2;
    if (Math.abs(targetValue - baselineValue) < 1e-6) return [];
    const resultingRisk = predict({
      ...baselineForm,
      [f.key]: targetValue,
    }).probability;
    const deltaPts = (resultingRisk - baselineRisk) * 100;
    // Only show levers that actually reduce risk.
    if (deltaPts >= 0) return [];
    return [
      {
        key: f.key,
        label: f.label,
        unit: f.unit,
        targetValue,
        baselineValue,
        resultingRisk,
        deltaPts,
      },
    ];
  })
    .sort((a, b) => a.deltaPts - b.deltaPts)
    .slice(0, 3);
}

export function WhatIfPanel({
  baselineForm,
  baselineResult,
}: WhatIfPanelProps) {
  const [open, setOpen] = useState(true);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [extraKeys, setExtraKeys] = useState<string[]>([]);

  const shownKeys = [
    ...new Set([...defaultKeys(baselineResult), ...extraKeys]),
  ];
  const remaining = MODIFIABLE_FIELDS.filter((f) => !shownKeys.includes(f.key));
  const hasOverrides = Object.keys(overrides).length > 0;
  // React Compiler auto-memoizes — only re-runs when inputs change.
  const whatIfResult = hasOverrides
    ? predict({ ...baselineForm, ...overrides })
    : baselineResult;
  const levers = biggestLevers(baselineForm, baselineResult.probability);

  const basePct = baselineResult.probability * 100;
  const whatIfPct = whatIfResult.probability * 100;
  const deltaPts = whatIfPct - basePct;
  const whatIfTier = riskTier(whatIfResult.probability);

  const applyLever = (lever: Lever) => {
    setOverrides((o) => ({ ...o, [lever.key]: lever.targetValue }));
  };

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
        {open ? (
          <ChevronUp className="h-4 w-4 text-prism-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-prism-muted" />
        )}
      </button>

      {open && (
        <>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-sm font-semibold text-prism-muted">
              {basePct.toFixed(1)}%
            </span>
            <span className="text-xs text-prism-muted-2">&rarr;</span>
            <span
              className="font-display text-2xl font-bold"
              style={{ color: whatIfTier.colorVar }}
            >
              {whatIfPct.toFixed(1)}%
            </span>
            {hasOverrides && (
              <span
                className={`text-xs font-semibold ${deltaPts > 0 ? "text-prism-red" : "text-prism-seafoam"}`}
              >
                {deltaPts >= 0 ? "+" : ""}
                {deltaPts.toFixed(1)} pts
              </span>
            )}
          </div>
          <p className="mt-1 text-[10.5px] leading-snug text-prism-muted-2">
            Adjust inputs to explore how the predicted risk would change. The
            baseline prediction stays untouched.
          </p>

          {levers.length > 0 && (
            <div className="mt-3 rounded-lg border border-prism-seafoam/30 bg-prism-seafoam/5 px-3 py-2.5">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-prism-seafoam">
                <Target className="size-3" />
                Biggest opportunities to reduce risk
              </div>
              <div className="space-y-1">
                {levers.map((l) => (
                  <button
                    key={l.key}
                    onClick={() => applyLever(l)}
                    className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left text-[11px] transition-colors hover:bg-prism-seafoam/10"
                  >
                    <span className="min-w-0 flex-1 text-prism-text">
                      <strong className="font-semibold">{l.label}</strong>{" "}
                      <span className="text-prism-muted-2">
                        {l.baselineValue}
                        {l.unit ? ` ${l.unit}` : ""} &rarr; {l.targetValue}
                        {l.unit ? ` ${l.unit}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold text-prism-seafoam">
                      {l.deltaPts.toFixed(1)} pts
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 space-y-3.5">
            {shownKeys.map((key) => {
              const field = FIELD_BY_KEY[key];
              const value = overrides[key] ?? Number(baselineForm[key]);
              return (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-prism-text">
                      {field.label}{" "}
                      {field.unit ? (
                        <span className="text-prism-muted-2">
                          ({field.unit})
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={`font-semibold ${key in overrides ? "text-prism-teal" : "text-prism-muted"}`}
                    >
                      {value}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={value}
                    onChange={(e) =>
                      setOverrides((o) => ({
                        ...o,
                        [key]: Number(e.target.value),
                      }))
                    }
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
                onChange={(e) =>
                  e.target.value && setExtraKeys((k) => [...k, e.target.value])
                }
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
                <RotateCcw className="size-3" />
                Reset
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
