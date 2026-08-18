import { FileBarChart } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
} from "recharts";
import {
  bivariate,
  cvAuroc,
  holdoutAuroc,
  overlapData,
  shapTop,
  thresholdData,
} from "../../data/spectrum-data";
import { buildDashboardReportHTML } from "../../engine/report-builder";
import { ChartCard } from "./chart-card";
import { ListCard } from "./list-card";

const TEAL = "#028090";
const SEAFOAM = "#00a896";
const MINT = "#02c39a";
const RED = "#c4432b";
const MUTED = "#5b7472";
const TEXT = "#1f3436";

function holdoutBar({ index, ...rectProps }: Omit<BarShapeProps, "value">) {
  const fill = index === 1 ? MINT : index === 2 ? TEAL : MUTED;
  return <Rectangle {...rectProps} fill={fill} />;
}

interface DashboardContentProps {
  onShowReport: (html: string) => void;
}

export function DashboardContent({ onShowReport }: DashboardContentProps) {
  return (
    <>
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => onShowReport(buildDashboardReportHTML())}
          className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-prism-teal/40 bg-prism-card px-3.5 py-2 text-xs font-semibold text-prism-teal transition-colors hover:bg-prism-teal hover:text-white"
        >
          <FileBarChart className="h-3.5 w-3.5" />
          View / Print Performance Report
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        <ChartCard title="Held-Out Test AUROC">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={holdoutAuroc}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e0e8e8"
                vertical={false}
              />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: MUTED }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: MUTED }} />
              <Tooltip formatter={(v: any) => Number(v).toFixed(3)} />
              <ReferenceLine y={0.5} stroke="#b9cbc9" strokeDasharray="4 4" />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} shape={holdoutBar}>
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(v: any) => Number(v).toFixed(3)}
                  style={{ fontSize: 11, fill: TEXT, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="5-Fold Cross-Validated AUROC (mean)"
          footnote="Wide fold-to-fold variance reflects the cohort's small size."
        >
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={cvAuroc}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e0e8e8"
                vertical={false}
              />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: MUTED }} />
              <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: MUTED }} />
              <Tooltip formatter={(v: any) => Number(v).toFixed(3)} />
              <ReferenceLine y={0.5} stroke="#b9cbc9" strokeDasharray="4 4" />
              <Bar dataKey="value" fill={SEAFOAM} radius={[6, 6, 0, 0]}>
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(v: any) => Number(v).toFixed(3)}
                  style={{ fontSize: 11, fill: TEXT, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sensitivity: Default vs. Optimal Threshold">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={thresholdData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e0e8e8"
                vertical={false}
              />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: MUTED }} />
              <YAxis domain={[0, 1.05]} tick={{ fontSize: 11, fill: MUTED }} />
              <Tooltip formatter={(v: any) => Number(v).toFixed(3)} />
              <Bar dataKey="Default" fill={RED} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Optimal" fill={MINT} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top-5 Contributing Features">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={shapTop}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e0e8e8"
                horizontal={false}
              />
              <XAxis type="number" tick={{ fontSize: 11, fill: MUTED }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: TEXT }}
                width={110}
              />
              <Tooltip formatter={(v: any) => Number(v).toFixed(3)} />
              <Bar dataKey="value" fill={TEAL} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <ListCard
          title="Cross-Method Explanation Agreement"
          rows={overlapData.map((o) => ({ label: o.pair, value: o.frac }))}
        />
        <ListCard
          title="Significant Clinical Associations"
          rows={bivariate.map((b) => ({ label: b.label, value: b.p }))}
        />
      </div>
    </>
  );
}
