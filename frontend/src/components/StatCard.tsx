interface StatCardProps {
  title: string;
  value: string;
  hint?: string;
}

export function StatCard({ title, value, hint }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-slate-200/90 bg-[linear-gradient(145deg,#ffffff_0%,#f8fafc_55%,#eff6ff_100%)] p-5 shadow-panel">
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-orange-100/70 blur-2xl" />
      <div className="relative">
        <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-700">
          Metric
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{value}</p>
        {hint ? <p className="mt-2 text-xs text-slate-600">{hint}</p> : null}
      </div>
    </div>
  );
}
