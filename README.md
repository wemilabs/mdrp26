# MDRT26 — Explainable ICU Mortality Prediction

End-to-end research project for predicting **in-hospital ICU mortality** from the
**first 24 hours** of vital signs and laboratory values, built on the
**MIMIC-IV Clinical Database Demo (v2.2)**.

The repository has two halves:

| Folder | What it is |
| --- | --- |
| [`analysis-and-model-training/`](analysis-and-model-training/) | Python pipeline: cohort construction → feature extraction → descriptive statistics → model training/evaluation (LR / RF / XGBoost) → explainability (SHAP & cross-method overlap) → publication figures |
| [`gui/`](gui/) | **PRISM** — a client-only React + TypeScript app that re-implements the trained XGBoost model in the browser for real-time, factor-level explained risk predictions, with what-if analysis, waterfall explanations, input validation, assessment history, batch CSV scoring, and a model-performance dashboard |

Both halves share the same study design: the GUI's `model.json` is exported from the
Python training pipeline, and its predictions were verified to match the original
model to floating-point precision.

---

## Study design at a glance

- **Data source:** MIMIC-IV Clinical Database Demo v2.2 (`hosp/` + `icu/` CSV tables)
- **Cohort:** adult (≥ 18 y) ICU patients, first qualifying ICU stay per patient,
  ICU length-of-stay ≥ 0.25 days (6 h) → **98 ICU stays** (100 → 98 after attrition)
- **Outcome:** `hospital_expire_flag` (binary in-hospital mortality; 10.2% prevalence)
- **Features:** 6 vital signs + 10 laboratory values, each aggregated to
  mean / min / max over the first 24 h of the ICU stay, plus age, LOS,
  comorbidity count, gender, and admission type → 57 numeric + 8 one-hot
  categorical features (**59–65 model inputs** depending on encoding count)
- **Models:** Logistic Regression, Random Forest, XGBoost — all class-balanced,
  evaluated with 5-fold stratified cross-validation **and** a stratified 75/25 holdout
- **Reproducibility:** `random_state=42` everywhere

### Headline results

