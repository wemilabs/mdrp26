import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

sns.set_style('whitegrid')
df = pd.read_csv('/data/reporting/mimic_iv_icu_mortality_cleaned.csv')

# ================= Descriptive Boxplots =================
vars_to_plot = [('age','Age (years)'), ('n_comorbidities','No. of Comorbidities'),
                ('creatinine_mean','Mean Creatinine (mg/dL)'), ('bun_mean','Mean BUN (mg/dL)')]
fig, axes = plt.subplots(1, 4, figsize=(14, 4.5))
for ax, (col, label) in zip(axes, vars_to_plot):
    sns.boxplot(x='hospital_expire_flag', y=col, data=df, ax=ax, hue='hospital_expire_flag',
                palette={0:'#4C72B0', 1:'#C44E52'}, legend=False)
    ax.set_xticks([0, 1])
    ax.set_xticklabels(['Survived', 'Died'])
    ax.set_xlabel('')
    ax.set_ylabel(label)
plt.tight_layout()
plt.savefig('/data/reporting/figs/fig_boxplots.png', dpi=150, bbox_inches='tight')
plt.close()

# ================= Correlation Heatmap =================
core_feats = ['age','los','n_comorbidities','heart_rate_mean','resp_rate_mean','spo2_mean',
              'sbp_mean','creatinine_mean','wbc_mean','bun_mean','platelets_mean','hospital_expire_flag']
corr = df[core_feats].corr()
plt.figure(figsize=(8, 6.5))
sns.heatmap(corr, annot=True, fmt='.2f', cmap='coolwarm', center=0, square=True,
            cbar_kws={'label': 'Pearson r'})
plt.tight_layout()
plt.savefig('/data/reporting/figs/fig_heatmap.png', dpi=150, bbox_inches='tight')
plt.close()
