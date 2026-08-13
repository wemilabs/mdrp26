import type { FieldGroup } from "../types";

export const FIELD_GROUPS: FieldGroup[] = [
  {
    title: "Demographics & Context",
    fields: [
      { key: "age", label: "Age", unit: "years", type: "number" },
      { key: "los", label: "ICU length of stay", unit: "days", type: "number", note: "Best current estimate if patient is still admitted" },
      { key: "n_comorbidities", label: "Comorbidity count", unit: "distinct diagnoses", type: "number" },
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
      { key: "heart_rate", label: "Heart rate", unit: "bpm", type: "number" },
      { key: "resp_rate", label: "Respiratory rate", unit: "breaths/min", type: "number" },
      { key: "spo2", label: "SpO\u2082", unit: "%", type: "number" },
      { key: "sbp", label: "Systolic BP", unit: "mmHg", type: "number" },
      { key: "dbp", label: "Diastolic BP", unit: "mmHg", type: "number" },
      { key: "temp_f", label: "Temperature", unit: "\u00b0F", type: "number" },
    ],
  },
  {
    title: "Laboratory Values",
    fields: [
      { key: "creatinine", label: "Creatinine", unit: "mg/dL", type: "number" },
      { key: "bun", label: "BUN", unit: "mg/dL", type: "number" },
      { key: "glucose", label: "Glucose", unit: "mg/dL", type: "number" },
      { key: "sodium", label: "Sodium", unit: "mEq/L", type: "number" },
      { key: "potassium", label: "Potassium", unit: "mEq/L", type: "number" },
      { key: "wbc", label: "WBC", unit: "K/\u03bcL", type: "number" },
      { key: "hemoglobin", label: "Hemoglobin", unit: "g/dL", type: "number" },
      { key: "bicarbonate", label: "Bicarbonate", unit: "mEq/L", type: "number" },
      { key: "platelets", label: "Platelets", unit: "K/\u03bcL", type: "number" },
      { key: "lactate", label: "Lactate", unit: "mmol/L", type: "number" },
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
