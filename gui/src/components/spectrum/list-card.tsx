interface ListCardProps {
  title: string;
  rows: { label: string; value: string }[];
}

export function ListCard({ title, rows }: ListCardProps) {
  return (
    <div className="rounded-2xl border border-prism-border bg-white p-5 shadow-sm">
      <div className="mb-1 text-[13px] font-bold text-prism-text">{title}</div>
      <div className="divide-y divide-prism-card">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-2.5">
            <span className="text-sm text-prism-text">{r.label}</span>
            <span className="font-display text-base font-bold text-prism-teal">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
