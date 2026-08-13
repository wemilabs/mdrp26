import pandas as pd
import numpy as np
import pickle
import shap
import json

with open('/models/fitted_pipes.pkl','rb') as f:
    art = pickle.load(f)

pipes = art['pipes']
X_train, X_test = art['X_train'], art['X_test']
numeric_cols, categorical_cols = art['numeric_cols'], art['categorical_cols']

prep = pipes['XGBoost'].named_steps['prep']
ohe = prep.named_transformers_['cat'].named_steps['onehot']
cat_names = list(ohe.get_feature_names_out(categorical_cols))
feature_names = numeric_cols + cat_names
print("Total encoded features:", len(feature_names))

# ---- SHAP for XGBoost ----
xgb_clf = pipes['XGBoost'].named_steps['clf']
X_test_trans = prep.transform(X_test)
if hasattr(X_test_trans, "toarray"):
    X_test_trans = X_test_trans.toarray()

explainer = shap.TreeExplainer(xgb_clf)
shap_values = explainer.shap_values(X_test_trans)

mean_abs_shap = np.abs(shap_values).mean(axis=0)
shap_importance = pd.DataFrame({'feature': feature_names, 'mean_abs_shap': mean_abs_shap})
shap_importance = shap_importance.sort_values('mean_abs_shap', ascending=False)
shap_importance.to_csv('/results/shap_importance.csv', index=False)
print("\nTop 15 SHAP features (XGBoost):")
print(shap_importance.head(15).to_string(index=False))

np.save('/results/shap_values.npy', shap_values)
np.save('/results/X_test_trans.npy', X_test_trans)
with open('/results/feature_names.json','w') as f:
    json.dump(feature_names, f)

# ---- Random Forest importance ----
rf_clf = pipes['Random Forest'].named_steps['clf']
rf_importance = pd.DataFrame({'feature': feature_names, 'importance': rf_clf.feature_importances_})
rf_importance = rf_importance.sort_values('importance', ascending=False)
rf_importance.to_csv('/results/rf_importance.csv', index=False)
print("\nTop 15 Random Forest feature importances:")
print(rf_importance.head(15).to_string(index=False))

# ---- Logistic Regression coefficients ----
lr_clf = pipes['Logistic Regression'].named_steps['clf']
lr_coef = pd.DataFrame({'feature': feature_names, 'coefficient': lr_clf.coef_[0]})
lr_coef['abs_coef'] = lr_coef['coefficient'].abs()
lr_coef = lr_coef.sort_values('abs_coef', ascending=False)
lr_coef.to_csv('/results/lr_coefficients.csv', index=False)
print("\nTop 15 Logistic Regression coefficients:")
print(lr_coef.head(15)[['feature','coefficient']].to_string(index=False))

# ---- Cross-method top-5 overlap ----
top5_shap = set(shap_importance.head(5)['feature'])
top5_rf = set(rf_importance.head(5)['feature'])
top5_lr = set(lr_coef.head(5)['feature'])
overlap_shap_rf = len(top5_shap & top5_rf)
overlap_shap_lr = len(top5_shap & top5_lr)
overlap_rf_lr = len(top5_rf & top5_lr)
print(f"\nTop-5 overlap -> SHAP vs RF: {overlap_shap_rf}/5 | SHAP vs LR: {overlap_shap_lr}/5 | RF vs LR: {overlap_rf_lr}/5")
print("SHAP top5:", top5_shap)
print("RF top5:", top5_rf)
print("LR top5:", top5_lr)
with open('/results/overlap_results.json','w') as f:
    json.dump({'shap_rf': overlap_shap_rf, 'shap_lr': overlap_shap_lr, 'rf_lr': overlap_rf_lr,
               'top5_shap': list(top5_shap), 'top5_rf': list(top5_rf), 'top5_lr': list(top5_lr)}, f, indent=2)
