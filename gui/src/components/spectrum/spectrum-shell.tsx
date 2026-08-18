import { lazy, Suspense } from "react";
import { SectionIntro } from "../section-intro";
import { SpectrumContentSkeleton } from "../skeleton-fallbacks";
import { StatRow } from "./stat-row";

const DashboardContent = lazy(() =>
  import("./spectrum-view").then((m) => ({ default: m.DashboardContent })),
);

interface DashboardShellProps {
  onShowReport: (html: string) => void;
}

export function DashboardShell({ onShowReport }: DashboardShellProps) {
  return (
    <div>
      <SectionIntro
        title="Model Performance Overview"
        body="Benchmark performance and explainability metrics from PRISM's underlying model suite, evaluated on a validated 98-patient ICU cohort."
      />

      <div className="mt-5">
        <StatRow />
      </div>

      <Suspense fallback={<SpectrumContentSkeleton />}>
        <DashboardContent onShowReport={onShowReport} />
      </Suspense>

      <div className="mt-6 h-px w-full bg-prism-border" />
      <p className="mt-5 flex items-center gap-2 text-xs text-prism-muted-2">
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: "#0f3a3c" }}
        />
        Metrics above reflect a validated demonstration cohort and are intended
        to illustrate model behavior, not certify clinical-grade performance.
      </p>
    </div>
  );
}
