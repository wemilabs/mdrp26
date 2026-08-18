export const cvAuroc = [
  { name: "Logistic\nRegression", value: 0.52, sd: 0.26 },
  { name: "Random\nForest", value: 0.673, sd: 0.153 },
  { name: "XGBoost", value: 0.63, sd: 0.21 },
];

export const holdoutAuroc = [
  { name: "Logistic\nRegression", value: 0.606 },
  { name: "Random\nForest", value: 0.818 },
  { name: "XGBoost", value: 0.803 },
];

export const thresholdData = [
  { name: "Logistic\nRegression", Default: 0.0, Optimal: 0.667 },
  { name: "Random\nForest", Default: 0.0, Optimal: 1.0 },
  { name: "XGBoost", Default: 0.0, Optimal: 1.0 },
];

export const shapTop = [
  { name: "age", value: 1.387 },
  { name: "n_comorbidities", value: 0.561 },
  { name: "wbc_mean", value: 0.403 },
  { name: "platelets_max", value: 0.369 },
  { name: "los", value: 0.352 },
];

export const overlapData = [
  { pair: "SHAP \u2194 Random Forest", frac: "3 / 5" },
  { pair: "SHAP \u2194 Logistic Regression", frac: "2 / 5" },
  { pair: "Random Forest \u2194 Logistic Regression", frac: "2 / 5" },
];

export const bivariate = [
  { label: "Comorbidity count", p: "p = 0.002" },
  { label: "Creatinine", p: "p = 0.049" },
  { label: "BUN", p: "p = 0.012" },
];

// Uncertainty calibration metadata. These values are populated by running
// Python script 09_uncertainty_calibration.py, which exports
// uncertainty_calibration.json. Until then, the GUI runs in uncalibrated mode.
export const uncertaintyCalibration = {
  lambda: null as number | null,
  rSquared: null as number | null,
  coverage: null as number | null,
  nPatients: 98,
  nFolds: 5,
  nTrees: 200,
  method: "ijknife_cv_calibrated",
  calibrated: false,
};

// Distribution of 95% interval widths across the holdout cohort.
// Populated by script 09; empty until then.
export const uncertaintyDistribution: { bin: string; count: number }[] = [];
