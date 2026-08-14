import { FIELD_GROUPS } from "../data/fields";
import type { FieldDefinition, PatientFormValues } from "../types";
import { MODEL } from "./predict-engine";

export type FieldStatus = "empty" | "normal" | "abnormal" | "implausible";

const NUMERIC_FIELDS = FIELD_GROUPS.flatMap((g) => g.fields).filter((f) => f.type === "number");

export function fieldStatus(field: FieldDefinition, raw: string | number): FieldStatus {
  if (field.type !== "number") return "normal";
  const v = Number(raw);
  if (raw === "" || raw === null || raw === undefined || !Number.isFinite(v)) return "empty";
  if (field.plausibleRange && (v < field.plausibleRange[0] || v > field.plausibleRange[1])) return "implausible";
  if (field.normalRange && (v < field.normalRange[0] || v > field.normalRange[1])) return "abnormal";
  return "normal";
}

export function cohortZ(fieldKey: string, value: number): number | null {
  let idx = MODEL.numeric_cols.indexOf(`${fieldKey}_mean`);
  if (idx === -1) idx = MODEL.numeric_cols.indexOf(fieldKey);
  if (idx === -1 || !Number.isFinite(value)) return null;
  const scale = MODEL.scales[idx];
  if (!scale) return null;
  return (value - MODEL.means[idx]) / scale;
}

export function cohortPercentile(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const upper = z > 0 ? 1 - p : p;
  return Math.round(Math.min(Math.max(upper * 100, 1), 99));
}

export interface FieldIssue {
  key: string;
  label: string;
  status: FieldStatus;
}

export function formIssues(form: PatientFormValues): FieldIssue[] {
  return NUMERIC_FIELDS.map((f) => ({ key: f.key, label: f.label, status: fieldStatus(f, form[f.key]) })).filter(
    (issue) => issue.status === "implausible"
  );
}
