import { AlertTriangle, Link2, Sparkles } from "lucide-react";
import { useState } from "react";
import { EXAMPLE_PATIENTS } from "../../data/examples";
import { FIELD_GROUPS } from "../../data/fields";
import { riskTier } from "../../engine/advice-engine";
import {
  deleteAssessment,
  loadHistory,
  saveAssessment,
} from "../../engine/history-store";
import { copyText, formToParams } from "../../engine/share";
import { formIssues } from "../../engine/validation";
import type {
  PatientFormValues,
  PredictionResult,
  SavedAssessment,
} from "../../types";
import { SectionIntro } from "../section-intro";
import { FormGroup } from "./form-group";
import { HistoryPanel } from "./history-panel";
import { ResultPanel } from "./result-panel";
import { WhatIfPanel } from "./what-if-panel";

interface CalculatorViewProps {
  form: PatientFormValues;
  result: PredictionResult | null;
  patientId: string;
  onChange: (key: string, value: string) => void;
  onCalculate: () => void;
  onExample: (key: string) => void;
  onShowReport: (html: string) => void;
  onLoadForm: (form: PatientFormValues, patientId?: string) => void;
  onPatientIdChange: (value: string) => void;
}

export function CalculatorView({
  form,
  result,
  patientId,
  onChange,
  onCalculate,
  onExample,
  onShowReport,
  onLoadForm,
  onPatientIdChange,
}: CalculatorViewProps) {
  const [history, setHistory] = useState<SavedAssessment[]>(loadHistory);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const url = `${location.origin}/refract?${formToParams(form)}`;
    const ok = await copyText(url);
    if (!ok) {
      window.prompt("Copy this link manually:", url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (label: string) => {
    if (!result) return;
    setHistory(
      saveAssessment({
        id: crypto.randomUUID(),
        savedAt: Date.now(),
        label,
        patientId: patientId || undefined,
        form: { ...form },
        probability: result.probability,
        ranked: result.ranked,
        tierLabel: riskTier(result.probability).label,
      }),
    );
  };

  return (
    <div>
      <SectionIntro
        title="Patient Risk Assessment"
        body="Enter a patient's vital signs and laboratory values to generate a real-time mortality risk estimate, with a transparent breakdown of the clinical factors driving the prediction."
      />

      <div className="mb-6 mt-5 flex flex-wrap gap-2.5">
        {Object.entries(EXAMPLE_PATIENTS).map(([key, ex]) => (
          <button
            key={key}
            onClick={() => onExample(key)}
            className="flex items-center gap-1.5 rounded-lg border border-prism-teal/40 bg-prism-card px-3.5 py-2 text-xs font-semibold text-prism-teal transition-colors hover:bg-prism-teal hover:text-white"
          >
            <Sparkles className="size-3.5" />
            {ex.label}
          </button>
        ))}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 rounded-lg border border-prism-muted-2/40 px-3.5 py-2 text-xs font-semibold text-prism-muted transition-colors hover:bg-prism-card"
        >
          <Link2 className="size-3.5" />
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-prism-muted">
          Patient / Case ID
        </label>
        <input
          type="text"
          value={patientId}
          onChange={(e) => onPatientIdChange(e.target.value)}
          placeholder="e.g. MRN-12345, Bed 12"
          className="w-full max-w-md rounded-lg border border-prism-border bg-white px-3 py-2 text-sm text-prism-text outline-none transition-shadow focus:border-prism-teal focus:ring-2 focus:ring-prism-teal/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          {FIELD_GROUPS.map((g) => (
            <FormGroup
              key={g.title}
              group={g}
              form={form}
              onChange={onChange}
            />
          ))}
          {formIssues(form).length > 0 && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-prism-amber/40 bg-prism-amber/10 px-4 py-3 text-xs leading-snug text-prism-text">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-prism-amber" />
              <span>
                Some values look physiologically implausible:{" "}
                <strong>
                  {formIssues(form)
                    .map((i) => i.label)
                    .join(", ")}
                </strong>
                . The prediction will still run, but please double-check these
                entries.
              </span>
            </div>
          )}
          <button
            onClick={onCalculate}
            className="mt-2 rounded-xl bg-prism-dark px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-prism-dark-light"
          >
            Calculate Risk
          </button>
          <HistoryPanel
            history={history}
            onLoad={(entry) => onLoadForm(entry.form, entry.patientId)}
            onDelete={(id) => setHistory(deleteAssessment(id))}
          />
        </div>

        <div className="lg:sticky lg:top-5 lg:self-start">
          <ResultPanel
            result={result}
            form={form}
            patientId={patientId}
            onShowReport={onShowReport}
            onSave={handleSave}
          />
          {result && (
            <WhatIfPanel baselineForm={form} baselineResult={result} />
          )}
        </div>
      </div>

      <p className="mt-7 max-w-3xl text-xs leading-relaxed text-prism-muted-2">
        This estimate is produced by a gradient-boosted model trained on
        first-24-hour ICU vital signs and laboratory values. For simplicity,
        each value entered here is treated as constant across that window;
        clinical deployments would typically draw on continuous monitoring
        trends instead. Contributing factors are computed using a lightweight
        approximation suited to real-time use. PRISM is intended for
        demonstration and research purposes and does not constitute clinical
        advice.
      </p>
    </div>
  );
}
