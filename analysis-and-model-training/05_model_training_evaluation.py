import pandas as pd
import numpy as np
import json
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (roc_auc_score, average_precision_score, f1_score,
                              brier_score_loss, confusion_matrix, roc_curve,
                              precision_recall_curve)
import xgboost as xgb

np.random.seed(42)

df = pd.read_pickle('/data/processed/features_full_precision.pkl')
TARGET = 'hospital_expire_flag'

numeric_cols = [c for c in df.columns if any(c.startswith(p) for p in
    ['heart_rate','resp_rate','spo2','sbp','dbp','temp_f','creatinine','glucose','sodium',
     'potassium','wbc','hemoglobin','bicarbonate','platelets','lactate','bun'])] + ['age','los','n_comorbidities']
categorical_cols = ['gender','admission_type']

X = df[numeric_cols + categorical_cols].copy()
y = df[TARGET].astype(int)

print("Feature matrix:", X.shape, "| Positive class (deaths):", y.sum(), "/", len(y))

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

models = {
    'Logistic Regression': LogisticRegression(max_iter=2000, class_weight='balanced', C=1.0, random_state=42),
    'Random Forest': RandomForestClassifier(n_estimators=300, max_depth=4, min_samples_leaf=3,
                                             class_weight='balanced', random_state=42),
    'XGBoost': xgb.XGBClassifier(n_estimators=200, max_depth=3, learning_rate=0.05,
                                  subsample=0.8, colsample_bytree=0.8, eval_metric='logloss',
                                  scale_pos_weight=(y==0).sum()/(y==1).sum(), random_state=42),
}

# ---------------- 5-fold stratified cross-validation ----------------
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_results = {}
for name, clf in models.items():
    pipe = Pipeline([('prep', preprocess), ('clf', clf)])
    scores = cross_validate(pipe, X, y, cv=cv,
                             scoring=['roc_auc','average_precision','f1','neg_brier_score'],
                             return_train_score=False)
    cv_results[name] = {
        'AUROC_mean': scores['test_roc_auc'].mean(), 'AUROC_std': scores['test_roc_auc'].std(),
        'AUPRC_mean': scores['test_average_precision'].mean(), 'AUPRC_std': scores['test_average_precision'].std(),
        'F1_mean': scores['test_f1'].mean(), 'F1_std': scores['test_f1'].std(),
        'Brier_mean': -scores['test_neg_brier_score'].mean(), 'Brier_std': scores['test_neg_brier_score'].std(),
    }
    print(name, {k: round(v,4) for k,v in cv_results[name].items()})

with open('/results/cv_results.json','w') as f:
    json.dump(cv_results, f, indent=2)

# ---------------- Single stratified holdout split ----------------
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, stratify=y, random_state=42)
print("\nHoldout split -> train:", X_train.shape, "test:", X_test.shape,
      "| test positives:", y_test.sum())

holdout_results = {}
fitted_pipes = {}
roc_data = {}
pr_data = {}
for name, clf in models.items():
    pipe = Pipeline([('prep', preprocess), ('clf', clf)])
    pipe.fit(X_train, y_train)
    fitted_pipes[name] = pipe
    proba = pipe.predict_proba(X_test)[:, 1]
    pred = (proba >= 0.5).astype(int)

    auroc = roc_auc_score(y_test, proba)
    auprc = average_precision_score(y_test, proba)
    f1 = f1_score(y_test, pred)
    brier = brier_score_loss(y_test, proba)
    tn, fp, fn, tp = confusion_matrix(y_test, pred).ravel()
    sens = tp / (tp + fn) if (tp+fn) > 0 else np.nan
    spec = tn / (tn + fp) if (tn+fp) > 0 else np.nan

    fpr_arr, tpr_arr, thr_arr = roc_curve(y_test, proba)
    youden = tpr_arr - fpr_arr
    best_idx = int(np.argmax(youden))
    best_thr = float(thr_arr[best_idx])
    pred_opt = (proba >= best_thr).astype(int)
    tn2, fp2, fn2, tp2 = confusion_matrix(y_test, pred_opt).ravel()
    sens_opt = tp2 / (tp2 + fn2) if (tp2+fn2) > 0 else np.nan
    spec_opt = tn2 / (tn2 + fp2) if (tn2+fp2) > 0 else np.nan
    f1_opt = f1_score(y_test, pred_opt)

    holdout_results[name] = dict(AUROC=auroc, AUPRC=auprc, F1=f1, Brier=brier,
                                  Sensitivity=sens, Specificity=spec,
                                  TN=int(tn), FP=int(fp), FN=int(fn), TP=int(tp),
                                  OptimalThreshold=best_thr, Sensitivity_opt=sens_opt,
                                  Specificity_opt=spec_opt, F1_opt=f1_opt,
                                  TN_opt=int(tn2), FP_opt=int(fp2), FN_opt=int(fn2), TP_opt=int(tp2))
    fpr, tpr, _ = roc_curve(y_test, proba)
    roc_data[name] = (fpr.tolist(), tpr.tolist())
    prec, rec, _ = precision_recall_curve(y_test, proba)
    pr_data[name] = (prec.tolist(), rec.tolist())
    print(name, {k: (round(v,4) if isinstance(v,float) else v) for k,v in holdout_results[name].items()})

with open('/results/holdout_results.json','w') as f:
    json.dump(holdout_results, f, indent=2)
with open('/results/roc_data.json','w') as f:
    json.dump(roc_data, f)
with open('/results/pr_data.json','w') as f:
    json.dump(pr_data, f)

import pickle
with open('/models/fitted_pipes.pkl','wb') as f:
    pickle.dump({'pipes': fitted_pipes, 'X_train': X_train, 'X_test': X_test,
                 'y_train': y_train, 'y_test': y_test,
                 'numeric_cols': numeric_cols, 'categorical_cols': categorical_cols}, f)

print("\nSaved all model artifacts.")
