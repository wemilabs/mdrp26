import { Sparkles } from "lucide-react";
import { SectionIntro } from "../section-intro";
import { FormGroup } from "./form-group";
import { ResultPanel } from "./result-panel";
import { FIELD_GROUPS } from "../../data/fields";
import { EXAMPLE_PATIENTS } from "../../data/examples";
import type { PatientFormValues, PredictionResult } from "../../types";

interface CalculatorViewProps {
  form: PatientFormValues;
  result: PredictionResult | null;
  onChange: (key: string, value: string) => void;
  onCalculate: () => void;
  onExample: (key: string) => void;
  onShowReport: (html: string) => void;
}

export function CalculatorView({ form, result, onChange, onCalculate, onExample, onShowReport }: CalculatorViewProps) {
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
            <Sparkles className="h-3.5 w-3.5" />
            {ex.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          {FIELD_GROUPS.map((g) => (
            <FormGroup key={g.title} group={g} form={form} onChange={onChange} />
          ))}
          <button
            onClick={onCalculate}
            className="mt-2 rounded-xl bg-prism-dark px-7 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-prism-dark-light"
          >
            Calculate Risk
          </button>
        </div>

        <div className="lg:sticky lg:top-5 lg:self-start">
          <ResultPanel result={result} form={form} onShowReport={onShowReport} />
        </div>
      </div>

      <p className="mt-7 max-w-3xl text-xs leading-relaxed text-prism-muted-2">
        This estimate is produced by a gradient-boosted model trained on first-24-hour ICU vital signs and
        laboratory values. For simplicity, each value entered here is treated as constant across that window;
        clinical deployments would typically draw on continuous monitoring trends instead. Contributing factors
        are computed using a lightweight approximation suited to real-time use. PRISM is intended for
        demonstration and research purposes and does not constitute clinical advice.
      </p>
    </div>
  );
}
