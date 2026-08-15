import { AlertTriangle, Download, FileUp } from "lucide-react";
import Papa from "papaparse";
import { useState } from "react";
import { EXAMPLE_PATIENTS } from "../../data/examples";
import { FIELD_GROUPS } from "../../data/fields";
import { riskTier } from "../../engine/advice-engine";
import { predict } from "../../engine/predict-engine";
import { formIssues } from "../../engine/validation";
import type { PatientFormValues, RiskTier } from "../../types";
import { SectionIntro } from "../section-intro";

interface BatchRow {
  index: number;
  form: PatientFormValues;
  probability: number;
  tier: RiskTier;
  topFactors: string[];
  issues: string[];
}

const FIELD_KEYS = FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.key));

function downloadCsv(content: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function scoreRows(records: Record<string, string>[]): BatchRow[] {
  return records.map((record, i) => {
    const form: PatientFormValues = Object.fromEntries(
      FIELD_KEYS.map((key) => [key, record[key] ?? ""]),
    );
    const result = predict(form);
    return {
      index: i + 1,
      form,
      probability: result.probability,
      tier: riskTier(result.probability),
      topFactors: result.ranked.slice(0, 3).map((r) => r.name),
      issues: formIssues(form).map((issue) => issue.label),
    };
  });
}

export function BatchView() {
  const [rows, setRows] = useState<BatchRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const known =
          res.meta.fields?.filter((f) => FIELD_KEYS.includes(f)) ?? [];
        if (known.length === 0) {
          setParseError(
            "No recognized columns found. Download the template to see the expected header row.",
          );
          setRows(null);
        } else {
          setParseError(null);
          setRows(scoreRows(res.data));
        }
        setFileName(file.name);
      },
      error: (err: Error) => {
        setParseError(err.message);
        setRows(null);
        setFileName(file.name);
      },
    });
  };

  const handleTemplate = () => {
    downloadCsv(
      Papa.unparse([EXAMPLE_PATIENTS.lowRisk.values], { columns: FIELD_KEYS }),
      "prism-batch-template.csv",
    );
  };

  const handleExport = () => {
    if (!rows) return;
    const exported = rows.map((r) => ({
      ...Object.fromEntries(FIELD_KEYS.map((key) => [key, r.form[key]])),
      predicted_risk_pct: (r.probability * 100).toFixed(1),
      risk_tier: r.tier.label,
      top_factors: r.topFactors.join("; "),
      implausible_values: r.issues.join("; "),
    }));
    downloadCsv(Papa.unparse(exported), "prism-batch-results.csv");
  };

  return (
    <div>
      <SectionIntro
        title="Batch Risk Scoring"
        body="Score multiple patients at once from a CSV file. Each row is run through the same model as the calculator, entirely in your browser. No data leaves this device."
      />

      <div className="mb-6 mt-5 flex flex-wrap items-center gap-2.5">
        <button
          onClick={handleTemplate}
          className="flex items-center gap-1.5 rounded-lg border border-prism-teal/40 bg-prism-card px-3.5 py-2 text-xs font-semibold text-prism-teal transition-colors hover:bg-prism-teal hover:text-white"
        >
          <Download className="size-3.5" />
          Download template CSV
        </button>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-prism-dark px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-prism-dark-light">
          <FileUp className="size-3.5" />
          Upload CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </label>
        {fileName && (
          <span className="text-xs text-prism-muted">{fileName}</span>
        )}
      </div>

      {parseError && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-prism-red/40 bg-prism-red/10 px-4 py-3 text-xs text-prism-text">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-prism-red" />
          {parseError}
        </div>
      )}

      {rows && (
        <div className="rounded-2xl border border-prism-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-prism-text">
              {rows.length} patient{rows.length === 1 ? "" : "s"} scored
            </span>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-lg border border-prism-teal/40 px-3 py-1.5 text-xs font-semibold text-prism-teal transition-colors hover:bg-prism-teal hover:text-white"
            >
              <Download className="size-3" />
              Export results CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-prism-border text-[10.5px] uppercase tracking-wide text-prism-teal">
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">Age</th>
                  <th className="px-2 py-2">Gender</th>
                  <th className="px-2 py-2">Admission</th>
                  <th className="px-2 py-2">Risk</th>
                  <th className="px-2 py-2">Tier</th>
                  <th className="px-2 py-2">Top factors</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.index}
                    className="border-b border-prism-border/60"
                  >
                    <td className="px-2 py-2 text-prism-muted">{row.index}</td>
                    <td className="px-2 py-2">{row.form.age}</td>
                    <td className="px-2 py-2">{row.form.gender}</td>
                    <td className="px-2 py-2">{row.form.admission_type}</td>
                    <td
                      className="px-2 py-2 font-semibold"
                      style={{ color: row.tier.colorVar }}
                    >
                      {(row.probability * 100).toFixed(1)}%
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${row.tier.colorVar} 15%, white)`,
                          color: row.tier.colorVar,
                        }}
                      >
                        {row.tier.label}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-prism-muted">
                      {row.topFactors.join(", ")}
                    </td>
                    <td className="px-2 py-2">
                      {row.issues.length > 0 && (
                        <span
                          title={`Implausible values: ${row.issues.join(", ")}`}
                        >
                          <AlertTriangle className="size-3.5 text-prism-amber" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[10.5px] leading-snug text-prism-muted-2">
            Missing or invalid values fall back to training-set medians, exactly
            as in the calculator. Rows flagged with a warning contain
            physiologically implausible values. Review them before interpreting
            results.
          </p>
        </div>
      )}

      <p className="mt-7 max-w-3xl text-xs leading-relaxed text-prism-muted-2">
        Educational output only, not clinical advice. PRISM is a research and
        demonstration tool and is not validated for clinical use or real patient
        decision-making.
      </p>
    </div>
  );
}
