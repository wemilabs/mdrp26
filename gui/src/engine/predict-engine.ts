import modelData from "../data/model.json";
import type {
  ModelExport,
  PatientFormValues,
  PredictionResult,
  RankedFactor,
  TreeNode,
} from "../types";

const MODEL = modelData as unknown as ModelExport;

const FEATURE_LABELS: Record<string, string> = {
  dbp: "Diastolic BP",
  heart_rate: "Heart rate",
  resp_rate: "Respiratory rate",
  sbp: "Systolic BP",
  spo2: "SpO\u2082",
  temp_f: "Temperature",
  bicarbonate: "Bicarbonate",
  bun: "BUN",
  creatinine: "Creatinine",
  glucose: "Glucose",
  hemoglobin: "Hemoglobin",
  lactate: "Lactate",
  platelets: "Platelets",
  potassium: "Potassium",
  sodium: "Sodium",
  wbc: "WBC",
  age: "Age",
  los: "ICU length of stay",
  n_comorbidities: "Comorbidity count",
};

const LABEL_TO_FIELD: Record<string, string> = Object.fromEntries(
  Object.entries(FEATURE_LABELS).map(([key, label]) => [label, key]),
);

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

const BASE_LOGIT = Math.log(MODEL.base_score / (1 - MODEL.base_score));

function standardize(raw: number, mean: number, scale: number): number {
  return (raw - mean) / scale;
}

function buildFeatureVector(form: PatientFormValues): number[] {
  const catLength = MODEL.cat_categories.reduce((sum, c) => sum + c.length, 0);
  const vec = new Array<number>(MODEL.numeric_cols.length + catLength).fill(0);

  MODEL.numeric_cols.forEach((col, i) => {
    const base = col.replace(/_(mean|min|max)$/, "");
    const raw = Number(form[base]);
    const value = Number.isFinite(raw) ? raw : MODEL.medians[i];
    vec[i] = standardize(value, MODEL.means[i], MODEL.scales[i]);
  });

  let offset = MODEL.numeric_cols.length;
  MODEL.cat_categories.forEach((cats, ci) => {
    const field = MODEL.categorical_cols[ci];
    const chosen = (form[field] as string) || MODEL.cat_modes[ci];
    cats.forEach((cat) => {
      vec[offset] = cat === chosen ? 1 : 0;
      offset += 1;
    });
  });

  return vec;
}

function traverseTree(
  tree: TreeNode,
  x: number[],
  contribs: Record<number, number>,
): number {
  let node = 0;
  let pathValue = tree.w[0];
  while (tree.l[node] !== -1) {
    const fidx = tree.f[node];
    const cond = Math.fround(tree.c[node]);
    const val = Math.fround(x[fidx]);
    const next = val < cond ? tree.l[node] : tree.r[node];
    const nextValue = tree.w[next];
    contribs[fidx] = (contribs[fidx] ?? 0) + (nextValue - pathValue);
    node = next;
    pathValue = nextValue;
  }
  return pathValue;
}

/**
 * Runs the embedded, validated gradient-boosted model against a patient's
 * input values entirely on the client, returning a mortality probability,
 * a ranked list of contributing clinical factors, and the per-tree leaf
 * logits + raw margin variance used for uncertainty estimation.
 */
export function predict(form: PatientFormValues): PredictionResult {
  const x = buildFeatureVector(form);
  const contribs: Record<number, number> = {};
  const treeLogits: number[] = [];
  let margin = 0;

  MODEL.trees.forEach((tree) => {
    const leafValue = traverseTree(tree, x, contribs);
    treeLogits.push(leafValue);
    margin += leafValue;
  });

  const probability = sigmoid(margin + BASE_LOGIT);

  const meanLeaf = treeLogits.reduce((s, v) => s + v, 0) / treeLogits.length;
  const marginVariance = treeLogits.reduce(
    (s, v) => s + (v - meanLeaf) ** 2,
    0,
  );

  const byName: Record<string, number> = {};

  Object.entries(contribs).forEach(([idxStr, val]) => {
    const idx = Number(idxStr);
    let name: string;
    if (idx < MODEL.numeric_cols.length) {
      const base = MODEL.numeric_cols[idx].replace(/_(mean|min|max)$/, "");
      name = FEATURE_LABELS[base] ?? base;
    } else {
      name =
        idx < MODEL.numeric_cols.length + MODEL.cat_categories[0].length
          ? "Gender"
          : "Admission type";
    }
    byName[name] = (byName[name] ?? 0) + val;
  });

  const ranked: RankedFactor[] = Object.entries(byName)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return { probability, ranked, treeLogits, marginVariance };
}

export { BASE_LOGIT, FEATURE_LABELS, LABEL_TO_FIELD, MODEL, sigmoid };
