import pandas as pd
from scipy import stats

df = pd.read_csv('/data/reporting/mimic_iv_icu_mortality_cleaned.csv')
TARGET = 'hospital_expire_flag'

# ---------------- (a) Missingness summary ----------------
miss = df.isna().sum()
miss_pct = (df.isna().mean() * 100).round(1)
miss_table = pd.DataFrame({'missing_n': miss, 'missing_pct': miss_pct})
miss_table = miss_table[miss_table['missing_n'] > 0].sort_values('missing_pct', ascending=False)
print("=== Feature Missingness (Table 4.x) ===")
print(miss_table.to_string())

# ---------------- (b) Continuous variables: Mann-Whitney U ----------------
survivors = df[df[TARGET] == 0]
nonsurvivors = df[df[TARGET] == 1]
print(f"\nSurvivors: {len(survivors)} | Non-survivors: {len(nonsurvivors)}")

cont_vars = {
    'age': 'Age (years)',
    'los': 'ICU length of stay (days)',
    'n_comorbidities': 'No. of comorbidities',
    'heart_rate_mean': 'Mean heart rate (bpm)',
    'resp_rate_mean': 'Mean respiratory rate (/min)',
    'spo2_mean': 'Mean SpO2 (%)',
    'sbp_mean': 'Mean systolic BP (mmHg)',
    'creatinine_mean': 'Mean creatinine (mg/dL)',
    'wbc_mean': 'Mean WBC (K/uL)',
    'lactate_max': 'Max lactate (mmol/L)',
    'bun_mean': 'Mean BUN (mg/dL)',
    'platelets_mean': 'Mean platelet count (K/uL)',
}

rows = []
for col, label in cont_vars.items():
    s = survivors[col].dropna()
    ns = nonsurvivors[col].dropna()
    stat, p = stats.mannwhitneyu(s, ns, alternative='two-sided')
    rows.append({
        'Variable': label,
        'Survivors_median': round(s.median(), 2),
        'Survivors_IQR': f"{round(s.quantile(.25),2)}-{round(s.quantile(.75),2)}",
        'NonSurvivors_median': round(ns.median(), 2),
        'NonSurvivors_IQR': f"{round(ns.quantile(.25),2)}-{round(ns.quantile(.75),2)}",
        'p_value': round(p, 4),
    })

desc_table = pd.DataFrame(rows)
print("\n=== Table 4.1: Continuous Variables by Outcome (Mann-Whitney U) ===")
print(desc_table.to_string(index=False))
desc_table.to_csv('/data/reporting/descriptive_table_continuous.csv', index=False)

# ---------------- (c) Categorical variables: chi-square ----------------
print("\n=== Table 4.2: Categorical Variables by Outcome (Chi-square) ===")
for col in ['gender', 'admission_type']:
    ct = pd.crosstab(df[col], df[TARGET])
    chi2, p, dof, exp = stats.chi2_contingency(ct)
    print(f"{col}: chi2={chi2:.3f}, p={p:.4f}")
