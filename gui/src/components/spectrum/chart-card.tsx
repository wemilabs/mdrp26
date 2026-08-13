interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  footnote?: string;
}

export function ChartCard({ title, children, footnote }: ChartCardProps) {
  return (
    <div className="rounded-2xl border border-prism-border bg-white p-5 shadow-sm">
      <div className="mb-1.5 text-[13px] font-bold text-prism-text">{title}</div>
      {children}
      {footnote && <p className="mt-1 text-center text-[11px] text-prism-muted-2">{footnote}</p>}
    </div>
  );
}
