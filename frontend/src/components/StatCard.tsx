interface StatCardProps {
  title: string;
  value: string;
  hint?: string;
}

export function StatCard({ title, value, hint }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-panel">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-600">{hint}</p> : null}
    </div>
  );
}
