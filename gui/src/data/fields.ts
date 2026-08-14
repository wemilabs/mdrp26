import type { FieldGroup } from "../types";

export const FIELD_GROUPS: FieldGroup[] = [
  {
    title: "Demographics & Context",
    fields: [
      { key: "age", label: "Age", unit: "years", type: "number", min: 18, max: 110, step: 1, plausibleRange: [18, 120] },
      {
        key: "los",
        label: "ICU length of stay",
        unit: "days",
        type: "number",
        note: "Best current estimate if patient is still admitted",
        min: 0.25,
        max: 60,
        step: 0.25,
        modifiable: true,
        plausibleRange: [0.25, 365],
      },
      {
        key: "n_comorbidities",
        label: "Comorbidity count",
        unit: "distinct diagnoses",
        type: "number",
        min: 0,
        max: 60,
        step: 1,
        modifiable: true,
        plausibleRange: [0, 100],
      },
      { key: "gender", label: "Gender", type: "select", options: ["F", "M"] },
      {
        key: "admission_type",
        label: "Admission type",
        type: "select",
        options: ["DIRECT EMER.", "ELECTIVE", "EW EMER.", "OBSERVATION ADMIT", "SURGICAL SAME DAY ADMISSION", "URGENT"],
      },
    ],
  },
  {
    title: "Vital Signs",
    fields: [
      { key: "heart_rate", label: "Heart rate", unit: "bpm", type: "number", min: 20, max: 220, step: 1, modifiable: true, normalRange: [60, 100], plausibleRange: [20, 250] },
      { key: "resp_rate", label: "Respiratory rate", unit: "breaths/min", type: "number", min: 4, max: 60, step: 1, modifiable: true, normalRange: [12, 20], plausibleRange: [4, 80] },
      { key: "spo2", label: "SpO\u2082", unit: "%", type: "number", min: 50, max: 100, step: 1, modifiable: true, normalRange: [95, 100], plausibleRange: [50, 100] },
      { key: "sbp", label: "Systolic BP", unit: "mmHg", type: "number", min: 40, max: 260, step: 1, modifiable: true, normalRange: [90, 120], plausibleRange: [40, 300] },
      { key: "dbp", label: "Diastolic BP", unit: "mmHg", type: "number", min: 20, max: 160, step: 1, modifiable: true, normalRange: [60, 80], plausibleRange: [20, 200] },
      { key: "temp_f", label: "Temperature", unit: "\u00b0F", type: "number", min: 90, max: 108, step: 0.1, modifiable: true, normalRange: [97, 99.5], plausibleRange: [85, 110] },
    ],
  },
  {
    title: "Laboratory Values",
    fields: [
      { key: "creatinine", label: "Creatinine", unit: "mg/dL", type: "number", min: 0.1, max: 15, step: 0.1, modifiable: true, normalRange: [0.6, 1.3], plausibleRange: [0.1, 25] },
      { key: "bun", label: "BUN", unit: "mg/dL", type: "number", min: 1, max: 150, step: 1, modifiable: true, normalRange: [7, 20], plausibleRange: [1, 250] },
      { key: "glucose", label: "Glucose", unit: "mg/dL", type: "number", min: 20, max: 800, step: 1, modifiable: true, normalRange: [70, 140], plausibleRange: [20, 1500] },
      { key: "sodium", label: "Sodium", unit: "mEq/L", type: "number", min: 100, max: 185, step: 1, modifiable: true, normalRange: [135, 145], plausibleRange: [100, 185] },
      { key: "potassium", label: "Potassium", unit: "mEq/L", type: "number", min: 1, max: 9, step: 0.1, modifiable: true, normalRange: [3.5, 5], plausibleRange: [1, 12] },
      { key: "wbc", label: "WBC", unit: "K/\u03bcL", type: "number", min: 0.1, max: 100, step: 0.1, modifiable: true, normalRange: [4, 11], plausibleRange: [0.1, 500] },
      { key: "hemoglobin", label: "Hemoglobin", unit: "g/dL", type: "number", min: 2, max: 22, step: 0.1, modifiable: true, normalRange: [12, 17], plausibleRange: [2, 25] },
      { key: "bicarbonate", label: "Bicarbonate", unit: "mEq/L", type: "number", min: 5, max: 50, step: 1, modifiable: true, normalRange: [22, 28], plausibleRange: [5, 60] },
      { key: "platelets", label: "Platelets", unit: "K/\u03bcL", type: "number", min: 5, max: 1500, step: 5, modifiable: true, normalRange: [150, 400], plausibleRange: [5, 2000] },
      { key: "lactate", label: "Lactate", unit: "mmol/L", type: "number", min: 0.1, max: 20, step: 0.1, modifiable: true, normalRange: [0.5, 2], plausibleRange: [0.1, 30] },
    ],
  },
];

export const FIELD_LABEL_LOOKUP: Record<string, string> = FIELD_GROUPS.flatMap((g) => g.fields).reduce(
  (acc, f) => {
    acc[f.key] = f.unit ? `${f.label} (${f.unit})` : f.label;
    return acc;
  },
  {} as Record<string, string>
);
