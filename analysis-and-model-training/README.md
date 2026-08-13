# Analysis Pipeline

Run in numeric order. Scripts 01-02 require the raw MIMIC-IV Clinical Database
Demo (v2.2) folder structure (hosp/, icu/ subfolders); scripts 03-08 run
against the cleaned cohort CSV produced by 02, or the pickled artifacts each
script saves for the next.

| Script | Chapter Section | Purpose |
| --- | --- | --- |
| 01_cohort_attrition.py | 4.6.1 | Cohort eligibility funnel (100 patients -> 98 final) |
| 02_feature_extraction.py | 3.7, 4.6.1 | First-24h vitals/labs extraction, full precision |
| 03_missingness_and_comparison.py | 4.6.1, 4.6.2 | Missingness table + survivor vs. non-survivor stats |
| 04_descriptive_figures.py | 4.6.2 | Boxplots and correlation heatmap (no embedded titles) |
| 05_model_training_evaluation.py | 4.5, 4.7 | Trains LR/RF/XGBoost, 5-fold CV + holdout evaluation |
| 06_performance_figures.py | 4.7 | ROC, PR, CV bar chart, calibration, confusion matrices |
| 07_explainability_analysis.py | 4.8 | SHAP, RF importance, LR coefficients, cross-method overlap |
| 08_explainability_figures.py | 4.8 | SHAP summary plot, explanation comparison chart |

All scripts use `random_state=42` throughout for reproducibility.
