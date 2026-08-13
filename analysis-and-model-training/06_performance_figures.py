import numpy as np
import json
import pickle
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

sns.set_style('whitegrid')
FIGDIR = '/data/figs'
import os
os.makedirs(FIGDIR, exist_ok=True)
COLORS = {'Logistic Regression': '#4C72B0', 'Random Forest': '#55A868', 'XGBoost': '#C44E52'}

with open('/results/roc_data.json') as f: roc_data = json.load(f)
with open('/results/pr_data.json') as f: pr_data = json.load(f)
with open('/results/holdout_results.json') as f: holdout = json.load(f)
with open('/results/cv_results.json') as f: cvres = json.load(f)
with open('/models/fitted_pipes.pkl','rb') as f: art = pickle.load(f)
pipes, X_test, y_test = art['pipes'], art['X_test'], art['y_test']

# ================= Fig: ROC curves (NO title) =================
plt.figure(figsize=(6,5.5))
for name, (fpr, tpr) in roc_data.items():
    auc = holdout[name]['AUROC']
    plt.plot(fpr, tpr, label=f"{name} (AUROC={auc:.2f})", color=COLORS[name], linewidth=2)
plt.plot([0,1],[0,1],'--', color='gray', linewidth=1, label='Chance (AUROC=0.50)')
plt.xlabel('False Positive Rate (1 \u2013 Specificity)')
plt.ylabel('True Positive Rate (Sensitivity)')
plt.legend(loc='lower right', fontsize=9)
plt.tight_layout()
plt.savefig(f'{FIGDIR}/fig1_roc_curves.png', dpi=150)
plt.close()

# ================= Precision-Recall curves =================
plt.figure(figsize=(6,5.5))
baseline = y_test.mean()
for name, (prec, rec) in pr_data.items():
    auprc = holdout[name]['AUPRC']
    plt.plot(rec, prec, label=f"{name} (AUPRC={auprc:.2f})", color=COLORS[name], linewidth=2)
plt.axhline(baseline, linestyle='--', color='gray', linewidth=1, label=f'Baseline prevalence ({baseline:.2f})')
plt.xlabel('Recall (Sensitivity)')
plt.ylabel('Precision')
plt.legend(loc='upper right', fontsize=9)
plt.tight_layout()
plt.savefig(f'{FIGDIR}/fig2_pr_curves.png', dpi=150)
plt.close()

# ================= Cross-validated AUROC comparison =================
plt.figure(figsize=(6,5))
names = list(cvres.keys())
means = [cvres[n]['AUROC_mean'] for n in names]
stds = [cvres[n]['AUROC_std'] for n in names]
bars = plt.bar(names, means, yerr=stds, capsize=6, color=[COLORS[n] for n in names], alpha=0.85)
plt.axhline(0.5, linestyle='--', color='gray', linewidth=1)
plt.ylabel('AUROC (5-fold Stratified CV, mean \u00b1 SD)')
plt.ylim(0, 1.05)
plt.xticks(rotation=10)
plt.tight_layout()
plt.savefig(f'{FIGDIR}/fig3_cv_auroc.png', dpi=150)
plt.close()

# ================= Calibration curves =================
from sklearn.calibration import calibration_curve
plt.figure(figsize=(6,5.5))
for name, pipe in pipes.items():
    proba = pipe.predict_proba(X_test)[:,1]
    frac_pos, mean_pred = calibration_curve(y_test, proba, n_bins=5, strategy='quantile')
    plt.plot(mean_pred, frac_pos, marker='o', label=name, color=COLORS[name], linewidth=2)
plt.plot([0,1],[0,1],'--', color='gray', linewidth=1, label='Perfect calibration')
plt.xlabel('Mean Predicted Mortality Probability')
plt.ylabel('Observed Mortality Fraction')
plt.legend(fontsize=9)
plt.tight_layout()
plt.savefig(f'{FIGDIR}/fig4_calibration.png', dpi=150)
plt.close()

# ================= Confusion matrices at optimal threshold =================
fig, axes = plt.subplots(1, 3, figsize=(13,4.2))
for ax, name in zip(axes, names):
    r = holdout[name]
    cm = np.array([[r['TN_opt'], r['FP_opt']], [r['FN_opt'], r['TP_opt']]])
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False, ax=ax,
                xticklabels=['Survived','Died'], yticklabels=['Survived','Died'])
    ax.set_title(f"{name} (threshold={r['OptimalThreshold']:.2f})", fontsize=10)
    ax.set_xlabel('Predicted')
    ax.set_ylabel('Actual')
plt.tight_layout()
plt.savefig(f'{FIGDIR}/fig5_confusion_matrices.png', dpi=150, bbox_inches='tight')
plt.close()

print("All graphs successfully generated")
import os
for f in sorted(os.listdir(FIGDIR)):
    print(' -', f)
