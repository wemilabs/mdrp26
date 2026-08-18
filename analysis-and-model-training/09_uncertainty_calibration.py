"""
Uncertainty calibration for the PRISM GUI.

The GUI computes a raw per-patient dispersion sigma2_raw from the variance
across the 200 XGBoost tree leaf weights (infinitesimal-jackknife form).  That
raw quantity is NOT a calibrated variance because boosted trees are sequential
corrections, not independent bagged samples.

This script calibrates a single scalar lambda so that

    Var_predicted(p_hat) = lambda^2 * sigma2_raw

matches the *actually observed* 5-fold cross-validation retraining variance of
p_hat -- our ground-truth proxy for epistemic uncertainty.

Outputs (written to /results/):
  - uncertainty_calibration.json   lambda, R^2, coverage, per-patient intervals
  - model.json is patched in-place (if MODEL_JSON_PATH points to a writable copy)
    with `uncertainty_lambda` and `uncertainty_method`.

Run after 05_model_training_evaluation.py (needs fitted_pipes.pkl + features_full_precision.pkl).
"""

import json
import os
import pickle

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer

np.random.seed(42)

# -- paths (adjust to your environment, same convention as scripts 05-08) ----
FEATURES_PKL = '/data/processed/features_full_precision.pkl'
FITTED_PIPES_PKL = '/models/fitted_pipes.pkl'
RESULTS_DIR = '/results'
# Path to the GUI's model.json relative to this repo; set to None to skip patching
MODEL_JSON_PATH = os.path.join(
    os.path.dirname(__file__), '..', 'gui', 'src', 'data', 'model.json'
)

TARGET = 'hospital_expire_flag'

# -- load data + fitted model ------------------------------------------------
df = pd.read_pickle(FEATURES_PKL)
with open(FITTED_PIPES_PKL, 'rb') as f:
    art = pickle.load(f)

pipes = art['pipes']
X_train, X_test = art['X_train'], art['X_test']
y_train, y_test = art['y_train'], art['y_test']
numeric_cols = art['numeric_cols']
categorical_cols = art['categorical_cols']

X = df[numeric_cols + categorical_cols].copy()
y = df[TARGET].astype(int)

xgb_clf = pipes['XGBoost'].named_steps['clf']
prep = pipes['XGBoost'].named_steps['prep']

n_trees = xgb_clf.get_booster().num_trees()
print(f"XGBoost trees: {n_trees}")

# -- 1. per-tree leaf weights for holdout test patients ----------------------
X_test_trans = prep.transform(X_test)
if hasattr(X_test_trans, 'toarray'):
    X_test_trans = X_test_trans.toarray()

booster = xgb_clf.get_booster()
dtest = xgb.DMatrix(X_test_trans)
leaf_indices = booster.predict(dtest, pred_leaf=True)  # (n_test, n_trees)

tree_dumps = [json.loads(t) for t in booster.get_dump(dump_format='json')]


def extract_leaf_weights(tree_json):
    weights = {}
    stack = [tree_json]
    while stack:
        node = stack.pop()
        if 'leaf' in node:
            weights[node['nodeid']] = float(node['leaf'])
        else:
            stack.extend(node['children'])
    return weights


all_leaf_weights = [extract_leaf_weights(t) for t in tree_dumps]

per_tree_weights = np.zeros((len(X_test), n_trees))
for t in range(n_trees):
    lw = all_leaf_weights[t]
    for i in range(len(X_test)):
        per_tree_weights[i, t] = lw[leaf_indices[i, t]]

# sigma2_raw = sum_t (w_t - w_bar)^2  (IJ form, matches the GUI engine)
mean_w = per_tree_weights.mean(axis=1)
sigma2_raw = ((per_tree_weights - mean_w[:, None]) ** 2).sum(axis=1)

# point predictions (sanity: must match the GUI to floating-point precision)
base_logit = float(np.log(xgb_clf.base_score / (1 - xgb_clf.base_score)))
margin = per_tree_weights.sum(axis=1) + base_logit
p_hat = 1 / (1 + np.exp(-margin))

print(f"\nHoldout test set: {len(X_test)} patients")
print(f"sigma2_raw: mean={sigma2_raw.mean():.6f} min={sigma2_raw.min():.6f} max={sigma2_raw.max():.6f}")

