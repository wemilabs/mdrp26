import type {
  PatientFormValues,
  PredictionResult,
  UncertaintyInterval,
  UncertaintyTier,
} from "../types";
import { BASE_LOGIT, MODEL, sigmoid } from "./predict-engine";

const MC_SAMPLES = 400;
const CONFIDENCE_LEVEL = 0.95;
const Z = 1.959963984540054; // 2.5th percentile of standard normal for 95% two-sided

// Tier thresholds on interval width (in probability points).
const NARROW_MAX = 0.05;
const MEDIUM_MAX = 0.15;

export const METHODOLOGY_TEXT =
  "95% uncertainty interval derived from the variance across the model's 200 " +
  "boosted trees (infinitesimal-jackknife form), calibrated against 5-fold " +
  "cross-validation retraining variance. This is a confidence interval on the " +
  "predicted probability (model uncertainty about the estimate), not a " +
  "prediction interval on the binary outcome. The cohort is small (n=98, " +
  "10 deaths), so the calibration scalar is itself uncertain.";

export const UNCALIBRATED_TEXT =
  "Uncalibrated dispersion estimate from the variance across the model's 200 " +
  "boosted trees (infinitesimal-jackknife form). No calibration scalar is " +
  "available, so this is NOT a calibrated confidence interval. It reflects " +
  "relative model uncertainty only.";

// Seeded PRNG (mulberry32) for deterministic Monte Carlo output.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller transform for standard normal samples from a uniform PRNG.
function normalSampler(rng: () => number): () => number {
  let spare: number | null = null;
  return () => {
    if (spare !== null) {
      const v = spare;
      spare = null;
      return v;
    }
    let u = 0;
    let v = 0;
    let s = 0;
    do {
      u = rng() * 2 - 1;
      v = rng() * 2 - 1;
      s = u * u + v * v;
    } while (s === 0 || s >= 1);
    const mul = Math.sqrt((-2 * Math.log(s)) / s);
    spare = v * mul;
    return u * mul;
  };
}

export function uncertaintyTier(width: number): UncertaintyTier {
  if (width < NARROW_MAX) return "narrow";
  if (width < MEDIUM_MAX) return "medium";
  return "wide";
}

/**
 * Computes a 95% uncertainty interval around the predicted probability using
 * Monte Carlo sampling on the log-odds margin. The margin variance is the raw
 * tree-dispersion (sigma2_raw from predict-engine); the calibration scalar
 * lambda (from model.json, set by Python script 09) scales it to match observed
 * CV retraining variance. Falls back to an uncalibrated estimate if lambda is
 * absent.
 */
export function uncertaintyInterval(
  result: PredictionResult,
  _form?: PatientFormValues,
): UncertaintyInterval {
  const lambda = MODEL.uncertainty_lambda ?? 1;
  const calibrated = MODEL.uncertainty_lambda !== undefined;
  const method = MODEL.uncertainty_method ?? "ijknife_uncalibrated";

  const margin = result.treeLogits.reduce((s, v) => s + v, 0) + BASE_LOGIT;
  const variance = lambda * lambda * result.marginVariance;
  const sd = Math.sqrt(variance);

  // If there's no variance (e.g. lambda=0 or degenerate), return a point interval.
  if (sd < 1e-12) {
    return {
      low: result.probability,
      high: result.probability,
      level: CONFIDENCE_LEVEL,
      width: 0,
      tier: "narrow",
      method,
      calibrated,
    };
  }

  const rng = mulberry32(42);
  const normal = normalSampler(rng);
  const samples = new Float64Array(MC_SAMPLES);
  for (let i = 0; i < MC_SAMPLES; i++) {
    samples[i] = sigmoid(margin + normal() * sd);
  }
  samples.sort();

  const lowIdx = Math.floor(0.025 * MC_SAMPLES);
  const highIdx = Math.ceil(0.975 * MC_SAMPLES) - 1;
  const low = samples[lowIdx];
  const high = samples[Math.min(highIdx, MC_SAMPLES - 1)];
  const width = high - low;
  return {
    low,
    high,
    level: CONFIDENCE_LEVEL,
    width,
    tier: uncertaintyTier(width),
    method,
    calibrated,
  };
}

export { Z };