| Metric | Logistic Regression | Random Forest | XGBoost |
| --- | --- | --- | --- |
| CV AUROC (mean ± SD) | 0.52 ± 0.26 | 0.673 ± 0.153 | 0.63 ± 0.21 |
| Holdout AUROC | 0.606 | **0.818** | 0.803 |
| Sensitivity @ default 0.5 → @ optimal (Youden's J) | 0.0 → 0.667 | 0.0 → 1.0 | 0.0 → 1.0 |

Top-5 features by mean |SHAP| (XGBoost): **age** (1.387), **n_comorbidities** (0.561),
**wbc_mean** (0.403), **platelets_max** (0.369), **los** (0.352).
Cross-method top-5 overlap: SHAP↔RF 3/5, SHAP↔LR 2/5, RF↔LR 2/5.
Significant bivariate associations: comorbidity count (p = 0.002), BUN (p = 0.012),
creatinine (p = 0.049).

---

## 1. `analysis-and-model-training/` — Python analysis pipeline

Eight scripts, **run in numeric order**. Scripts 01–02 require the raw MIMIC-IV
Clinical Database Demo (v2.2) folder structure (`hosp/`, `icu/` subfolders);
scripts 03–08 run against the cleaned cohort CSV and the pickled artifacts each
script saves for the next.

### Pipeline scripts

| Script | Thesis section | Purpose |
| --- | --- | --- |
| `01_cohort_attrition.py` | 4.6.1 | Cohort eligibility funnel (100 patients → 98 final) |
| `02_feature_extraction.py` | 3.7, 4.6.1 | First-24 h vitals/labs extraction, full precision |
| `03_missingness_and_comparison.py` | 4.6.1, 4.6.2 | Missingness table + survivor vs. non-survivor stats |
| `04_descriptive_figures.py` | 4.6.2 | Boxplots and correlation heatmap (no embedded titles) |
| `05_model_training_evaluation.py` | 4.5, 4.7 | Trains LR / RF / XGBoost, 5-fold CV + holdout evaluation |
| `06_performance_figures.py` | 4.7 | ROC, PR, CV bar chart, calibration, confusion matrices |
| `07_explainability_analysis.py` | 4.8 | SHAP, RF importance, LR coefficients, cross-method overlap |
| `08_explainability_figures.py` | 4.8 | SHAP summary plot, explanation comparison chart |
| `09_uncertainty_calibration.py` | 4.8 | Calibrates tree-variance uncertainty (λ) vs. 5-fold CV retraining variance; patches `model.json` |

### Script details

**`01_cohort_attrition.py`** — Builds the eligibility funnel from raw demo tables
(`hosp/patients.csv`, `hosp/admissions.csv`, `icu/icustays.csv`,
`hosp/diagnoses_icd.csv`). Filters: (1) adults — age computed as
`anchor_age + (admit_year − anchor_year) ≥ 18`; (2) first qualifying ICU stay per
patient (sorted by `subject_id`, `intime`); (3) `los ≥ 0.25` days.
Output: `final_cohort_base.pkl`.

**`02_feature_extraction.py`** — Extracts first-24 h measurements and aggregates
mean / min / max per stay, reading large CSVs in 200 000-row chunks.

- Vitals from `icu/chartevents.csv` (ITEMID → name): 220045 heart_rate,
  220210 resp_rate, 220277 spo2, 220179 sbp, 220180 dbp, 223761 temp_f
- Labs from `hosp/labevents.csv`: 50912 creatinine, 50931 glucose, 50983 sodium,
  50971 potassium, 51301 wbc, 51222 hemoglobin, 50882 bicarbonate,
  51265 platelets, 50813 lactate, 51006 bun
- `n_comorbidities` = count of distinct ICD codes per admission
  (`hosp/diagnoses_icd.csv`)

Output: `features_full_precision.pkl` (the cleaned cohort CSV
`mimic_iv_icu_mortality_cleaned.csv` used by 03/04 is derived from this).

**`03_missingness_and_comparison.py`** — Per-feature missingness counts/percentages;
survivors vs. non-survivors compared with **Mann–Whitney U** (continuous: age, LOS,
comorbidities, heart_rate/resp_rate/spo2/sbp means, creatinine, WBC, lactate_max,
BUN, platelets) and **chi-square** (gender, admission_type).
Output: `descriptive_table_continuous.csv` + console tables.

**`04_descriptive_figures.py`** — Publication figures without embedded titles
(150 DPI, whitegrid style): 4-panel boxplots (age, comorbidities, creatinine, BUN
by outcome; Survived `#4C72B0` / Died `#C44E52`) and an annotated Pearson
correlation heatmap (coolwarm, centered at 0).
Outputs: `fig_boxplots_notitle.png`, `fig_heatmap_notitle.png`.

**`05_model_training_evaluation.py`** — Core modeling script.

- Preprocessing (`ColumnTransformer`): median imputation + `StandardScaler`
  (numeric); most-frequent imputation + `OneHotEncoder(handle_unknown='ignore')`
  (categorical)
- Models (all `random_state=42`, class-balanced):
  - **Logistic Regression:** `max_iter=2000`, `C=1.0`, `class_weight='balanced'`
  - **Random Forest:** `n_estimators=300`, `max_depth=4`, `min_samples_leaf=3`,
    `class_weight='balanced'`
  - **XGBoost:** `n_estimators=200`, `max_depth=3`, `learning_rate=0.05`,
    `subsample=0.8`, `colsample_bytree=0.8`, `eval_metric='logloss'`,
    `scale_pos_weight = n_neg / n_pos`
- Evaluation: 5-fold `StratifiedKFold` (shuffle, seed 42) scoring AUROC / AUPRC /
  F1 / Brier; stratified 75/25 holdout with metrics at the 0.5 threshold **and** at
  the Youden's J optimal threshold (incl. confusion matrices)
- Outputs: `cv_results.json`, `holdout_results.json`, `roc_data.json`,
  `pr_data.json`, `fitted_pipes.pkl` (pipelines + train/test splits + column lists)

**`06_performance_figures.py`** — Five figures (150 DPI, into `figs/`):
`fig1_roc_curves.png`, `fig2_pr_curves.png` (with prevalence baseline),
`fig3_cv_auroc.png` (mean ± SD bars, chance line at 0.5), `fig4_calibration.png`
(5 quantile bins), `fig5_confusion_matrices.png` (optimal-threshold matrices).
Model colors: LR `#4C72B0`, RF `#55A868`, XGB `#C44E52`.

**`07_explainability_analysis.py`** — Three explanation methods over the same
transformed test set: **SHAP** `TreeExplainer` on XGBoost (mean |SHAP| ranking),
Random Forest `feature_importances_`, and absolute LR coefficients; then pairwise
top-5 overlap analysis.
Outputs: `shap_importance.csv`, `shap_values.npy`, `X_test_trans.npy`,
`feature_names.json`, `rf_importance.csv`, `lr_coefficients.csv`,
`overlap_results.json`.

**`08_explainability_figures.py`** — `fig6_shap_summary.png` (beeswarm,
top 12 features) and `fig7_explanation_comparison.png` (top-8 SHAP vs. top-8 RF
side-by-side horizontal bars), 150 DPI, no embedded titles.

**`09_uncertainty_calibration.py`** — Calibrates the GUI's tree-variance
uncertainty estimate. The 200 XGBoost trees each emit a leaf log-odds; their
spread `σ²_raw = Σ_t (w_t − w̄)²` is a raw dispersion measure (infinitesimal
jackknife form). This script fits a scalar `λ` so that `λ²·σ²_raw` matches the
observed 5-fold CV retraining variance of `p̂` (the ground-truth proxy for
epistemic uncertainty), via OLS through the origin on the √-scale. Also computes
empirical coverage and per-patient 95% Monte Carlo intervals.
Output: `uncertainty_calibration.json` + patches `gui/src/data/model.json` with
`uncertainty_lambda` and `uncertainty_method`.

### Python dependencies

No `requirements.txt` is pinned yet; the scripts import:

```text
pandas numpy scikit-learn xgboost shap scipy matplotlib seaborn
```

(plus stdlib `json`, `pickle`, `os`). Recommended quick setup:

```bash
pip install pandas numpy scikit-learn xgboost shap scipy matplotlib seaborn
```

### Data requirements & known caveats

- Expected raw layout:

  ```text
  mimic-iv-clinical-database-demo-2.2/
    hosp/  patients.csv admissions.csv diagnoses_icd.csv labevents.csv
    icu/   icustays.csv chartevents.csv
  ```

- Paths are currently **hardcoded** (e.g. `/home/claude/ch46/...`); set them to
  your local dataset location before running. Scripts 03 and 04 look for the
  cleaned CSV at different locations (`./mimic_iv_icu_mortality_cleaned.csv` and
  `/mnt/user-data/outputs/...` respectively) — align these when reproducing.
- The demo cohort (**n = 98**, 10 deaths) is intentionally small — results are
  illustrative of the methodology, not clinically validated performance.

---

## 2. `gui/` — PRISM web application

**PRISM (Explainable ICU Mortality Risk Assessment)** is a **client-only**
React + TypeScript app: no backend, no database, no network requests. The trained
XGBoost model is exported to JSON and evaluated in pure TypeScript in the browser,
with a real-time, factor-level explanation of every prediction.

### Quick start

```bash
cd gui
pnpm install     # or npm install
pnpm dev         # local dev server
pnpm build       # production build → dist/
pnpm preview     # preview the production build
pnpm lint        # oxlint
pnpm test        # vitest (unit tests)
```

### Tech stack

- **React 19** + **TypeScript 7** + **Vite 8** (`@vitejs/plugin-react`)
- **Tailwind CSS 4** via `@tailwindcss/vite` — CSS-first config, custom `@theme`
  token set in `src/index.css` (no `tailwind.config.js`)
- **Recharts 3** (dashboard & waterfall charts), **lucide-react** (icons),
  **papaparse** (batch CSV import/export)
- Tooling: **oxlint**, **vitest** (unit tests), Playwright + jsdom (e2e), pnpm

Design tokens (defined in `src/index.css`): dark teal `#0f3a3c`, teal `#028090`,
seafoam `#00a896`, mint `#02c39a`, amber `#d98c2b`, red `#c4432b`, light bg
`#f5f9f9`; display font Source Serif 4/Georgia, body font Inter/system-ui.

### Application structure

```text
src/
  App.tsx                 Routes (landing | Refract | Spectrum | Batch), form state,
                          URL-parameter hydration for shareable cases
  main.tsx, index.css     Entry point + Tailwind v4 @theme design tokens
  components/
    top-bar.tsx           PRISM header + tab navigation
    section-intro.tsx     Reusable section heading
    report-modal.tsx      Iframe report preview + print/PDF
    refract/              Patient risk calculator view
      refract-view.tsx      Form + presets + copy-link + implausible-value warning
      form-group.tsx        Grouped inputs with validation flags & cohort percentiles
      result-panel.tsx      Probability, tier badge, 95% uncertainty interval, factor
                            bars/waterfall toggle, advice, save assessment
      factor-bars.tsx       Reusable top-factor bar list
      waterfall-chart.tsx   SHAP-style waterfall (Recharts)
      what-if-panel.tsx     Counterfactual sliders with live risk delta
      history-panel.tsx     Saved assessments (localStorage) + compare selection
      comparison-view.tsx   Side-by-side comparison of two saved assessments
    spectrum/             Model performance dashboard view
      spectrum-view.tsx     Stat row, 4 chart cards, 2 list cards, uncertainty
                            distribution + calibration cards
      stat-row.tsx          98 stays · 10.2% mortality · 0.818 AUROC · 59 features
      chart-card.tsx        Card wrapper for Recharts charts
      list-card.tsx         Label/value tables
    batch/
      batch-view.tsx        CSV template download, upload, scored table with
                            95% uncertainty intervals, export
      batch-summary.tsx     Summary stats (count, avg risk, mean UI width)
  engine/
    predict-engine.ts     Client-side XGBoost evaluation + feature attribution
                          + per-tree leaf logits for uncertainty estimation
    advice-engine.ts      Risk tiering + clinical recommendations
    report-builder.ts     Print-optimized HTML report generation
    waterfall.ts          Waterfall steps relative to a median "typical patient"
    validation.ts         Reference-range checks + cohort z-scores/percentiles
    uncertainty.ts        95% uncertainty interval via tree-variance (IJ) +
                          Monte Carlo, calibrated against CV retraining variance
    uncertainty.test.ts   Vitest unit tests for uncertainty.ts
    history-store.ts      localStorage CRUD for saved assessments (cap 50)
    share.ts              Form ⇄ URL query-param serialization + clipboard helper
  data/
    model.json            Exported model (trees + preprocessing params +
                          uncertainty_lambda calibration scalar)
    fields.ts             22 input field definitions in 3 groups, with slider
                          ranges, normal/plausible clinical ranges
    examples.ts           lowRisk / highRisk example presets
    spectrum-data.ts      Hard-coded evaluation results + uncertainty calibration
                          metadata for the dashboard
  types/index.ts          TreeNode, ModelExport, PredictionResult, RiskTier,
                          UncertaintyInterval, SavedAssessment, ...
```

### How the prediction engine works

`predict-engine.ts` re-implements the exported XGBoost model exactly:

1. **Feature vector** — 57 numeric inputs are z-score standardized with the
   training-set means/scales (invalid/missing values fall back to training-set
   medians); `gender` (2) and `admission_type` (6) are one-hot encoded
   (missing → training modes `M`, `EW EMER.`) → 65-element vector.
2. **Tree evaluation** — walks all 200 exported trees
   (`{l, r, c, f, w}` arrays per tree), accumulating the raw margin and
   collecting per-tree leaf logits for uncertainty estimation.
3. **Probability** — `sigmoid(margin + logit(base_score))` with
   `base_score = 0.48276547`.
4. **Attribution** — a tree path-decomposition accumulates per-feature
   contributions (node-weight deltas along the decision path), then aggregates
   mean/min/max variants of each base measurement into a single ranked factor
   list — a fast SHAP-style explanation computed live in the browser.
5. **Uncertainty** — the per-tree leaf logits yield a raw margin variance
   `σ²_raw = Σ_t (w_t − w̄)²` (infinitesimal-jackknife form). `uncertainty.ts`
   scales this by `λ²` (calibrated against 5-fold CV retraining variance via
   Python script 09) and draws 400 Monte Carlo samples on the log-odds margin
   to produce a 95% confidence interval on the predicted probability. Falls
   back to an uncalibrated dispersion estimate if `λ` is absent from
   `model.json`.

`advice-engine.ts` maps probability to tiers — **Low** < 5%, **Moderate** < 15%,
**Elevated** < 30%, **High** ≥ 30% — with tier summaries and 20 factor-specific
clinical recommendations (top-5 risk-increasing factors shown).

`report-builder.ts` generates two print-optimized HTML documents: a **patient
report** (risk %, tier, 95% uncertainty interval + methodology, top-8 factor
table, "how the estimate was built" waterfall table, recommendations, input
values, disclaimer) and a **performance report** (cohort stats, holdout & CV
AUROC tables, top-5 SHAP, cross-method agreement, significant associations,
uncertainty calibration). All user values are HTML-escaped before interpolation.

### Interactive analysis features

- **What-if explorer** — after a prediction, sliders on modifiable inputs
  (vitals, labs, LOS, comorbidities) re-run the model live and show the risk
  delta against the untouched baseline.
- **Waterfall explanation** — a per-factor waterfall from a **"typical patient"
  baseline** (all inputs at training-set medians/modes, ≈ 36.5% risk) to the
  patient's predicted risk. Factor steps are the *difference* between the
  patient's and the median patient's path-decomposition contributions, so the
  final step reproduces the predicted probability exactly (verified to < 1e-9);
  steps are displayed in probability space and ordered by |contribution|.
- **Input validation & cohort context** — every numeric field is checked
  against standard adult reference ranges (amber = abnormal, red =
  physiologically implausible) and annotated with an approximate training-cohort
  percentile (normal approximation from the exported means/scales); values with
  |z| > 3 get an "outside training range" badge. Implausible values trigger a
  warning but never block calculation.
- **Uncertainty visualization** — a 95% confidence interval on the predicted
  probability, derived from the variance across the model's 200 boosted trees
  (infinitesimal-jackknife form), calibrated against 5-fold CV retraining
  variance. Shown as a band around the headline probability with a
  narrow/medium/wide tier chip and a methodology tooltip. This is a confidence
  interval on the predicted probability (model uncertainty about the estimate),
  *not* a prediction interval on the binary outcome. Falls back to an
  uncalibrated dispersion estimate if the calibration scalar (`λ`) is absent
  from `model.json` (run Python script 09 to populate it).
- **Assessment history & comparison** — assessments can be saved with a label
  to `localStorage` (per-browser, capped at 50), reloaded into the form, and
  compared two-at-a-time side by side with per-factor log-odds deltas.
- **Shareable case links** — the current form serializes into URL query
  parameters (`/refract?age=78&…`); opening such a link restores the case.
- **Batch CSV scoring** (`/batch`) — download a header template, upload a
  cohort CSV, and get a scored table (risk %, 95% uncertainty interval, tier,
  top-3 factors, implausible-value flags) with CSV export — all client-side
  via papaparse.

### Input fields (22)

- **Demographics & context:** age, LOS (days), comorbidity count, gender (F/M),
  admission type (6 MIMIC-IV categories)
- **Vital signs (first-24 h aggregates):** heart rate, respiratory rate, SpO₂,
  systolic & diastolic BP, temperature
- **Laboratory values:** creatinine, BUN, glucose, sodium, potassium, WBC,
  hemoglobin, bicarbonate, platelets, lactate

Each numeric field definition carries slider bounds (`min`/`max`/`step`), a
`modifiable` flag for the what-if explorer, and clinical `normalRange` /
`plausibleRange` bounds used by the validation engine.

Two built-in presets (`lowRisk`: 45 y elective admission, normal vitals/labs;
`highRisk`: 78 y urgent admission, markedly abnormal vitals/labs) demonstrate the
range of the tool.

---

## Reproducing the full workflow

1. Download the **MIMIC-IV Clinical Database Demo v2.2** (PhysioNet) and unpack it.
2. Point the path constants in scripts 01–04 at your local copy, then run
   `01` → `08` in order (artifacts are handed off via pickle/JSON/CSV files).
3. Export the fitted XGBoost model + preprocessing statistics to
   `gui/src/data/model.json` (schema: `base_score`, `trees[]` with
   `l/r/c/f/w` arrays, `numeric_cols`, `categorical_cols`, `medians`, `means`,
   `scales`, `cat_modes`, `cat_categories`, `uncertainty_lambda`,
   `uncertainty_method`) and refresh `spectrum-data.ts`. Run script 09 to
   calibrate `uncertainty_lambda`.
4. `pnpm build` in `gui/` → static site in `dist/`, deployable anywhere.

## Disclaimer

Research/educational project on a small demo cohort. Not a medical device; not
intended for clinical decision-making.
