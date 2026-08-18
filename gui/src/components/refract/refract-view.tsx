import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { FIELD_GROUPS } from "../../data/fields";
import { riskTier } from "../../engine/advice-engine";
import {
  deleteAssessment,
  loadHistory,
  saveAssessment,
} from "../../engine/history-store";
import { predict } from "../../engine/predict-engine";
import { formIssues } from "../../engine/validation";
import type { PatientFormValues, SavedAssessment } from "../../types";
import { FormGroup } from "./form-group";
import { HistoryPanel } from "./history-panel";
import { ResultPanel } from "./result-panel";
import { WhatIfPanel } from "./what-if-panel";

interface CalculatorContentProps {
  form: PatientFormValues;
  patientId: string;
  onChange: (key: string, value: string) => void;
  onShowReport: (html: string) => void;
  onLoadForm: (form: PatientFormValues, patientId?: string) => void;
}

export function CalculatorContent({
  form,
  patientId,
  onChange,
  onShowReport,
  onLoadForm,
}: CalculatorContentProps) {
  const [history, setHistory] = useState<SavedAssessment[]>(loadHistory);

  // React Compiler auto-memoizes — only re-runs when `form` changes.
  const result = predict(form);
  const issues = formIssues(form);

  const handleSave = (label: string) => {
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
    <>
      <div>
        {FIELD_GROUPS.map((g) => (
          <FormGroup key={g.title} group={g} form={form} onChange={onChange} />
        ))}
        {issues.length > 0 && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-prism-amber/40 bg-prism-amber/10 px-4 py-3 text-xs leading-snug text-prism-text">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-prism-amber" />
            <span>
              Some values look physiologically implausible:{" "}
              <strong>{issues.map((i) => i.label).join(", ")}</strong>. The
              prediction will still run, but please double-check these entries.
            </span>
          </div>
        )}
        <HistoryPanel
          history={history}
          onLoad={(entry) => onLoadForm(entry.form, entry.patientId)}
          onDelete={(id) => setHistory(deleteAssessment(id))}
          onReplaceHistory={setHistory}
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
        <WhatIfPanel baselineForm={form} baselineResult={result} />
      </div>
    </>
  );
}
