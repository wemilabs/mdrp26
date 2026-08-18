import { lazy, Suspense } from "react";
import { SectionIntro } from "../section-intro";
import { BatchContentSkeleton } from "../skeleton-fallbacks";

const BatchContent = lazy(() =>
  import("./batch-view").then((m) => ({ default: m.BatchContent })),
);

export function BatchShell() {
  return (
    <div>
      <SectionIntro
        title="Batch Risk Scoring"
        body="Score multiple patients at once from a CSV file. Each row is run through the same model as the calculator, entirely in your browser. No data leaves this device."
      />

      <Suspense fallback={<BatchContentSkeleton />}>
        <BatchContent />
      </Suspense>

      <p className="mt-7 max-w-3xl text-xs leading-relaxed text-prism-muted-2">
        Educational output only, not clinical advice. PRISM is a research and
        demonstration tool and is not validated for clinical use or real patient
        decision-making.
      </p>
    </div>
  );
}
