import type { RankedFactor, Recommendation, RiskTier } from "../types";

export function riskTier(probability: number): RiskTier {
  if (probability < 0.05) return { label: "Low", colorVar: "var(--color-prism-mint)" };
  if (probability < 0.15) return { label: "Moderate", colorVar: "var(--color-prism-seafoam)" };
  if (probability < 0.3) return { label: "Elevated", colorVar: "var(--color-prism-amber)" };
  return { label: "High", colorVar: "var(--color-prism-red)" };
}

const TIER_SUMMARY: Record<string, string> = {
  Low: "Consistent with routine monitoring. No additional escalation is suggested by these inputs alone.",
  Moderate:
    "A moderately elevated watch level. Consider increasing monitoring frequency and reassessing trends over the next observation window.",
  Elevated:
    "A meaningful risk signal. Consider closer monitoring, correlating with the clinical exam, and multidisciplinary review of the factors below.",
  High: "A substantial risk signal. Consider prompt clinical reassessment and review of the specific drivers below alongside the full clinical picture.",
};

const FACTOR_ADVICE: Record<string, string> = {
  Age: "Advanced age is a non-modifiable risk factor \u2014 ensure age-appropriate care planning and goals-of-care discussion are up to date.",
  "Comorbidity count": "High comorbidity burden may benefit from multidisciplinary or specialist input to address competing conditions.",
  Creatinine: "Elevated renal markers may warrant further renal function assessment (e.g., nephrology input, medication dose review).",
  BUN: "Elevated BUN may warrant further renal function assessment and review of hydration and medication status.",
  Lactate: "Elevated lactate can indicate tissue hypoperfusion \u2014 consider assessment for sepsis or shock states.",
  WBC: "Elevated white cell count may indicate an active infectious or inflammatory process warranting further workup.",
  "Heart rate": "Abnormal heart rate suggests reviewing hemodynamic status and cardiovascular monitoring.",
  "Systolic BP": "Abnormal systolic blood pressure suggests reviewing hemodynamic status and perfusion.",
  "Diastolic BP": "Abnormal diastolic blood pressure suggests reviewing hemodynamic status and perfusion.",
  "Respiratory rate": "Abnormal respiratory rate suggests reassessing respiratory support needs.",
  "SpO\u2082": "Reduced oxygen saturation suggests reassessing respiratory support and oxygenation status.",
  Platelets: "Abnormal platelet count may warrant hematology review or a bleeding and clotting risk assessment.",
  Sodium: "Electrolyte disturbance noted \u2014 consider correction per protocol and recheck.",
  Potassium: "Electrolyte disturbance noted \u2014 consider correction per protocol and recheck, particularly given cardiac risk.",
  Bicarbonate: "Acid-base disturbance noted \u2014 consider blood gas review and correction per protocol.",
  "ICU length of stay":
    "Prolonged ICU stay is associated with cumulative risk \u2014 consider reassessing for complications of prolonged critical illness.",
  Temperature: "Abnormal temperature may indicate infection or a systemic inflammatory response \u2014 correlate clinically.",
  Glucose: "Glycemic derangement noted \u2014 consider glucose control per protocol.",
  Hemoglobin: "Low hemoglobin may indicate anemia contributing to reduced oxygen delivery \u2014 consider transfusion threshold review.",
};

/**
 * Derives a tier-level summary and factor-specific advisory notes from a
 * prediction's ranked risk-increasing factors. Educational output only.
 */
export function getRecommendations(probability: number, ranked: RankedFactor[]): Recommendation {
  const tier = riskTier(probability);
  const summary = TIER_SUMMARY[tier.label];
  const increasing = ranked.filter((r) => r.value > 0).slice(0, 5);
  const items = increasing
    .map((r) => ({ factor: r.name, advice: FACTOR_ADVICE[r.name] }))
    .filter((it): it is { factor: string; advice: string } => Boolean(it.advice));

  return { tierLabel: tier.label, summary, items };
}
