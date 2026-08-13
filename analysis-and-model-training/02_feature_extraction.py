import pandas as pd

BASE = '/data/raw/mimic-iv-clinical-database-demo-2.2'
cohort = pd.read_pickle('/data/interim/final_cohort_base.pkl')

diagnoses = pd.read_csv(f'{BASE}/hosp/diagnoses_icd.csv')
comorb = diagnoses.groupby('hadm_id')['icd_code'].nunique().reset_index().rename(columns={'icd_code':'n_comorbidities'})
cohort = cohort.merge(comorb, on='hadm_id', how='left')
cohort['n_comorbidities'] = cohort['n_comorbidities'].fillna(0)
cohort['window_end'] = cohort['intime'] + pd.Timedelta(hours=24)

VITAL_ITEMS = {220045:'heart_rate', 220210:'resp_rate', 220277:'spo2', 220179:'sbp', 220180:'dbp', 223761:'temp_f'}
LAB_ITEMS = {50912:'creatinine', 50931:'glucose', 50983:'sodium', 50971:'potassium', 51301:'wbc',
             51222:'hemoglobin', 50882:'bicarbonate', 51265:'platelets', 50813:'lactate', 51006:'bun'}

print("Loading chartevents...")
chart_chunks = []
for chunk in pd.read_csv(f'{BASE}/icu/chartevents.csv', usecols=['subject_id','stay_id','charttime','itemid','valuenum'],
                          parse_dates=['charttime'], chunksize=200000):
    chunk = chunk[chunk['itemid'].isin(VITAL_ITEMS.keys())]
    if len(chunk): chart_chunks.append(chunk)
chart = pd.concat(chart_chunks, ignore_index=True)
chart['vital'] = chart['itemid'].map(VITAL_ITEMS)
chart = chart.merge(cohort[['stay_id','intime','window_end']], on='stay_id', how='inner')
chart = chart[(chart['charttime'] >= chart['intime']) & (chart['charttime'] <= chart['window_end'])]
vital_agg = chart.groupby(['stay_id','vital'])['valuenum'].agg(['mean','min','max']).reset_index()
vital_wide = vital_agg.pivot(index='stay_id', columns='vital', values=['mean','min','max'])
vital_wide.columns = [f'{v}_{stat}' for stat, v in vital_wide.columns]
vital_wide = vital_wide.reset_index()

print("Loading labevents...")
lab_chunks = []
for chunk in pd.read_csv(f'{BASE}/hosp/labevents.csv', usecols=['subject_id','hadm_id','charttime','itemid','valuenum'],
                          parse_dates=['charttime'], chunksize=200000):
    chunk = chunk[chunk['itemid'].isin(LAB_ITEMS.keys())]
    if len(chunk): lab_chunks.append(chunk)
labs = pd.concat(lab_chunks, ignore_index=True)
labs['lab'] = labs['itemid'].map(LAB_ITEMS)
labs = labs.merge(cohort[['stay_id','hadm_id','intime','window_end']], on='hadm_id', how='inner')
labs = labs[(labs['charttime'] >= labs['intime']) & (labs['charttime'] <= labs['window_end'])]
lab_agg = labs.groupby(['stay_id','lab'])['valuenum'].agg(['mean','min','max']).reset_index()
lab_wide = lab_agg.pivot(index='stay_id', columns='lab', values=['mean','min','max'])
lab_wide.columns = [f'{l}_{stat}' for stat, l in lab_wide.columns]
lab_wide = lab_wide.reset_index()

features = cohort.merge(vital_wide, on='stay_id', how='left').merge(lab_wide, on='stay_id', how='left')
features.to_pickle('/data/processed/features_full_precision.pkl')
print("Final shape:", features.shape)
print("Deaths:", features['hospital_expire_flag'].sum(), "/", len(features))
