import { EXAMPLE_PATIENTS } from "../data/examples";
import { FIELD_GROUPS } from "../data/fields";
import type { PatientFormValues } from "../types";

const VALID_KEYS = new Set(FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.key)));

export function formToParams(form: PatientFormValues): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(form).forEach(([key, value]) => {
    if (VALID_KEYS.has(key)) params.set(key, String(value));
  });
  return params;
}

export function paramsToForm(params: URLSearchParams): PatientFormValues | null {
  const entries = [...params.entries()].filter(([key]) => VALID_KEYS.has(key));
  if (entries.length === 0) return null;
  return { ...EXAMPLE_PATIENTS.lowRisk.values, ...Object.fromEntries(entries) };
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  }
}
