import pandas as pd
import numpy as np
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import shap

FIGDIR = '/data/reporting/figs'

# ================= SHAP summary (beeswarm) =================
shap_values = np.load('/results/shap_values.npy')
X_test_trans = np.load('/results/X_test_trans.npy')
with open('/results/feature_names.json') as f: feature_names = json.load(f)

plt.figure()
shap.summary_plot(shap_values, X_test_trans, feature_names=feature_names, max_display=12, show=False)
plt.tight_layout()
plt.savefig(f'{FIGDIR}/fig6_shap_summary.png', dpi=150, bbox_inches='tight')
plt.close()

# ================= Explanation comparison: SHAP vs RF =================
shap_imp = pd.read_csv('/results/shap_importance.csv').head(8)
rf_imp = pd.read_csv('/results/rf_importance.csv').head(8)

fig, axes = plt.subplots(1, 2, figsize=(12,5))
axes[0].barh(shap_imp['feature'][::-1], shap_imp['mean_abs_shap'][::-1], color='#C44E52')
axes[0].set_title('XGBoost \u2013 SHAP Mean |Value|', fontsize=11)
axes[0].set_xlabel('Mean |SHAP value|')

axes[1].barh(rf_imp['feature'][::-1], rf_imp['importance'][::-1], color='#55A868')
axes[1].set_title('Random Forest \u2013 Built-in Importance', fontsize=11)
axes[1].set_xlabel('Gini importance')
plt.tight_layout()
plt.savefig(f'{FIGDIR}/fig7_explanation_comparison.png', dpi=150, bbox_inches='tight')
plt.close()

print("Both explainability figures successfully generated")
