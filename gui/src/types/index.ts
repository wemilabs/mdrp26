export interface TreeNode {
  l: number[]; // left child indices
  r: number[]; // right child indices
  c: number[]; // split conditions
  f: number[]; // split feature indices
  w: number[]; // node/leaf weights
};

export interface ModelExport {
  base_score: number;
  trees: TreeNode[];
  numeric_cols: string[];
  categorical_cols: string[];
  medians: number[];
  means: number[];
  scales: number[];
  cat_modes: string[];
  cat_categories: string[][];
};

export type PatientFormValues = Record<string, string | number>;

export interface RankedFactor {
  name: string;
  value: number;
};

export interface PredictionResult {
  probability: number;
  ranked: RankedFactor[];
};

export interface RiskTier {
  label: "Low" | "Moderate" | "Elevated" | "High";
  colorVar: string;
};

export interface Recommendation {
  tierLabel: string;
  summary: string;
  items: { factor: string; advice: string }[];
};

export type FieldType = "number" | "select";

export interface FieldDefinition {
  key: string;
  label: string;
  unit?: string;
  type: FieldType;
  options?: string[];
  note?: string;
};

export interface FieldGroup {
  title: string;
  fields: FieldDefinition[];
};
