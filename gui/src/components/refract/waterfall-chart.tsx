import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  buildWaterfallSteps,
  type WaterfallStep,
} from "../../engine/waterfall";
import type { PredictionResult } from "../../types";

const COLORS: Record<WaterfallStep["kind"], string> = {
  anchor: "var(--color-prism-dark)",
  up: "var(--color-prism-red)",
  down: "var(--color-prism-seafoam)",
};

interface WaterfallRow extends WaterfallStep {
  offset: number;
  span: number;
}

function toRows(steps: WaterfallStep[]): WaterfallRow[] {
  return steps.map((s) => ({
    ...s,
    offset: Math.min(s.from, s.to) * 100,
    span: Math.max(Math.abs(s.to - s.from) * 100, 0.15),
  }));
}

function WaterfallTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: WaterfallRow }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const deltaPts = (row.to - row.from) * 100;
  return (
    <div className="rounded-lg border border-prism-border bg-white px-3 py-2 text-xs shadow-md">
      <div className="font-semibold text-prism-text">{row.name}</div>
      {row.kind === "anchor" ? (
        <div className="text-prism-muted">{(row.to * 100).toFixed(1)}%</div>
      ) : (
        <div
          className={
            row.kind === "up" ? "text-prism-red" : "text-prism-seafoam"
          }
        >
          {deltaPts >= 0 ? "+" : ""}
          {deltaPts.toFixed(1)} pts &rarr; {(row.to * 100).toFixed(1)}%
        </div>
      )}
    </div>
  );
}

export function WaterfallChart({ result }: { result: PredictionResult }) {
  const rows = toRows(buildWaterfallSteps(result));

  return (
    <div>
      <ResponsiveContainer width="100%" height={rows.length * 30 + 30}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 12, bottom: 0, left: 4 }}
        >
          <XAxis
            type="number"
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            tick={{ fontSize: 10, fill: "var(--color-prism-muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={104}
            tick={{ fontSize: 10, fill: "var(--color-prism-text)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<WaterfallTooltip />}
            cursor={{ fill: "var(--color-prism-card)" }}
          />
          <Bar
            dataKey="offset"
            stackId="w"
            fill="transparent"
            isAnimationActive={false}
          />
          <Bar dataKey="span" stackId="w" radius={2} isAnimationActive={false}>
            {rows.map((row) => (
              <Cell key={row.name} fill={COLORS[row.kind]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-[10.5px] leading-snug text-prism-muted-2">
        Starting from a typical cohort patient (median inputs), each factor
        shows how this patient differs. Steps are shown in probability space for
        readability; because the model combines factors on the log-odds scale,
        step sizes depend on their order (largest contributions first).
      </p>
    </div>
  );
}
