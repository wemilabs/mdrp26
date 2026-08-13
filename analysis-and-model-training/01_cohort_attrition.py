import pandas as pd

BASE = '/data/raw/mimic-iv-clinical-database-demo-2.2'

patients = pd.read_csv(f'{BASE}/hosp/patients.csv')
admissions = pd.read_csv(f'{BASE}/hosp/admissions.csv', parse_dates=['admittime','dischtime','deathtime'])
icustays = pd.read_csv(f'{BASE}/icu/icustays.csv', parse_dates=['intime','outtime'])
diagnoses = pd.read_csv(f'{BASE}/hosp/diagnoses_icd.csv')

print("STEP 0: Raw demo release")
print(f"  Unique patients in patients.csv: {patients['subject_id'].nunique()}")
print(f"  Raw ICU stay records in icustays.csv: {len(icustays)}")
print(f"  Unique patients with >=1 ICU stay: {icustays['subject_id'].nunique()}")

# Merge age info
merged = icustays.merge(admissions[['subject_id','hadm_id','admittime','hospital_expire_flag','admission_type']],
                          on=['subject_id','hadm_id'], how='left')
merged = merged.merge(patients[['subject_id','gender','anchor_age','anchor_year']], on='subject_id', how='left')
merged['admit_year'] = merged['admittime'].dt.year
merged['age'] = merged['anchor_age'] + (merged['admit_year'] - merged['anchor_year'])

print(f"\nSTEP 1: Adult filter (age >= 18)")
n_before = len(merged)
adult = merged[merged['age'] >= 18]
print(f"  ICU stays before: {n_before} -> after: {len(adult)} (excluded: {n_before - len(adult)})")

print(f"\nSTEP 2: First qualifying ICU stay per patient")
n_before = len(adult)
adult_sorted = adult.sort_values(['subject_id','intime'])
first_stay = adult_sorted.groupby('subject_id').first().reset_index()
print(f"  ICU stays before: {n_before} -> after: {len(first_stay)} (excluded: {n_before - len(first_stay)} repeat stays)")

print(f"\nSTEP 3: Minimum length-of-stay filter (LOS >= 0.25 days / 6 hours)")
n_before = len(first_stay)
final_cohort = first_stay[first_stay['los'] >= 0.25]
print(f"  ICU stays before: {n_before} -> after: {len(final_cohort)} (excluded: {n_before - len(final_cohort)})")

print(f"\nFINAL COHORT: {len(final_cohort)} ICU stays, {final_cohort['subject_id'].nunique()} unique patients")
print(f"Deaths: {final_cohort['hospital_expire_flag'].sum()} ({final_cohort['hospital_expire_flag'].mean()*100:.1f}%)")

final_cohort.to_pickle('/data/interim/final_cohort_base.pkl')
