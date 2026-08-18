import {
  cohortPercentile,
  cohortZ,
  fieldStatus,
  type FieldStatus,
} from "../../engine/validation";
import type {
  FieldDefinition,
  FieldGroup,
  PatientFormValues,
} from "../../types";

interface FormGroupProps {
  group: FieldGroup;
  form: PatientFormValues;
  onChange: (key: string, value: string) => void;
}

const BORDER_BY_STATUS: Record<FieldStatus, string> = {
  empty: "border-prism-border",
  normal: "border-prism-border",
  abnormal: "border-prism-amber",
  implausible: "border-prism-red",
};

function FieldHint({
  field,
  status,
  value,
}: {
  field: FieldDefinition;
  status: FieldStatus;
  value: number;
}) {
  if (status === "implausible") {
    return (
      <p className="mt-1 text-[10.5px] font-semibold text-prism-red">
        Outside plausible range ({field.plausibleRange?.[0]}&ndash;
        {field.plausibleRange?.[1]}) &mdash; check the entry
      </p>
    );
  }

  const z = cohortZ(field.key, value);
  const parts: string[] = [];
  if (field.normalRange)
    parts.push(`Normal ${field.normalRange[0]}\u2013${field.normalRange[1]}`);
  if (z !== null && status !== "empty")
    parts.push(`\u2248 ${cohortPercentile(z)}th percentile of cohort`);
  if (parts.length === 0 && !(z !== null && Math.abs(z) > 3)) return null;

  return (
    <p
      className={`mt-1 text-[10.5px] ${status === "abnormal" ? "font-semibold text-prism-amber" : "text-prism-muted-2"}`}
    >
      {parts.join(" \u00b7 ")}
      {z !== null && Math.abs(z) > 3 && (
        <span className="ml-1.5 rounded bg-prism-amber/15 px-1.5 py-0.5 font-semibold text-prism-amber">
          outside training range
        </span>
      )}
    </p>
  );
}

export function FormGroup({ group, form, onChange }: FormGroupProps) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 font-display text-base font-semibold text-prism-teal">
        {group.title}
      </h3>
      <div className="grid grid-cols-2 gap-3.5">
        {group.fields.map((f) => {
          const status = fieldStatus(f, form[f.key]);
          const fieldId = `field-${f.key}`;
          return (
            <div key={f.key}>
              <label
                htmlFor={fieldId}
                className="mb-1 block text-xs font-medium text-prism-muted"
              >
                {f.label}{" "}
                {f.unit ? (
                  <span className="text-prism-muted-2">({f.unit})</span>
                ) : null}
              </label>
              {f.type === "select" ? (
                <select
                  id={fieldId}
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
                  id={fieldId}
                  type="number"
                  value={form[f.key] as number}
                  onChange={(e) => onChange(f.key, e.target.value)}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-prism-text outline-none transition-shadow focus:border-prism-teal focus:ring-2 focus:ring-prism-teal/20 ${BORDER_BY_STATUS[status]}`}
                />
              )}
              {f.note && (
                <p className="mt-1 text-[10.5px] text-prism-muted-2">
                  {f.note}
                </p>
              )}
              {f.type === "number" && (
                <FieldHint
                  field={f}
                  status={status}
                  value={Number(form[f.key])}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
