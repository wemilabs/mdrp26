import { describe, expect, it } from "vitest";
import { EXAMPLE_PATIENTS } from "../data/examples";
import type { PredictionResult } from "../types";
import { predict } from "./predict-engine";
import {
  METHODOLOGY_TEXT,
  UNCALIBRATED_TEXT,
  uncertaintyInterval,
  uncertaintyTier,
} from "./uncertainty";

function makeResult(
  overrides: Partial<PredictionResult> = {},
): PredictionResult {
  return {
    probability: 0.5,
    ranked: [],
    treeLogits: Array.from({ length: 200 }, (_, i) => 0.01 * i - 1),
    marginVariance: 1.0,
    ...overrides,
  };
}

describe("uncertaintyTier", () => {
  it("classifies narrow for width < 0.05", () => {
    expect(uncertaintyTier(0.03)).toBe("narrow");
    expect(uncertaintyTier(0.049)).toBe("narrow");
  });

  it("classifies medium for 0.05 <= width < 0.15", () => {
    expect(uncertaintyTier(0.05)).toBe("medium");
    expect(uncertaintyTier(0.14)).toBe("medium");
  });

  it("classifies wide for width >= 0.15", () => {
    expect(uncertaintyTier(0.15)).toBe("wide");
    expect(uncertaintyTier(0.5)).toBe("wide");
  });
});

describe("uncertaintyInterval", () => {
  it("returns a point interval when marginVariance is 0", () => {
    const result = makeResult({ marginVariance: 0, probability: 0.42 });
    const interval = uncertaintyInterval(result);
    expect(interval.low).toBeCloseTo(0.42, 10);
    expect(interval.high).toBeCloseTo(0.42, 10);
    expect(interval.width).toBe(0);
    expect(interval.tier).toBe("narrow");
  });

  it("produces an interval that contains the point prediction", () => {
    const result = makeResult({ probability: 0.5, marginVariance: 2.0 });
    const interval = uncertaintyInterval(result);
    expect(interval.low).toBeLessThanOrEqual(0.5);
    expect(interval.high).toBeGreaterThanOrEqual(0.5);
    expect(interval.width).toBeGreaterThan(0);
  });

  it("is deterministic across calls (seeded PRNG)", () => {
    const result = makeResult({ probability: 0.5, marginVariance: 2.0 });
    const a = uncertaintyInterval(result);
    const b = uncertaintyInterval(result);
    expect(a.low).toBe(b.low);
    expect(a.high).toBe(b.high);
  });

  it("produces a wider interval with larger marginVariance", () => {
    const narrow = uncertaintyInterval(makeResult({ marginVariance: 0.1 }));
    const wide = uncertaintyInterval(makeResult({ marginVariance: 5.0 }));
    expect(wide.width).toBeGreaterThan(narrow.width);
  });

  it("respects probability bounds [0, 1]", () => {
    const result = makeResult({ probability: 0.99, marginVariance: 10.0 });
    const interval = uncertaintyInterval(result);
    expect(interval.low).toBeGreaterThanOrEqual(0);
    expect(interval.high).toBeLessThanOrEqual(1);
  });

  it("reports calibrated=false when model has no uncertainty_lambda", () => {
    const result = makeResult();
    const interval = uncertaintyInterval(result);
    expect(interval.calibrated).toBe(false);
    expect(interval.method).toBe("ijknife_uncalibrated");
  });

  it("reports the 95% confidence level", () => {
    const interval = uncertaintyInterval(makeResult());
    expect(interval.level).toBeCloseTo(0.95, 10);
  });
});

describe("uncertaintyInterval with real model predictions", () => {
  it("produces a valid interval for the lowRisk example", () => {
    const result = predict(EXAMPLE_PATIENTS.lowRisk.values);
    const interval = uncertaintyInterval(
      result,
      EXAMPLE_PATIENTS.lowRisk.values,
    );
    expect(interval.low).toBeLessThanOrEqual(result.probability);
    expect(interval.high).toBeGreaterThanOrEqual(result.probability);
    expect(interval.low).toBeGreaterThanOrEqual(0);
    expect(interval.high).toBeLessThanOrEqual(1);
    expect(interval.width).toBeGreaterThan(0);
  });

  it("produces a valid interval for the highRisk example", () => {
    const result = predict(EXAMPLE_PATIENTS.highRisk.values);
    const interval = uncertaintyInterval(
      result,
      EXAMPLE_PATIENTS.highRisk.values,
    );
    expect(interval.low).toBeLessThanOrEqual(result.probability);
    expect(interval.high).toBeGreaterThanOrEqual(result.probability);
    expect(interval.low).toBeGreaterThanOrEqual(0);
    expect(interval.high).toBeLessThanOrEqual(1);
  });

  it("highRisk patient has non-trivial tree logits (variance > 0)", () => {
    const result = predict(EXAMPLE_PATIENTS.highRisk.values);
    expect(result.treeLogits.length).toBe(200);
    expect(result.marginVariance).toBeGreaterThan(0);
  });
});

describe("methodology text", () => {
  it("METHODOLOGY_TEXT mentions calibrated and 200 trees", () => {
    expect(METHODOLOGY_TEXT).toContain("200");
    expect(METHODOLOGY_TEXT).toContain("calibrated");
    expect(METHODOLOGY_TEXT).toContain("confidence interval");
  });

  it("UNCALIBRATED_TEXT mentions uncalibrated and NOT a calibrated", () => {
    expect(UNCALIBRATED_TEXT.toLowerCase()).toContain("uncalibrated");
    expect(UNCALIBRATED_TEXT).toContain("NOT");
  });
});
