import { useState } from "react";
import { CalculatorView } from "./components/refract/refract-view";
import { ReportModal } from "./components/report-modal";
import { DashboardView } from "./components/spectrum/spectrum-view";
import { TopBar, type TabKey } from "./components/top-bar";
import { EXAMPLE_PATIENTS } from "./data/examples";
import { predict } from "./engine/predict-engine";
import type { PatientFormValues, PredictionResult } from "./types";

export default function App() {
  const [tab, setTab] = useState<TabKey>("calculator");
  const [form, setForm] = useState<PatientFormValues>(
    EXAMPLE_PATIENTS.lowRisk.values,
  );
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [reportHtml, setReportHtml] = useState<string | null>(null);

  const handleExample = (key: string) => {
    setForm(EXAMPLE_PATIENTS[key].values);
    setResult(null);
  };

  const handleChange = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setResult(null);
  };

  const handleCalculate = () => {
    setResult(predict(form));
  };

  return (
    <div className="min-h-screen bg-prism-bg text-prism-text">
      <TopBar tab={tab} onTabChange={setTab} />

      <main className="mx-auto max-w-6xl px-6 py-8">
        {tab === "calculator" ? (
          <CalculatorView
            form={form}
            result={result}
            onChange={handleChange}
            onCalculate={handleCalculate}
            onExample={handleExample}
            onShowReport={setReportHtml}
          />
        ) : (
          <DashboardView onShowReport={setReportHtml} />
        )}
      </main>

      {reportHtml && (
        <ReportModal html={reportHtml} onClose={() => setReportHtml(null)} />
      )}
    </div>
  );
}
