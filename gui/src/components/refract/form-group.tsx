import type { FieldGroup, PatientFormValues } from "../../types";

interface FormGroupProps {
  group: FieldGroup;
  form: PatientFormValues;
  onChange: (key: string, value: string) => void;
}

export function FormGroup({ group, form, onChange }: FormGroupProps) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 font-display text-base font-semibold text-prism-teal">{group.title}</h3>
      <div className="grid grid-cols-2 gap-3.5">
        {group.fields.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-xs font-medium text-prism-muted">
              {f.label} {f.unit ? <span className="text-prism-muted-2">({f.unit})</span> : null}
            </label>
            {f.type === "select" ? (
              <select
                value={form[f.key] as string}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="w-full rounded-lg border border-prism-border bg-white px-3 py-2 text-sm text-prism-text outline-none transition-shadow focus:border-prism-teal focus:ring-2 focus:ring-prism-teal/20"
              >
                {f.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                value={form[f.key] as number}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="w-full rounded-lg border border-prism-border bg-white px-3 py-2 text-sm text-prism-text outline-none transition-shadow focus:border-prism-teal focus:ring-2 focus:ring-prism-teal/20"
              />
            )}
            {f.note && <p className="mt-1 text-[10.5px] text-prism-muted-2">{f.note}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
