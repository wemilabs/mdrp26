import { ArrowRight } from "lucide-react";
import { useState } from "react";
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useSearchParams,
} from "react-router";
import { BatchShell } from "./components/batch/batch-shell";
import { ErrorBoundary } from "./components/error-boundary";
import { CalculatorShell } from "./components/refract/refract-shell";
import { ReportModal } from "./components/report-modal";
import { DashboardShell } from "./components/spectrum/spectrum-shell";
import { TopBar } from "./components/top-bar";
import { EXAMPLE_PATIENTS } from "./data/examples";
import { paramsToForm } from "./engine/share";
import type { PatientFormValues } from "./types";

export default function App() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<PatientFormValues>(
    () => paramsToForm(searchParams) ?? EXAMPLE_PATIENTS.lowRisk.values,
  );
  const [reportHtml, setReportHtml] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string>("");

  const handleExample = (key: string) => {
    setForm(EXAMPLE_PATIENTS[key].values);
    setPatientId("");
  };

  const handleChange = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleLoadForm = (values: PatientFormValues, id?: string) => {
    setForm(values);
    setPatientId(id ?? "");
  };

  return (
    <>
      <Routes>
        <Route index element={<Landing />} />
        <Route element={<Shell />}>
          <Route
            path="refract"
            element={
              <CalculatorShell
                form={form}
                patientId={patientId}
                onChange={handleChange}
                onExample={handleExample}
                onShowReport={setReportHtml}
                onLoadForm={handleLoadForm}
                onPatientIdChange={setPatientId}
              />
            }
          />
          <Route
            path="spectrum"
            element={<DashboardShell onShowReport={setReportHtml} />}
          />
          <Route path="batch" element={<BatchShell />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {reportHtml && (
        <ReportModal html={reportHtml} onClose={() => setReportHtml(null)} />
      )}
    </>
  );
}

function Landing() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-white">
      <img
        src="/healthcare-hero.webp"
        alt="Sketch of a diverse team of clinicians in profile"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-r from-white/80 via-white/30 to-transparent" />

      <div className="relative z-10 flex h-full max-w-6xl flex-col justify-center px-8 md:px-16">
        <div className="max-w-xl animate-hero-fade">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-prism-teal">
            Prognostic Risk Identification via SHAP-based Modeling
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-prism-dark md:text-5xl">
            PRISM
          </h1>
          <p className="mt-4 text-base leading-relaxed text-prism-text md:text-lg">
            See patient risk clearly, before it becomes critical. Transparent
            ICU mortality risk estimates from first-24-hour vital signs and
            laboratory values.
          </p>
          <Link
            to="/refract"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-prism-dark px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-prism-dark-light"
          >
            Open the Risk Assessment
            <ArrowRight className="size-4" />
          </Link>
          <div className="mt-4 flex gap-5 text-sm font-medium text-prism-muted">
            <Link
              to="/spectrum"
              className="underline-offset-4 transition-colors hover:text-prism-teal hover:underline"
            >
              Model performance
            </Link>
            <Link
              to="/batch"
              className="underline-offset-4 transition-colors hover:text-prism-teal hover:underline"
            >
              Batch scoring
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Shell() {
  return (
    <div className="min-h-screen bg-prism-bg text-prism-text">
      <TopBar />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
