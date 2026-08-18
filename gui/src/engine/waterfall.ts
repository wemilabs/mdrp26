import type { PredictionResult } from "../types";
import { predict, sigmoid } from "./predict-engine";

export interface WaterfallStep {
  name: string;
  kind: "anchor" | "up" | "down";
  from: number;
  to: number;
}

const MEDIAN = predict({});
const MEDIAN_LOGIT = Math.log(MEDIAN.probability / (1 - MEDIAN.probability));
const MEDIAN_BY_NAME: Record<string, number> = Object.fromEntries(
  MEDIAN.ranked.map((r) => [r.name, r.value]),
);

export { MEDIAN, MEDIAN_BY_NAME, MEDIAN_LOGIT };

export function buildWaterfallSteps(
  result: PredictionResult,
  topN = 8,
): WaterfallStep[] {
  const byName: Record<string, number> = Object.fromEntries(
    result.ranked.map((r) => [r.name, r.value]),
  );
  const names = [
    ...new Set([...result.ranked, ...MEDIAN.ranked].map((r) => r.name)),
  ];
  const relative = names
    .map((name) => ({
      name,
      value: (byName[name] ?? 0) - (MEDIAN_BY_NAME[name] ?? 0),
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const top = relative.slice(0, topN);
  const rest = relative.slice(topN).reduce((sum, r) => sum + r.value, 0);
  const factors =
    rest !== 0 ? [...top, { name: "Other factors", value: rest }] : top;

  const steps: WaterfallStep[] = [
    {
      name: "Typical patient",
      kind: "anchor",
      from: 0,
      to: MEDIAN.probability,
    },
  ];

  let cumLogit = MEDIAN_LOGIT;
  factors.forEach((f) => {
    const from = sigmoid(cumLogit);
    cumLogit += f.value;
    const to = sigmoid(cumLogit);
    steps.push({ name: f.name, kind: f.value > 0 ? "up" : "down", from, to });
  });

  steps.push({
    name: "Predicted risk",
    kind: "anchor",
    from: 0,
    to: sigmoid(cumLogit),
  });
  return steps;
}
