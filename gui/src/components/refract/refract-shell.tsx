import { Link2, RotateCcw, Sparkles } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { EXAMPLE_PATIENTS } from "../../data/examples";
import { copyText, formToParams } from "../../engine/share";
import type { PatientFormValues } from "../../types";
import { SectionIntro } from "../section-intro";
import { RefractContentSkeleton } from "../skeleton-fallbacks";

const CalculatorContent = lazy(() =>
  import("./refract-view").then((m) => ({ default: m.CalculatorContent })),
);

interface CalculatorShellProps {
  form: PatientFormValues;
  patientId: string;
  onChange: (key: string, value: string) => void;
  onExample: (key: string) => void;
  onShowReport: (html: string) => void;
  onLoadForm: (form: PatientFormValues, patientId?: string) => void;
  onPatientIdChange: (value: string) => void;
}

export function CalculatorShell({
  form,
  patientId,
  onChange,
  onExample,
  onShowReport,
  onLoadForm,
  onPatientIdChange,
}: CalculatorShellProps) {
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

  const handleReset = () => onExample("lowRisk");

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
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg border border-prism-muted-2/40 px-3.5 py-2 text-xs font-semibold text-prism-muted transition-colors hover:bg-prism-card"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>

      <div className="mb-4">
        <label
          htmlFor="patient-id"
          className="mb-1 block text-xs font-medium text-prism-muted"
        >
          Patient / Case ID
        </label>
        <input
          id="patient-id"
          type="text"
          value={patientId}
          onChange={(e) => onPatientIdChange(e.target.value)}
          placeholder="e.g. MRN-12345, Bed 12"
          className="w-full max-w-md rounded-lg border border-prism-border bg-white px-3 py-2 text-sm text-prism-text outline-none transition-shadow focus:border-prism-teal focus:ring-2 focus:ring-prism-teal/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Suspense fallback={<RefractContentSkeleton />}>
          <CalculatorContent
            form={form}
            patientId={patientId}
            onChange={onChange}
            onShowReport={onShowReport}
            onLoadForm={onLoadForm}
          />
        </Suspense>
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
