import { FIELD_GROUPS } from "../data/fields";
import type { PatientFormValues } from "../types";
import { predict } from "./predict-engine";

export interface SensitivityBand {
  low: number;
  high: number;
}

const NUMERIC_KEYS = FIELD_GROUPS.flatMap((g) => g.fields)
  .filter((f) => f.type === "number")
  .map((f) => f.key);

export function sensitivityBand(
  form: PatientFormValues,
  baseProbability: number,
): SensitivityBand {
  let low = baseProbability;
  let high = baseProbability;

  NUMERIC_KEYS.forEach((key) => {
    const value = Number(form[key]);
    if (!Number.isFinite(value)) return;
    [0.95, 1.05].forEach((factor) => {
      const p = predict({ ...form, [key]: value * factor }).probability;
      low = Math.min(low, p);
      high = Math.max(high, p);
    });
  });

  return { low, high };
}
