const STATS = [
  { value: "98", label: "ICU stays analyzed" },
  { value: "10.2%", label: "In-hospital mortality" },
  { value: "0.818", label: "Best AUROC (Random Forest)" },
  { value: "59", label: "Model input features" },
];

export function StatRow() {
  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
      {STATS.map((s) => (
        <div key={s.label} className="rounded-2xl bg-prism-dark px-4 py-4 shadow-sm">
          <div className="font-display text-[26px] font-bold text-prism-mint">{s.value}</div>
          <div className="mt-0.5 text-xs text-white/70">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