# -- 2. 5-fold CV retraining variance (ground truth) -------------------------
# Re-run the same 5-fold stratified CV as script 05, but predict on ALL
# patients in every fold so we get 5 predictions per patient.
preprocess = ColumnTransformer([
    ('num', Pipeline([
        ('impute', SimpleImputer(strategy='median')),
        ('scale', StandardScaler())
    ]), numeric_cols),
    ('cat', Pipeline([
        ('impute', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ]), categorical_cols)
])

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
oof_preds = np.zeros((5, len(y)))

for fold_idx, (train_idx, _) in enumerate(cv.split(X, y)):
    pipe = Pipeline([('prep', preprocess), ('clf', xgb.XGBClassifier(
        n_estimators=200, max_depth=3, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, eval_metric='logloss',
        scale_pos_weight=float((y == 0).sum() / (y == 1).sum()),
        random_state=42
    ))])
    pipe.fit(X.iloc[train_idx], y.iloc[train_idx])
    oof_preds[fold_idx] = pipe.predict_proba(X)[:, 1]
    print(f"  fold {fold_idx + 1}/5 trained")

cv_var_p = np.var(oof_preds, axis=0, ddof=1)
cv_mean_p = oof_preds.mean(axis=0)

# align test-set patients to their CV variance via index
test_indices = X_test.index.tolist()
sigma2_raw_test = sigma2_raw
cv_var_p_test = cv_var_p[test_indices]
cv_mean_p_test = cv_mean_p[test_indices]
p_hat_test = p_hat

print(f"\ncv_var_p (test): mean={cv_var_p_test.mean():.6f} min={cv_var_p_test.min():.6f} max={cv_var_p_test.max():.6f}")

# -- 3. fit lambda via OLS through origin on sqrt scale ----------------------
#   sqrt(cv_var_p) = lambda * sqrt(sigma2_raw) + eps
sqrt_cv = np.sqrt(np.maximum(cv_var_p_test, 0))
sqrt_raw = np.sqrt(np.maximum(sigma2_raw_test, 0))

# exclude patients where either side is 0 (no signal)
mask = (sqrt_cv > 0) & (sqrt_raw > 0)
lam = float(np.dot(sqrt_cv[mask], sqrt_raw[mask]) / np.dot(sqrt_raw[mask], sqrt_raw[mask]))

# R^2 on the sqrt scale
predicted_sqrt = lam * sqrt_raw
ss_res = float(np.sum((sqrt_cv[mask] - predicted_sqrt[mask]) ** 2))
ss_tot = float(np.sum((sqrt_cv[mask] - sqrt_cv[mask].mean()) ** 2))
r_squared = 1 - ss_res / ss_tot if ss_tot > 0 else 0.0

print(f"\nlambda = {lam:.6f}  (n={mask.sum()} patients used for fit)")
print(f"R^2 (sqrt scale) = {r_squared:.4f}")

# -- 4. empirical coverage of the 95% interval -------------------------------
# MC interval: draw M* ~ N(M, lambda^2 * sigma2_raw), sigmoid, take 2.5/97.5 pct
rng = np.random.default_rng(42)
B = 1000
mc_samples = np.zeros((B, len(X_test)))
for i in range(len(X_test)):
    draws = rng.normal(margin[i], lam * np.sqrt(max(sigma2_raw_test[i], 0)), B)
    mc_samples[:, i] = 1 / (1 + np.exp(-draws))

interval_low = np.percentile(mc_samples, 2.5, axis=0)
interval_high = np.percentile(mc_samples, 97.5, axis=0)
interval_width = interval_high - interval_low

# coverage: fraction of the 5 CV fold predictions that fall inside the interval
inside = np.zeros(len(X_test), dtype=int)
for i in range(len(X_test)):
    patient_idx = test_indices[i]
    fold_preds = oof_preds[:, patient_idx]
    inside[i] = int(np.all(fold_preds >= interval_low[i]) and np.all(fold_preds <= interval_high[i]))
coverage = float(inside.mean())

print(f"Empirical coverage (all 5 folds inside 95% MC interval): {coverage:.1%}")
print(f"Interval width: mean={interval_width.mean():.4f} min={interval_width.min():.4f} max={interval_width.max():.4f}")

# -- 5. export ----------------------------------------------------------------
os.makedirs(RESULTS_DIR, exist_ok=True)

calibration = {
    'lambda': lam,
    'r_squared': r_squared,
    'coverage': coverage,
    'n_patients': int(len(X_test)),
    'n_patients_fit': int(mask.sum()),
    'n_folds': 5,
    'n_trees': int(n_trees),
    'method': 'ijknife_cv_calibrated',
    'mc_samples': B,
    'base_score': float(xgb_clf.base_score),
    'interval_width_mean': float(interval_width.mean()),
    'interval_width_min': float(interval_width.min()),
    'interval_width_max': float(interval_width.max()),
    'per_patient': [
        {
            'p_hat': float(p_hat_test[i]),
            'sigma2_raw': float(sigma2_raw_test[i]),
            'cv_var_p': float(cv_var_p_test[i]),
            'cv_mean_p': float(cv_mean_p_test[i]),
            'interval_low': float(interval_low[i]),
            'interval_high': float(interval_high[i]),
            'interval_width': float(interval_width[i]),
            'outcome': int(y_test.iloc[i]),
        }
        for i in range(len(X_test))
    ],
}

out_path = os.path.join(RESULTS_DIR, 'uncertainty_calibration.json')
with open(out_path, 'w') as f:
    json.dump(calibration, f, indent=2)
print(f"\nSaved {out_path}")

# -- 6. patch model.json with uncertainty_lambda -----------------------------
if MODEL_JSON_PATH and os.path.exists(MODEL_JSON_PATH):
    with open(MODEL_JSON_PATH, 'r') as f:
        model = json.load(f)
    model['uncertainty_lambda'] = lam
    model['uncertainty_method'] = 'ijknife_cv_calibrated'
    with open(MODEL_JSON_PATH, 'w') as f:
        json.dump(model, f, indent=2)
    print(f"Patched {MODEL_JSON_PATH} with uncertainty_lambda={lam:.6f}")
else:
    print(f"\nmodel.json not found at {MODEL_JSON_PATH}.")
    print(f"Manually add to gui/src/data/model.json:")
    print(f'  "uncertainty_lambda": {lam},')
    print(f'  "uncertainty_method": "ijknife_cv_calibrated"')
